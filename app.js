// ==========================================================================
// MONARCC — Clean Luxury Streetwear Application Controller
// Architectural & Business Logic: Scroll Machine, 4-Item Rhythm Breakers,
// 2-by-2 Video Lookbooks, Inter Rapidísimo Tracking, Google Pay,
// Cart Drawer & Secret Monarca VIP Easter Egg
// ==========================================================================

(function () {
  'use strict';

  // ---------- STATE ----------
  const state = {
    products: (window.MONARCC && window.MONARCC.products) || [],
    vip: (window.MONARCC && window.MONARCC.vip) || null,
    reviews: (window.MONARCC && window.MONARCC.reviews) || [],
    shipping: (window.MONARCC && window.MONARCC.shipping) || {},

    cart: [],
    selectedCat: 'TODOS',
    searchQuery: '',
    selectedSize: null,
    selectedColor: null,
    maxPrice: 220000,
    onlySeasonal: false,
    vipUnlocked: false,

    appliedCoupons: new Map(), // code -> percent (e.g. 'MONARCC15' -> 15)
    shippingLocation: {
      dept: 'Cundinamarca',
      city: 'Soacha',
      zone: 'local',
      cost: 8900
    },

    // per-product active options: productId -> { size, colorIdx, slideIdx }
    cardOptions: {},

    // easter egg tap tracking
    crownTaps: 0,
    crownTapTimer: null,
    keyBuffer: ''
  };

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initScrollMachine();
    initShippingSelects();
    renderCatalog();
    renderReviews();
    setupEventListeners();
    setupEasterEgg();
    setupCountdown();
    setupMobileDock();
    setupTouchGestures();
  });

  // ==========================================================================
  // 1. PRELOADER EDITORIAL
  // ==========================================================================
  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('preloader-counter');
    const fill = document.getElementById('preloader-fill');
    if (!preloader || !counter || !fill) return;

    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.floor(Math.random() * 9) + 4;
      if (pct >= 100) {
        pct = 100;
        clearInterval(timer);
        counter.textContent = '100%';
        fill.style.width = '100%';
        setTimeout(() => {
          preloader.classList.add('is-done');
          setTimeout(() => {
            preloader.style.display = 'none';
          }, 950);
        }, 350);
      } else {
        counter.textContent = (pct < 10 ? '0' : '') + pct + '%';
        fill.style.width = pct + '%';
      }
    }, 40);
  }

  // ==========================================================================
  // 2. SCROLL STATE MACHINE
  // ==========================================================================
  function initScrollMachine() {
    let lastY = 0;
    const body = document.body;

    window.addEventListener('scroll', () => {
      const y = window.scrollY || window.pageYOffset;
      if (y > 60) {
        body.classList.add('is-scrolled');
      } else {
        body.classList.remove('is-scrolled');
      }
      lastY = y;
    }, { passive: true });
  }

  // ==========================================================================
  // 3. CATALOG RENDERING CON REGLA DE ORO (BREAKERS & 2 VIDEOS POR SECCIÓN)
  // ==========================================================================
  function getFilteredProducts() {
    let list = [...state.products];

    // Category
    if (state.selectedCat && state.selectedCat !== 'TODOS') {
      list = list.filter(p => p.category.toLowerCase() === state.selectedCat.toLowerCase());
    }

    // Search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.colors.some(c => c.name.toLowerCase().includes(q))
      );
    }

    // Size
    if (state.selectedSize) {
      list = list.filter(p => p.sizes.includes(state.selectedSize));
    }

    // Color
    if (state.selectedColor) {
      list = list.filter(p =>
        p.colors.some(c => c.name.toLowerCase().includes(state.selectedColor.toLowerCase()))
      );
    }

    // Price
    list = list.filter(p => p.price <= state.maxPrice);

    // Seasonal offers filter
    if (state.onlySeasonal) {
      list = list.filter(p => (p.realPrice - p.price) / p.realPrice >= 0.20);
    }

    return list;
  }

  function renderCatalog() {
    const grid = document.getElementById('products-grid-container');
    const empty = document.getElementById('no-results-state');
    const stockCounter = document.getElementById('header-stock-count');
    const inventoryCount = document.getElementById('sidebar-inventory-count');
    if (!grid) return;

    const list = getFilteredProducts();

    // Calculate total stock units available
    let totalStock = list.reduce((sum, p) => sum + p.colors.reduce((s, c) => s + c.stock, 0), 0);
    if (state.vipUnlocked && state.vip) totalStock += state.vip.colors[0].stock;

    if (stockCounter) stockCounter.textContent = `${totalStock} UDS EN STOCK`;
    if (inventoryCount) inventoryCount.textContent = totalStock;

    if (list.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    let html = '';
    const isFiltered = (state.selectedCat !== 'TODOS' || state.searchQuery || state.selectedSize || state.selectedColor || state.onlySeasonal);

    // Render items with rhythmic breakers
    list.forEach((p, idx) => {
      html += renderProductCard(p);

      const count = idx + 1;

      // Breakers only in full default catalog view to avoid broken filtered states
      if (!isFiltered) {
        // Breaker 1: After item 4 -> Drop Motorsport Countdown
        if (count === 4) {
          html += renderBreakerDrop();
        }
        // Breaker 2: After item 6 -> Video Lookbook Pair 1 (2 videos)
        else if (count === 6) {
          html += renderBreakerVideosPair1();
        }
        // Breaker 3: After item 8 -> Video Lookbook Pair 2 (2 videos)
        else if (count === 8) {
          html += renderBreakerVideosPair2();
        }
      }
    });

    // Breaker 4 & Locked VIP item at the end of default view
    if (!isFiltered) {
      html += renderBreakerSeason();
      html += renderVipCard();
    } else if (state.vipUnlocked && state.vip) {
      html += renderVipCard();
    }

    grid.innerHTML = html;
    updateActiveFilterBar();
  }

  // --- PRODUCT CARD COMPONENT ---
  function renderProductCard(p) {
    const opts = state.cardOptions[p.id] || {
      size: p.sizes[0],
      colorIdx: 0,
      slideIdx: 0
    };
    state.cardOptions[p.id] = opts;

    const activeColor = p.colors[opts.colorIdx] || p.colors[0];
    const discountPct = Math.round(((p.realPrice - p.price) / p.realPrice) * 100);
    const stock = activeColor.stock;
    const isCritical = stock <= 3;

    // All slides are crops of the active color's photo
    const slides = [
      { pos: p.main.pos, zoom: p.main.zoom, label: 'Plano General' },
      ...p.views
    ];

    const isVipCard = p.isVip;

    return `
      <article class="card ${isVipCard ? 'card-vip' : ''}" data-id="${p.id}" id="card-${p.id}">
        <!-- Media Slider -->
        <div class="card-media" id="media-${p.id}">
          <div class="card-tags">
            <div class="stack">
              ${isVipCard ? '<span class="tag tag-gold">👑 VIP SECRET DROP</span>' : ''}
              ${isCritical ? `<span class="tag tag-red"><span class="live warn"></span> ÚLTIMAS ${stock} UDS</span>` : `<span class="tag"><span class="live"></span> ${stock} EN STOCK</span>`}
            </div>
            <span class="save">-${discountPct}%</span>
          </div>

          <!-- Slider Images -->
          <div class="slider" id="slider-${p.id}" onscroll="window.MONARCC_APP.onSliderScroll('${p.id}', this)">
            ${slides.map((v, i) => `
              <div class="slide-item">
                <img src="${activeColor.img}" alt="${p.name} - ${v.label}"
                     style="object-position: ${v.pos}; transform: scale(${v.zoom}); transform-origin: ${v.pos};"
                     loading="lazy" draggable="false">
                <span class="slide-label">${v.label}</span>
              </div>
            `).join('')}
          </div>

          <!-- Slide Controls -->
          <button type="button" class="slide-arrow prev" onclick="window.MONARCC_APP.slide('${p.id}', -1)" aria-label="Anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" class="slide-arrow next" onclick="window.MONARCC_APP.slide('${p.id}', 1)" aria-label="Siguiente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <!-- Slide Progress -->
          <div class="slide-progress">
            <span id="progress-${p.id}" style="width: ${100 / slides.length}%;"></span>
          </div>

          <!-- Quick View Trigger -->
          <button type="button" class="quick-btn" onclick="window.MONARCC_APP.openQuickView('${p.id}')">
            VISTA RÁPIDA ↗
          </button>
        </div>

        <!-- Body -->
        <div class="card-body">
          <div class="card-meta">
            <span>${p.category}</span>
            <span>MADE IN SOACHA</span>
          </div>

          <h3 class="card-title" onclick="window.MONARCC_APP.openQuickView('${p.id}')" title="${p.name}">
            ${p.name}
          </h3>

          <div class="price-row">
            <span class="price-old mono">$${p.realPrice.toLocaleString('es-CO')}</span>
            <span class="price mono">$${p.price.toLocaleString('es-CO')} COP</span>
          </div>

          <!-- Size & Color Selectors -->
          <div class="card-options">
            <div class="sizes">
              ${p.sizes.map(sz => `
                <button type="button" class="size ${sz === opts.size ? 'is-active' : ''}"
                        onclick="window.MONARCC_APP.selectSize('${p.id}', '${sz}')">${sz}</button>
              `).join('')}
            </div>

            ${p.colors.length > 1 ? `
              <div class="swatches">
                ${p.colors.map((c, idx) => `
                  <button type="button" class="swatch ${idx === opts.colorIdx ? 'is-active' : ''}"
                          style="background: ${c.hex};"
                          title="${c.name} (${c.stock} uds)"
                          onclick="window.MONARCC_APP.selectColor('${p.id}', ${idx})"></button>
                `).join('')}
              </div>
            ` : `<span class="mono dim" style="font-size: 11px;">${activeColor.name}</span>`}
          </div>

          <!-- Add to Bag -->
          <button type="button" class="btn btn-dark btn-block" onclick="window.MONARCC_APP.addToCart('${p.id}')">
            AÑADIR A LA BOLSA
          </button>
        </div>
      </article>
    `;
  }

  // --- BREAKER 1: DROP MOTORSPORT 2026 COUNTDOWN BANNER ---
  function renderBreakerDrop() {
    return `
      <div class="breaker" id="drop-breaker">
        <div class="breaker-drop">
          <div class="breaker-copy">
            <span class="eyebrow"><span class="dot"></span> EDICIÓN LIMITADA MOTORSPORT 2026</span>
            <h2 class="h-display" style="font-size: clamp(26px, 3.8vw, 44px); margin: 0;">
              SOACHA SYNDICATE // COLECCIÓN RACING
            </h2>
            <p class="lead">
              Inspirada en el motociclismo y la cultura de pista. Confeccionada con cuello alto estructurado, parches termosellados de alta resistencia y cremalleras de doble vía.
            </p>

            <!-- Countdown Timer -->
            <div class="countdown">
              <div>
                <b id="cd-days">02</b>
                <small>DÍAS</small>
              </div>
              <div>
                <b id="cd-hours">14</b>
                <small>HORAS</small>
              </div>
              <div>
                <b id="cd-mins">38</b>
                <small>MIN</small>
              </div>
              <div>
                <b id="cd-secs">19</b>
                <small>SEG</small>
              </div>
            </div>

            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;">
              <a href="https://wa.me/573236043408?text=Hola%20Monarcc,%20quiero%20separar%20mi%20prenda%20del%20drop%20Motorsport" target="_blank" class="btn btn-gold">
                SEPARAR POR WHATSAPP ↗
              </a>
              <button type="button" class="btn btn-ghost" onclick="window.MONARCC_APP.openQuickView('p02')">
                VER CHAQUETA ORACLE
              </button>
            </div>
          </div>

          <div class="breaker-media">
            <img src="media/generated_redbull_white.jpg" alt="Chaqueta Racing Oracle Monarcc" loading="lazy">
          </div>
        </div>
      </div>
    `;
  }

  // --- BREAKER 2: VIDEO LOOKBOOK PAIR 1 (EXACTLY 2 VIDEOS) ---
  function renderBreakerVideosPair1() {
    return `
      <div class="breaker" id="lookbook-1">
        <div class="breaker-video">
          <div class="breaker-copy">
            <span class="eyebrow"><span class="dot"></span> LOOKBOOK EN MOVIMIENTO • VOL. 01</span>
            <h2 class="h-display" style="font-size: clamp(24px, 3.2vw, 38px); margin: 0;">
              TACTO &amp; CAÍDA DEL PERCHADO 320G
            </h2>
            <p class="lead">
              Murales de video editorial grabados en el estudio. Reproducción continua sin cortes para apreciar la textura del algodón peinado.
            </p>

            <ul class="detail-list">
              <li>Cremallera metálica reforzada de dientes gruesos</li>
              <li>Capota doblemente estructurada que no se deforma</li>
              <li>Bordado de alta densidad con hilo japonés</li>
            </ul>

            <div style="margin-top: 12px;">
              <button type="button" class="btn btn-dark" onclick="window.MONARCC_APP.filterCat('Hoodies')">
                EXPLORAR HOODIES
              </button>
            </div>
          </div>

          <!-- Video Pair (2 Videos) -->
          <div class="video-pair">
            <div class="reel">
              <video src="media/post_003_DeMmJezRqur/video_01.mp4" playsinline loop muted autoplay></video>
              <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Activar sonido">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <div class="reel-label">
                <b>HOODIE JPN // DETALLE</b>
                <span>Cierre metálico y textura</span>
              </div>
            </div>

            <div class="reel">
              <video src="media/post_004_DeGJ5SmO2kZ/video_01.mp4" playsinline loop muted autoplay></video>
              <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Activar sonido">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <div class="reel-label">
                <b>CAÍDA POSTERIOR</b>
                <span>Corte Boxy Oversize</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- BREAKER 3: VIDEO LOOKBOOK PAIR 2 (EXACTLY 2 VIDEOS) ---
  function renderBreakerVideosPair2() {
    return `
      <div class="breaker" id="lookbook-2">
        <div class="breaker-video reverse">
          <div class="breaker-copy">
            <span class="eyebrow"><span class="dot"></span> LOOKBOOK EN MOVIMIENTO • VOL. 02</span>
            <h2 class="h-display" style="font-size: clamp(24px, 3.2vw, 38px); margin: 0;">
              LÍNEA SCUDERIA &amp; OUTFITS DE CALLE
            </h2>
            <p class="lead">
              Detalle de forros y terminaciones de cuello alto. Piezas diseñadas para el frío de la sabana y el asfalto.
            </p>

            <ul class="detail-list">
              <li>Franjas termoselladas con acabado mate</li>
              <li>Puños acanalados de alta elasticidad</li>
              <li>Corte anatómico probado en el estudio</li>
            </ul>

            <div style="margin-top: 12px;">
              <button type="button" class="btn btn-dark" onclick="window.MONARCC_APP.filterCat('Chaquetas')">
                EXPLORAR CHAQUETAS
              </button>
            </div>
          </div>

          <!-- Video Pair (2 Videos) -->
          <div class="video-pair">
            <div class="reel">
              <video src="media/post_001_DekfatDsou8/video_01.mp4" playsinline loop muted autoplay></video>
              <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Activar sonido">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <div class="reel-label">
                <b>SCUDERIA WHITE</b>
                <span>Cuello alto &amp; cremallera</span>
              </div>
            </div>

            <div class="reel">
              <video src="media/post_007_Dc_jNaKxknN/video_01.mp4" playsinline loop muted autoplay></video>
              <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Activar sonido">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <div class="reel-label">
                <b>OUTFIT COMPLETO</b>
                <span>Streetwear en movimiento</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- BREAKER 4: SEASON OFFERS & CRITICAL STOCK ---
  function renderBreakerSeason() {
    return `
      <div class="breaker" id="season-breaker">
        <div class="breaker-season">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="tag tag-red"><span class="live warn"></span> STOCK CRÍTICO</span>
              <span class="eyebrow" style="color: #FECACA;">DESCUENTO ESPECIAL DE TEMPORADA</span>
            </div>
            <h3 class="h-display" style="font-size: clamp(22px, 3vw, 34px); margin: 0 0 6px;">
              PRENDAS DE TEMPORADA // HASTA -23% OFF
            </h3>
            <p class="muted" style="margin: 0; font-size: 14px; max-width: 600px;">
              Últimas unidades en inventario antes del cierre de producción del drop actual. Despacho prioritario en 24h.
            </p>
          </div>

          <div style="display: flex; gap: 10px; flex-shrink: 0;">
            <button type="button" class="btn btn-gold" onclick="window.MONARCC_APP.filterSeasonal()">
              VER PRENDAS DE TEMPORADA
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // --- VIP SECRET CARD COMPONENT ---
  function renderVipCard() {
    if (!state.vip) return '';
    const v = state.vip;

    if (state.vipUnlocked) {
      return renderProductCard(v);
    }

    // Locked Card (Accessible mystery easter egg)
    return `
      <article class="card card-locked" onclick="window.MONARCC_APP.onLockedCardClick()" title="Pieza Secreta — Haz clic para desbloquear">
        <div class="card-media">
          <img src="${v.colors[0].img}" alt="Pieza Secreta VIP" loading="lazy">
          <div class="lock-overlay">
            <svg viewBox="0 0 100 80" fill="none" stroke="currentColor" stroke-width="3"><line x1="16" y1="66" x2="84" y2="66"/><polyline points="18,62 16,30 35,48 50,18 65,48 84,30 82,62"/><circle cx="16" cy="24" r="3.5" fill="currentColor"/><circle cx="50" cy="11" r="4" fill="currentColor"/><circle cx="84" cy="24" r="3.5" fill="currentColor"/></svg>
            <strong>CÍRCULO MONARCA VIP</strong>
            <small>Pieza confidencial bloqueada. Toca 3 veces la corona o haz clic aquí para desbloquear.</small>
            <div class="lock-taps" id="lock-taps">
              <i></i><i></i><i></i>
            </div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span style="color: var(--gold);">EXCLUSIVO VIP</span>
            <span class="mono">1 UNIDAD</span>
          </div>
          <h3 class="card-title" style="color: var(--gold);">Chaqueta Monarca Golden Crown</h3>
          <div class="price-row">
            <span class="price mono gold-text">$219.900 COP</span>
          </div>
          <button type="button" class="btn btn-gold btn-block" style="margin-top: auto;">
            DESBLOQUEAR ACCESO VIP
          </button>
        </div>
      </article>
    `;
  }

  // ==========================================================================
  // 4. HORIZONTAL SLIDER & OPTIONS INTERACTION
  // ==========================================================================
  function slide(productId, dir) {
    const slider = document.getElementById(`slider-${productId}`);
    if (!slider) return;
    const itemWidth = slider.clientWidth;
    slider.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
  }

  function onSliderScroll(productId, sliderEl) {
    const idx = Math.round(sliderEl.scrollLeft / sliderEl.clientWidth);
    const progress = document.getElementById(`progress-${productId}`);
    const slidesCount = sliderEl.querySelectorAll('.slide-item').length || 1;
    if (progress) {
      const pct = ((idx + 1) / slidesCount) * 100;
      progress.style.width = pct + '%';
    }
  }

  function selectSize(productId, size) {
    if (!state.cardOptions[productId]) state.cardOptions[productId] = {};
    state.cardOptions[productId].size = size;

    const card = document.getElementById(`card-${productId}`);
    if (!card) return;
    card.querySelectorAll('.sizes .size').forEach(btn => {
      btn.classList.toggle('is-active', btn.textContent.trim() === size);
    });
  }

  function selectColor(productId, colorIdx) {
    if (!state.cardOptions[productId]) state.cardOptions[productId] = {};
    state.cardOptions[productId].colorIdx = colorIdx;

    const p = state.products.find(x => x.id === productId) || (state.vip && state.vip.id === productId ? state.vip : null);
    if (!p) return;

    const activeColor = p.colors[colorIdx] || p.colors[0];

    const card = document.getElementById(`card-${productId}`);
    if (!card) return;

    // Update active swatch
    card.querySelectorAll('.swatches .swatch').forEach((swatch, i) => {
      swatch.classList.toggle('is-active', i === colorIdx);
    });

    // Update all slides in this card to the new color image
    const slider = document.getElementById(`slider-${productId}`);
    if (slider) {
      slider.querySelectorAll('.slide-item img').forEach(img => {
        img.src = activeColor.img;
      });
    }

    // Update tags
    const stack = card.querySelector('.card-tags .stack');
    if (stack) {
      const isCritical = activeColor.stock <= 3;
      const isVipCard = p.isVip;
      stack.innerHTML = `
        ${isVipCard ? '<span class="tag tag-gold">👑 VIP SECRET DROP</span>' : ''}
        ${isCritical ? `<span class="tag tag-red"><span class="live warn"></span> ÚLTIMAS ${activeColor.stock} UDS</span>` : `<span class="tag"><span class="live"></span> ${activeColor.stock} EN STOCK</span>`}
      `;
    }
  }

  // ==========================================================================
  // 5. QUICK VIEW MODAL
  // ==========================================================================
  function openQuickView(productId) {
    const p = state.products.find(x => x.id === productId) || (state.vip && state.vip.id === productId ? state.vip : null);
    if (!p) return;

    const opts = state.cardOptions[p.id] || {
      size: p.sizes[0],
      colorIdx: 0,
      slideIdx: 0
    };
    const activeColor = p.colors[opts.colorIdx] || p.colors[0];

    const slides = [
      { pos: p.main.pos, zoom: p.main.zoom, label: 'Plano General' },
      ...p.views
    ];

    const discountPct = Math.round(((p.realPrice - p.price) / p.realPrice) * 100);

    const content = document.getElementById('quick-view-content');
    if (!content) return;

    content.innerHTML = `
      <div class="qv">
        <div class="qv-media">
          <div class="slider" id="qv-slider" onscroll="window.MONARCC_APP.onQvScroll(this)">
            ${slides.map(v => `
              <div class="slide-item">
                <img src="${activeColor.img}" alt="${p.name} - ${v.label}"
                     style="object-position: ${v.pos}; transform: scale(${v.zoom}); transform-origin: ${v.pos};">
                <span class="slide-label">${v.label}</span>
              </div>
            `).join('')}
          </div>

          <div class="qv-thumbs">
            ${slides.map((v, i) => `
              <button type="button" class="${i === 0 ? 'is-active' : ''}" onclick="window.MONARCC_APP.setQvSlide(${i})">
                <img src="${activeColor.img}" alt="Miniatura ${v.label}" style="object-position: ${v.pos};">
              </button>
            `).join('')}
          </div>
        </div>

        <div class="qv-info">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="eyebrow" style="font-size: 11px;">${p.category}</span>
              <span class="tag tag-gold" style="font-size: 10px;">MADE IN SOACHA</span>
            </div>
            <h2>${p.name}</h2>
          </div>

          <div class="price-row">
            <span class="price-old mono">$${p.realPrice.toLocaleString('es-CO')}</span>
            <span class="price mono gold-text">$${p.price.toLocaleString('es-CO')} COP</span>
            <span class="save">-${discountPct}% OFF</span>
          </div>

          <p style="margin: 0; font-size: 14px; color: var(--muted); line-height: 1.6;">
            ${p.description}
          </p>

          <!-- Specifications -->
          <div class="spec-list">
            <div><b>Composición:</b> ${p.fabric}</div>
            <div><b>Corte:</b> Regular / Streetwear estructurado</div>
            <div><b>Despacho:</b> Inter Rapidísimo asegurado (1–3 días)</div>
          </div>

          <!-- Color selector -->
          ${p.colors.length > 1 ? `
            <div>
              <label class="label">Color: <b style="color: var(--text);" id="qv-color-name">${activeColor.name}</b></label>
              <div class="swatches" style="gap: 10px;">
                ${p.colors.map((c, i) => `
                  <button type="button" class="swatch swatch-lg ${i === opts.colorIdx ? 'is-active' : ''}"
                          style="background: ${c.hex};"
                          title="${c.name}"
                          onclick="window.MONARCC_APP.onQvColorChange('${p.id}', ${i})"></button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Size selector -->
          <div>
            <label class="label">Talla</label>
            <div class="sizes" style="gap: 8px;" id="qv-sizes">
              ${p.sizes.map(sz => `
                <button type="button" class="size size-lg ${sz === opts.size ? 'is-active' : ''}"
                        onclick="window.MONARCC_APP.onQvSizeChange('${p.id}', '${sz}')">${sz}</button>
              `).join('')}
            </div>
          </div>

          <button type="button" class="btn btn-gold btn-block" style="height: 48px; margin-top: 8px;"
                  onclick="window.MONARCC_APP.addToCart('${p.id}'); window.MONARCC_APP.closeQuickView();">
            AÑADIR A LA BOLSA • $${p.price.toLocaleString('es-CO')} COP
          </button>
        </div>
      </div>
    `;

    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.add('is-open');
    document.body.classList.add('is-locked');
  }

  function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  function setQvSlide(idx) {
    const slider = document.getElementById('qv-slider');
    if (!slider) return;
    slider.scrollTo({ left: idx * slider.clientWidth, behavior: 'smooth' });
    updateQvThumbActive(idx);
  }

  function onQvScroll(sliderEl) {
    const idx = Math.round(sliderEl.scrollLeft / sliderEl.clientWidth);
    updateQvThumbActive(idx);
  }

  function updateQvThumbActive(idx) {
    const thumbs = document.querySelectorAll('.qv-thumbs button');
    thumbs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
  }

  function onQvSizeChange(productId, size) {
    selectSize(productId, size);
    document.querySelectorAll('#qv-sizes .size').forEach(btn => {
      btn.classList.toggle('is-active', btn.textContent.trim() === size);
    });
  }

  function onQvColorChange(productId, colorIdx) {
    selectColor(productId, colorIdx);
    openQuickView(productId);
  }

  // ==========================================================================
  // 6. CART MANAGEMENT & CHECKOUT
  // ==========================================================================
  function addToCart(productId) {
    const p = state.products.find(x => x.id === productId) || (state.vip && state.vip.id === productId ? state.vip : null);
    if (!p) return;

    const opts = state.cardOptions[p.id] || {
      size: p.sizes[0],
      colorIdx: 0
    };
    const activeColor = p.colors[opts.colorIdx] || p.colors[0];

    const cartKey = `${p.id}-${opts.size}-${activeColor.key}`;
    const existing = state.cart.find(it => it.key === cartKey);

    if (existing) {
      if (existing.qty < activeColor.stock) {
        existing.qty += 1;
        showToast(`Se aumentó la cantidad de "${p.name}"`);
      } else {
        showToast(`Stock máximo alcanzado (${activeColor.stock} uds)`);
        return;
      }
    } else {
      state.cart.push({
        key: cartKey,
        id: p.id,
        name: p.name,
        price: p.price,
        size: opts.size,
        colorName: activeColor.name,
        img: activeColor.img,
        maxStock: activeColor.stock,
        qty: 1
      });
      showToast(`"${p.name}" añadido a la bolsa 🛍️`);
    }

    updateCartUI();
    openCart();
  }

  function updateCartItemQty(key, delta) {
    const item = state.cart.find(it => it.key === key);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      state.cart = state.cart.filter(it => it.key !== key);
      showToast('Prenda eliminada de la bolsa');
    } else if (item.qty > item.maxStock) {
      item.qty = item.maxStock;
      showToast(`Stock máximo disponible: ${item.maxStock} uds`);
    }

    updateCartUI();
  }

  function removeCartItem(key) {
    state.cart = state.cart.filter(it => it.key !== key);
    updateCartUI();
    showToast('Prenda eliminada');
  }

  function updateCartUI() {
    const countPill = document.getElementById('header-cart-count');
    const drawerCount = document.getElementById('cart-drawer-count');
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');

    const totalQty = state.cart.reduce((s, it) => s + it.qty, 0);

    if (countPill) {
      countPill.textContent = totalQty;
      countPill.classList.remove('bump');
      void countPill.offsetWidth; // retrigger
      countPill.classList.add('bump');
    }
    if (drawerCount) drawerCount.textContent = totalQty;
    const dockCount = document.getElementById('dock-cart-count');
    if (dockCount) dockCount.textContent = totalQty;

    if (state.cart.length === 0) {
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (container) {
        container.innerHTML = state.cart.map(it => `
          <div class="cart-item">
            <img src="${it.img}" alt="${it.name}">
            <div style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h4>${it.name}</h4>
                <div class="opts">Talla: <b>${it.size}</b> • Color: <b>${it.colorName}</b></div>
                <div class="mono" style="font-size: 13px; font-weight: 700; margin-top: 4px;">
                  $${(it.price * it.qty).toLocaleString('es-CO')} COP
                </div>
              </div>

              <div class="row">
                <div class="stepper">
                  <button type="button" onclick="window.MONARCC_APP.updateQty('${it.key}', -1)">–</button>
                  <span>${it.qty}</span>
                  <button type="button" onclick="window.MONARCC_APP.updateQty('${it.key}', 1)">+</button>
                </div>
                <button type="button" class="link-btn" onclick="window.MONARCC_APP.removeItem('${it.key}')">Eliminar</button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    // Calculations
    const subtotal = state.cart.reduce((s, it) => s + (it.price * it.qty), 0);

    // Discounts
    let totalDiscountPct = 0;
    state.appliedCoupons.forEach(pct => { totalDiscountPct += pct; });
    const discountAmount = Math.round(subtotal * (totalDiscountPct / 100));

    // Free shipping threshold ($300.000 COP)
    const freeFrom = (state.shipping && state.shipping.freeFrom) || 300000;
    let shippingCost = state.shippingLocation.cost;
    const freeShippingProgress = Math.min(100, Math.round((subtotal / freeFrom) * 100));

    const freeText = document.getElementById('free-shipping-text');
    const freeBar = document.getElementById('free-shipping-bar');
    const freePct = document.getElementById('free-shipping-percent');

    if (subtotal >= freeFrom && subtotal > 0) {
      shippingCost = 0;
      if (freeText) freeText.innerHTML = '🎉 ¡Felicitaciones! Tienes <b>ENVÍO GRATIS</b>';
      if (freeBar) { freeBar.style.width = '100%'; freeBar.style.background = 'var(--green)'; }
      if (freePct) freePct.textContent = '100%';
    } else {
      const remaining = freeFrom - subtotal;
      if (freeText) freeText.innerHTML = `Agrega <b>$${remaining.toLocaleString('es-CO')} COP</b> para ENVÍO GRATIS`;
      if (freeBar) { freeBar.style.width = freeShippingProgress + '%'; freeBar.style.background = 'var(--gold)'; }
      if (freePct) freePct.textContent = freeShippingProgress + '%';
    }

    const total = Math.max(0, subtotal - discountAmount + (subtotal > 0 ? shippingCost : 0));

    // Update DOM totals
    const subVal = document.getElementById('cart-subtotal-val');
    const discRow = document.getElementById('cart-discount-row');
    const discVal = document.getElementById('cart-discount-val');
    const shipVal = document.getElementById('cart-shipping-val');
    const totVal = document.getElementById('cart-total-val');

    if (subVal) subVal.textContent = `$${subtotal.toLocaleString('es-CO')} COP`;
    if (discRow && discVal) {
      if (discountAmount > 0) {
        discRow.style.display = 'flex';
        discVal.textContent = `-$${discountAmount.toLocaleString('es-CO')} COP (${totalDiscountPct}%)`;
      } else {
        discRow.style.display = 'none';
      }
    }
    if (shipVal) {
      shipVal.textContent = (shippingCost === 0 && subtotal > 0)
        ? 'GRATIS'
        : `$${shippingCost.toLocaleString('es-CO')} COP`;
    }
    if (totVal) totVal.textContent = `$${total.toLocaleString('es-CO')} COP`;
  }

  function applyCoupon(code) {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === 'MONARCC15') {
      state.appliedCoupons.set('MONARCC15', 15);
      showToast('¡Cupón MONARCC15 aplicado (-15%)!');
    } else if (cleanCode === 'CROWNVIP10') {
      state.appliedCoupons.set('CROWNVIP10', 10);
      showToast('¡Cupón CROWNVIP10 aplicado (-10% VIP)!');
    } else {
      showToast('Código de cupón no válido');
      return;
    }

    renderCouponTags();
    updateCartUI();
  }

  function removeCoupon(code) {
    state.appliedCoupons.delete(code);
    renderCouponTags();
    updateCartUI();
    showToast(`Cupón ${code} eliminado`);
  }

  function renderCouponTags() {
    const wrap = document.getElementById('cart-coupon-tags');
    if (!wrap) return;
    wrap.innerHTML = Array.from(state.appliedCoupons.entries()).map(([code, pct]) => `
      <span class="coupon-tag">
        <span>${code} (-${pct}%)</span>
        <button type="button" onclick="window.MONARCC_APP.removeCoupon('${code}')" title="Quitar cupón">✕</button>
      </span>
    `).join('');
  }

  function openCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  function closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-locked');
    }
  }

  // --- SHIPPING DESTINATION CALCULATOR ---
  function initShippingSelects() {
    const deptSelect = document.getElementById('shipping-dept-select');
    const citySelect = document.getElementById('shipping-city-select');
    if (!deptSelect || !citySelect || !state.shipping.departments) return;

    const depts = Object.keys(state.shipping.departments);
    deptSelect.innerHTML = depts.map(d => `<option value="${d}">${d}</option>`).join('');

    onDeptChange(depts[0]);
  }

  function onDeptChange(dept) {
    state.shippingLocation.dept = dept;
    const citySelect = document.getElementById('shipping-city-select');
    if (!citySelect || !state.shipping.departments) return;

    const cities = state.shipping.departments[dept] || ['Capital'];
    citySelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');

    onCityChange(cities[0]);
  }

  function onCityChange(city) {
    state.shippingLocation.city = city;
    const dept = state.shippingLocation.dept;

    let zone = 'national';
    let cost = (state.shipping.zones && state.shipping.zones.national.cost) || 18900;
    let label = 'Nacional';

    if (city === 'Soacha' || city === 'Bogotá') {
      zone = 'local';
      cost = state.shipping.zones.local.cost;
      label = 'Local (Soacha / Bogotá)';
    } else if (dept === 'Cundinamarca') {
      zone = 'regional';
      cost = state.shipping.zones.regional.cost;
      label = 'Regional (Cundinamarca)';
    } else if (dept === 'Amazonas' || dept === 'San Andrés') {
      zone = 'remote';
      cost = state.shipping.zones.remote.cost;
      label = 'Zona Especial';
    }

    state.shippingLocation.zone = zone;
    state.shippingLocation.cost = cost;

    const zoneName = document.getElementById('shipping-zone-name');
    const zoneCost = document.getElementById('shipping-zone-cost');
    if (zoneName) zoneName.textContent = label;
    if (zoneCost) zoneCost.textContent = `$${cost.toLocaleString('es-CO')} COP`;

    updateCartUI();
  }

  // --- CHECKOUT PROCESSORS ---
  function processGooglePay() {
    if (state.cart.length === 0) {
      showToast('Tu bolsa está vacía. Agrega prendas primero.');
      return;
    }

    showToast('Conectando con Google Pay API segura...');
    setTimeout(() => {
      triggerOrderSuccess();
    }, 1100);
  }

  function openCardModal() {
    if (state.cart.length === 0) {
      showToast('Tu bolsa está vacía. Agrega prendas primero.');
      return;
    }
    const modal = document.getElementById('card-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  function closeCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  function confirmCardPayment() {
    closeCardModal();
    showToast('Procesando pago con tarjeta (Cifrado 256-bit)...');
    setTimeout(() => {
      triggerOrderSuccess();
    }, 1200);
  }

  function triggerOrderSuccess() {
    closeCart();
    const orderNum = '#MNC-' + Math.floor(1000 + Math.random() * 9000);
    const guideNum = '982041' + Math.floor(100000 + Math.random() * 900000);

    const ordEl = document.getElementById('success-order-num');
    const guiEl = document.getElementById('success-guide-num');
    if (ordEl) ordEl.textContent = orderNum;
    if (guiEl) guiEl.textContent = guideNum;

    const modal = document.getElementById('success-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }

    // Clear cart
    state.cart = [];
    updateCartUI();
  }

  function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  function checkoutWhatsApp() {
    if (state.cart.length === 0) {
      showToast('Tu bolsa está vacía');
      return;
    }

    let msg = `*NUEVO PEDIDO MONARCC (@_monarcc_store)*\n`;
    msg += `— Made in Soacha —\n\n`;
    state.cart.forEach(it => {
      msg += `• ${it.qty}x ${it.name} (Talla: ${it.size}, Color: ${it.colorName}) - $${(it.price * it.qty).toLocaleString('es-CO')}\n`;
    });

    const subtotal = state.cart.reduce((s, it) => s + (it.price * it.qty), 0);
    msg += `\n*Destino:* ${state.shippingLocation.city}, ${state.shippingLocation.dept}\n`;
    msg += `*Envío:* Inter Rapidísimo\n`;
    msg += `*Subtotal:* $${subtotal.toLocaleString('es-CO')} COP\n`;
    msg += `\nPor favor envíenme los datos de pago para confirmar mi despacho sin contraentrega.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/573236043408?text=${encoded}`, '_blank');
  }

  // ==========================================================================
  // 7. SIDEBAR & FILTERS
  // ==========================================================================
  function openSidebar() {
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  function closeSidebar() {
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-locked');
    }
  }

  function filterCat(cat) {
    const label = cat === 'TODOS' ? 'COLECCIÓN COMPLETA' : cat;
    triggerScreenTransition(label, () => {
      state.selectedCat = cat;
      state.onlySeasonal = false;

      // Update chips in catalog
      document.querySelectorAll('#catalog-category-chips .chip').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.cat.toLowerCase() === cat.toLowerCase());
      });

      // Update chips in sidebar
      document.querySelectorAll('#sidebar-category-chips .chip').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.cat.toLowerCase() === cat.toLowerCase());
      });

      renderCatalog();
      closeSidebar();

      const grid = document.getElementById('catalog');
      if (grid && window.scrollY > grid.offsetTop + 100) {
        grid.scrollIntoView({ behavior: 'smooth' });
      }
    }, 520);
  }

  function filterSeasonal() {
    triggerScreenTransition('OFERTAS TEMPORADA', () => {
      state.onlySeasonal = true;
      state.selectedCat = 'TODOS';
      renderCatalog();
      closeSidebar();
      showToast('Filtrando por prendas con descuento de temporada ⚡');
      const grid = document.getElementById('catalog');
      if (grid) grid.scrollIntoView({ behavior: 'smooth' });
    }, 520);
  }

  function resetFilters() {
    state.selectedCat = 'TODOS';
    state.searchQuery = '';
    state.selectedSize = null;
    state.selectedColor = null;
    state.maxPrice = 220000;
    state.onlySeasonal = false;

    // Reset inputs
    const searchInput = document.getElementById('sidebar-search-input');
    const priceRange = document.getElementById('sidebar-price-range');
    const priceDisplay = document.getElementById('sidebar-price-display');
    if (searchInput) searchInput.value = '';
    if (priceRange) priceRange.value = 220000;
    if (priceDisplay) priceDisplay.textContent = '$220.000 COP';

    // Reset active classes
    document.querySelectorAll('#sidebar-size-buttons .size').forEach(b => b.classList.remove('is-active'));
    document.querySelectorAll('#sidebar-color-swatches .swatch').forEach(b => b.classList.remove('is-active'));
    document.querySelectorAll('.chip').forEach(b => {
      b.classList.toggle('is-active', b.dataset.cat === 'TODOS');
    });

    renderCatalog();
    closeSidebar();
    showToast('Filtros restablecidos');
  }

  function updateActiveFilterBar() {
    const bar = document.getElementById('active-filter-bar');
    const label = document.getElementById('active-filter-label');
    if (!bar || !label) return;

    const parts = [];
    if (state.selectedCat !== 'TODOS') parts.push(`Categoría: ${state.selectedCat}`);
    if (state.searchQuery) parts.push(`"${state.searchQuery}"`);
    if (state.selectedSize) parts.push(`Talla ${state.selectedSize}`);
    if (state.selectedColor) parts.push(`Color ${state.selectedColor}`);
    if (state.maxPrice < 220000) parts.push(`Hasta $${state.maxPrice.toLocaleString('es-CO')}`);
    if (state.onlySeasonal) parts.push('Ofertas de Temporada');

    if (parts.length > 0) {
      bar.style.display = 'flex';
      label.textContent = parts.join(' • ');
    } else {
      bar.style.display = 'none';
    }
  }

  // ==========================================================================
  // 8. INTER RAPIDÍSIMO LIVE TRACKING
  // ==========================================================================
  function searchGuide(guide) {
    if (!guide || guide.trim().length !== 12) {
      showToast('Ingresa un número de guía de 12 dígitos');
      return;
    }

    const clean = guide.trim();
    const display = document.getElementById('track-guide-display');
    if (display) display.textContent = clean;

    showToast(`Consultando guía ${clean} en Inter Rapidísimo...`);
    const resultBox = document.getElementById('tracking-page-result');
    if (resultBox) {
      resultBox.style.opacity = '0.5';
      setTimeout(() => {
        resultBox.style.opacity = '1';
        showToast('Rastreo actualizado en tiempo real');
      }, 600);
    }
  }

  // ==========================================================================
  // 9. REVIEWS RENDERING
  // ==========================================================================
  function renderReviews() {
    const wrap = document.getElementById('reviews-container');
    if (!wrap || !state.reviews) return;

    wrap.innerHTML = state.reviews.map(r => {
      const initials = r.name.split(' ').map(n => n[0]).join('');
      return `
        <div class="review">
          <div class="stars">★★★★★</div>
          <p>"${r.text}"</p>
          <div class="review-who">
            <div class="avatar">${initials}</div>
            <div>
              <b>${r.name}</b>
              <span>${r.city} • Talla ${r.size}</span>
            </div>
            <div class="verified">✓ Verificado</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // 10. SECRET MONARCA VIP EASTER EGG
  // ==========================================================================
  function setupEasterEgg() {
    // 1. Triple tap on crown in header or hero
    const crowns = [
      document.getElementById('header-logo'),
      document.getElementById('hero-crown-trigger')
    ];

    crowns.forEach(el => {
      if (!el) return;
      el.addEventListener('click', (e) => {
        // Prevent default only if it's the hero crown, let header logo scroll too
        handleCrownTap();
      });
    });

    // 2. Typing "monarcc" anywhere
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      state.keyBuffer += e.key.toLowerCase();
      if (state.keyBuffer.length > 10) state.keyBuffer = state.keyBuffer.slice(-10);

      if (state.keyBuffer.includes('monarcc')) {
        state.keyBuffer = '';
        unlockVip('código de teclado');
      }
    });

    // 3. Top bar VIP button
    const vipTop = document.getElementById('vip-top-trigger');
    if (vipTop) {
      vipTop.addEventListener('click', () => {
        unlockVip('acceso directo VIP');
      });
    }
  }

  function handleCrownTap() {
    state.crownTaps += 1;
    clearTimeout(state.crownTapTimer);

    // Update dots on locked card if visible
    const dots = document.querySelectorAll('#lock-taps i');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('on', idx < state.crownTaps);
    });

    if (state.crownTaps >= 3) {
      state.crownTaps = 0;
      unlockVip('triple toque en la Corona');
    } else {
      state.crownTapTimer = setTimeout(() => {
        state.crownTaps = 0;
        dots.forEach(dot => dot.classList.remove('on'));
      }, 1400);
    }
  }

  function onLockedCardClick() {
    handleCrownTap();
  }

  function unlockVip(source) {
    if (state.vipUnlocked) {
      openVipModal();
      return;
    }

    state.vipUnlocked = true;

    // Golden screen flash animation
    const flash = document.getElementById('crown-flash');
    if (flash) {
      flash.classList.add('is-on');
      setTimeout(() => flash.classList.remove('is-on'), 1500);
    }

    // Auto-apply VIP coupon
    applyCoupon('CROWNVIP10');

    // Re-render catalog with VIP piece unlocked
    renderCatalog();

    showToast(`👑 ¡MODO MONARCA VIP DESBLOQUEADO (${source})!`);
    openVipModal();
  }

  function openVipModal() {
    const modal = document.getElementById('vip-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  function closeVipModal() {
    const modal = document.getElementById('vip-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  // ==========================================================================
  // 11. DISCOUNT MODAL (15% OFF)
  // ==========================================================================
  function openDiscountModal() {
    const modal = document.getElementById('discount-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  function closeDiscountModal() {
    const modal = document.getElementById('discount-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  function handleDiscountSubmit() {
    const input = document.getElementById('discount-input-field');
    const form = document.getElementById('discount-signup-form');
    const result = document.getElementById('discount-code-result');

    if (!input || !input.value.trim()) return;

    if (form) form.style.display = 'none';
    if (result) result.style.display = 'block';

    applyCoupon('MONARCC15');
    showToast('¡15% OFF desbloqueado y aplicado a tu bolsa!');
  }

  function copyCoupon(code) {
    navigator.clipboard.writeText(code).then(() => {
      showToast(`¡Código ${code} copiado al portapapeles!`);
    }).catch(() => {
      showToast(`Código: ${code}`);
    });
    applyCoupon(code);
  }

  // ==========================================================================
  // 12. COUNTDOWN TIMER (DROP MOTORSPORT)
  // ==========================================================================
  function setupCountdown() {
    const d = document.getElementById('cd-days');
    const h = document.getElementById('cd-hours');
    const m = document.getElementById('cd-mins');
    const s = document.getElementById('cd-secs');
    if (!d || !h || !m || !s) return;

    let target = Date.now() + (2 * 24 * 3600 * 1000) + (14 * 3600 * 1000) + (38 * 60 * 1000);

    setInterval(() => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      d.textContent = days < 10 ? '0' + days : days;
      h.textContent = hours < 10 ? '0' + hours : hours;
      m.textContent = mins < 10 ? '0' + mins : mins;
      s.textContent = secs < 10 ? '0' + secs : secs;
    }, 1000);
  }

  // ==========================================================================
  // 13. SOUND TOGGLE FOR REELS
  // ==========================================================================
  function toggleSound(btn) {
    const container = btn.closest('.reel');
    if (!container) return;
    const video = container.querySelector('video');
    if (!video) return;

    video.muted = !video.muted;
    if (video.muted) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
      showToast('Video silenciado');
    } else {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
      showToast('Sonido activado 🔊');
    }
  }

  // ==========================================================================
  // 14. TOAST HELPER
  // ==========================================================================
  function showToast(text) {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;

    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i></i><span>${text}</span>`;
    wrap.appendChild(el);

    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, 3200);
  }


  // ==========================================================================
  // SCREEN TRANSITION LOADER (El logo dibujándose solo entre pantallas)
  // ==========================================================================
  function triggerScreenTransition(label, callback, minDuration = 600) {
    const st = document.getElementById('screen-transition');
    const stLabel = document.getElementById('st-label');
    const stFill = document.getElementById('st-progress-fill');

    if (!st) {
      if (callback) callback();
      return;
    }

    if (stLabel && label) {
      stLabel.textContent = `MONARCC // ${label.toUpperCase()}`;
    }
    if (stFill) stFill.style.width = '0%';

    st.classList.remove('is-leaving');
    st.classList.add('is-active');

    // Force draw animation reset & trigger
    const paths = st.querySelectorAll('.st-stroke-group .st-path');
    paths.forEach(p => {
      p.style.strokeDashoffset = '1000';
      void p.offsetWidth; // reflow
      p.style.strokeDashoffset = '0';
    });

    // Animate progress bar
    requestAnimationFrame(() => {
      if (stFill) stFill.style.width = '100%';
    });

    setTimeout(() => {
      if (callback) callback();

      setTimeout(() => {
        st.classList.add('is-leaving');
        setTimeout(() => {
          st.classList.remove('is-active', 'is-leaving');
          if (stFill) stFill.style.width = '0%';
        }, 360);
      }, 160);
    }, minDuration);
  }

  // ==========================================================================
  // MOBILE DOCK CONTROLLER
  // ==========================================================================
  function setupMobileDock() {
    const dock = document.getElementById('mobile-dock');
    if (!dock) return;

    // Dest navigation buttons
    dock.querySelectorAll('.dock-btn[data-dest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destSel = btn.dataset.dest;
        const dest = document.querySelector(destSel);
        const label = btn.querySelector('span')?.textContent || 'MONARCC';

        dock.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        triggerScreenTransition(label, () => {
          if (dest) dest.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      });
    });

    // Filter drawer trigger
    const dockFilter = document.getElementById('dock-filter-btn');
    if (dockFilter) {
      dockFilter.addEventListener('click', () => {
        openSidebar();
      });
    }

    // Cart drawer trigger
    const dockCart = document.getElementById('dock-cart-btn');
    if (dockCart) {
      dockCart.addEventListener('click', () => {
        openCart();
      });
    }

    // Smart dock hiding on fast scroll down, reveal on scroll up
    let lastScroll = 0;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY || window.pageYOffset;
          if (curr > lastScroll + 10 && curr > 140) {
            document.body.classList.add('dock-hidden');
          } else if (curr < lastScroll - 10 || curr <= 60) {
            document.body.classList.remove('dock-hidden');
          }
          lastScroll = curr;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // ==========================================================================
  // MOBILE TOUCH SWIPE GESTURES
  // ==========================================================================
  function setupTouchGestures() {
    document.addEventListener('touchstart', (e) => {
      const slider = e.target.closest('.card-media, #qv-slider');
      if (!slider) return;
      slider._touchStartX = e.touches[0].clientX;
      slider._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const slider = e.target.closest('.card-media, #qv-slider');
      if (!slider || slider._touchStartX === undefined) return;
      const diffX = e.changedTouches[0].clientX - slider._touchStartX;
      const diffY = e.changedTouches[0].clientY - slider._touchStartY;
      slider._touchStartX = undefined;

      // Only trigger if horizontal swipe > 35px and more horizontal than vertical
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        if (slider.id === 'qv-slider') {
          // Quick view swipe
          const currentIdx = Math.round(slider.scrollLeft / slider.clientWidth);
          const nextIdx = diffX < 0 ? currentIdx + 1 : currentIdx - 1;
          setQvSlide(Math.max(0, nextIdx));
        } else {
          // Product card media swipe
          const prevBtn = slider.querySelector('.slide-arrow.prev');
          const nextBtn = slider.querySelector('.slide-arrow.next');
          if (diffX < 0 && nextBtn) {
            nextBtn.click();
          } else if (diffX > 0 && prevBtn) {
            prevBtn.click();
          }
        }
      }
    }, { passive: true });
  }

  // ==========================================================================
  // 15. EVENT LISTENERS WIRING
  // ==========================================================================
  function setupEventListeners() {
    // Sidebar toggle
    const sideToggle = document.getElementById('sidebar-toggle-btn');
    const sideClose = document.getElementById('sidebar-close-btn');
    const sideBackdrop = document.getElementById('sidebar-backdrop');
    if (sideToggle) sideToggle.addEventListener('click', openSidebar);
    if (sideClose) sideClose.addEventListener('click', closeSidebar);
    if (sideBackdrop) sideBackdrop.addEventListener('click', closeSidebar);

    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle-btn');
    const cartClose = document.getElementById('cart-close-btn');
    const cartBackdrop = document.getElementById('cart-backdrop');
    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    // Top discount trigger
    const topDisc = document.getElementById('top-discount-trigger');
    if (topDisc) topDisc.addEventListener('click', openDiscountModal);

    // Catalog category chips
    const catChips = document.getElementById('catalog-category-chips');
    if (catChips) {
      catChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (!btn || !btn.dataset.cat) return;
        filterCat(btn.dataset.cat);
      });
    }

    // Sidebar category chips
    const sideCats = document.getElementById('sidebar-category-chips');
    if (sideCats) {
      sideCats.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (!btn || !btn.dataset.cat) return;
        filterCat(btn.dataset.cat);
      });
    }

    // Sidebar sizes
    const sideSizes = document.getElementById('sidebar-size-buttons');
    if (sideSizes) {
      sideSizes.addEventListener('click', (e) => {
        const btn = e.target.closest('.size');
        if (!btn || !btn.dataset.size) return;
        const sz = btn.dataset.size;
        if (state.selectedSize === sz) {
          state.selectedSize = null;
          btn.classList.remove('is-active');
        } else {
          state.selectedSize = sz;
          sideSizes.querySelectorAll('.size').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
        }
        renderCatalog();
      });
    }

    // Sidebar color swatches
    const sideColors = document.getElementById('sidebar-color-swatches');
    if (sideColors) {
      sideColors.addEventListener('click', (e) => {
        const btn = e.target.closest('.swatch');
        if (!btn || !btn.dataset.color) return;
        const clr = btn.dataset.color;
        if (state.selectedColor === clr) {
          state.selectedColor = null;
          btn.classList.remove('is-active');
        } else {
          state.selectedColor = clr;
          sideColors.querySelectorAll('.swatch').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
        }
        renderCatalog();
      });
    }

    // Sidebar search input
    const searchInput = document.getElementById('sidebar-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderCatalog();
      });
    }

    // Sidebar price slider
    const priceRange = document.getElementById('sidebar-price-range');
    const priceDisplay = document.getElementById('sidebar-price-display');
    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        state.maxPrice = Number(e.target.value);
        if (priceDisplay) priceDisplay.textContent = `$${state.maxPrice.toLocaleString('es-CO')} COP`;
        renderCatalog();
      });
    }

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(m => {
      m.addEventListener('click', (e) => {
        if (e.target === m) {
          m.classList.remove('is-open');
          document.body.classList.remove('is-locked');
        }
      });
    });

    // Smooth navigation links with transition
    document.querySelectorAll('.nav a, .hero-actions a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          const label = link.textContent.trim();
          triggerScreenTransition(label, () => {
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }, 480);
        }
      });
    });
  }

  // ==========================================================================
  // EXPOSE GLOBAL API FOR HTML ATTRIBUTES
  // ==========================================================================
  window.MONARCC_APP = {
    slide,
    onSliderScroll,
    selectSize,
    selectColor,
    addToCart,
    updateQty: updateCartItemQty,
    removeItem: removeCartItem,
    applyCoupon,
    removeCoupon,
    openQuickView,
    triggerScreenTransition,
    closeQuickView,
    setQvSlide,
    onQvScroll,
    onQvSizeChange,
    onQvColorChange,
    onDeptChange,
    onCityChange,
    processGooglePay,
    openCardModal,
    closeCardModal,
    confirmCardPayment,
    closeSuccessModal,
    checkoutWhatsApp,
    openDiscountModal,
    closeDiscountModal,
    handleDiscountSubmit,
    copyCoupon,
    openVipModal,
    closeVipModal,
    onLockedCardClick,
    filterCat,
    filterSeasonal,
    resetFilters,
    searchGuide,
    toggleSound
  };

})();
