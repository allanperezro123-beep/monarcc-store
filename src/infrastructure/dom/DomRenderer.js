/**
 * Infrastructure (Humble Object): DomRenderer
 * Responsibilities: Pure DOM rendering only.
 * No business rules, no price math, no inventory calculations.
 * Receives complete View Models and paints the screen.
 */
export class DomRenderer {
  showToast(text) {
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

  triggerVipFlash() {
    const flash = document.getElementById('crown-flash');
    if (flash) {
      flash.classList.add('is-on');
      setTimeout(() => flash.classList.remove('is-on'), 1500);
    }
  }

  openVipModal() {
    const modal = document.getElementById('vip-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  closeVipModal() {
    const modal = document.getElementById('vip-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  openSidebar() {
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  closeSidebar() {
    const drawer = document.getElementById('sidebar-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-locked');
    }
  }

  openCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-locked');
    }
  }

  openDiscountModal() {
    const modal = document.getElementById('discount-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  closeDiscountModal() {
    const modal = document.getElementById('discount-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  openCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  closeCardModal() {
    const modal = document.getElementById('card-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  renderSuccessModal(orderNumber, guideNumber) {
    this.closeCart();
    const ordEl = document.getElementById('success-order-num');
    const guiEl = document.getElementById('success-guide-num');
    if (ordEl) ordEl.textContent = orderNumber;
    if (guiEl) guiEl.textContent = guideNumber;

    const modal = document.getElementById('success-modal');
    if (modal) {
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
    }
  }

  closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  renderCart(vm) {
    const countPill = document.getElementById('header-cart-count');
    const drawerCount = document.getElementById('cart-drawer-count');
    const dockCount = document.getElementById('dock-cart-count');
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');

    // Counts
    if (countPill) {
      countPill.textContent = vm.totalQty;
      countPill.classList.remove('bump');
      void countPill.offsetWidth;
      countPill.classList.add('bump');
    }
    if (drawerCount) drawerCount.textContent = vm.totalQty;
    if (dockCount) dockCount.textContent = vm.totalQty;

    // Items list
    if (vm.isEmpty) {
      if (container) container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (container) {
        container.innerHTML = vm.items.map(it => `
          <div class="cart-item">
            <img src="${it.img}" alt="${it.name}">
            <div style="display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h4 style="margin: 0 0 4px; font-size: 13.5px; font-weight: 600; line-height: 1.3;">${it.name}</h4>
                <div style="font-size: 11.5px; color: var(--dim);">
                  Talla <b style="color: var(--text);">${it.size}</b> • Color <b style="color: var(--text);">${it.colorName}</b>
                </div>
              </div>

              <div class="cart-item-actions">
                <div class="qty-stepper">
                  <button type="button" onclick="window.MONARCC_APP.updateQty('${it.key}', -1)" aria-label="Disminuir">−</button>
                  <span class="mono">${it.qty}</span>
                  <button type="button" onclick="window.MONARCC_APP.updateQty('${it.key}', 1)" aria-label="Aumentar">+</button>
                </div>
                <button type="button" class="del" onclick="window.MONARCC_APP.removeItem('${it.key}')" aria-label="Eliminar prenda">✕</button>
              </div>
            </div>

            <div class="cart-item-price mono">
              ${it.hasSavings ? `<span class="price-old">${it.realPriceFormatted}</span>` : ''}
              <b>${it.subtotalFormatted}</b>
            </div>
          </div>
        `).join('');
      }
    }

    // Totals
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-value');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = vm.subtotalFormatted;
    if (discountRow) {
      discountRow.style.display = vm.hasDiscount ? 'flex' : 'none';
      if (discountVal) discountVal.textContent = vm.discountFormatted;
    }
    if (shippingEl) shippingEl.textContent = vm.shippingCostFormatted;
    if (totalEl) totalEl.textContent = vm.grandTotalFormatted;

    // Coupons tags
    const tagsContainer = document.getElementById('cart-coupon-tags');
    if (tagsContainer) {
      tagsContainer.innerHTML = vm.coupons.map(c => `
        <span class="coupon-tag">
          <span>${c.code} (${c.label})</span>
          <button type="button" onclick="window.MONARCC_APP.removeCoupon('${c.code}')" aria-label="Remover">✕</button>
        </span>
      `).join('');
    }
  }

  renderTrackingResult(vm) {
    const display = document.getElementById('track-guide-display');
    if (display) display.textContent = vm.guideNumber;

    const resultBox = document.getElementById('tracking-page-result');
    if (resultBox) {
      resultBox.style.opacity = '0.5';
      setTimeout(() => {
        resultBox.style.opacity = '1';
        this.showToast('Rastreo actualizado en tiempo real');
      }, 500);
    }
  }

  renderCatalog(productVms, { isFiltered = false, activeCategory = 'TODOS', totalStock = 50, vipUnlocked = false, vipVm = null } = {}) {
    const grid = document.getElementById('products-grid-container') || document.getElementById('catalog-grid');
    if (!grid) return;

    const stockCounter = document.getElementById('header-stock-count');
    const inventoryCount = document.getElementById('sidebar-inventory-count');
    if (stockCounter) stockCounter.textContent = `${totalStock} UDS EN STOCK`;
    if (inventoryCount) inventoryCount.textContent = totalStock;

    const empty = document.getElementById('no-results-state');

    if (productVms.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    let html = '';
    productVms.forEach((vm, idx) => {
      html += this._renderCardHtml(vm);

      const count = idx + 1;

      // Breakers rhythm: insert editorial banners every 4 items if not heavily filtered
      if (!isFiltered) {
        if (count === 4) {
          html += this._getBreakerDropHtml();
        } else if (count === 6) {
          html += this._getBreakerVideosPair1();
        } else if (count === 8) {
          html += this._getBreakerVideosPair2();
        }
      }
    });

    if (!isFiltered) {
      html += this._getBreakerSeasonHtml();
      html += this._renderVipCard(vipUnlocked, vipVm);
    } else if (vipUnlocked && vipVm) {
      html += this._renderCardHtml(vipVm);
    }

    grid.innerHTML = html;
  }

  slide(productId, dir) {
    const slider = document.getElementById(`slider-${productId}`);
    if (!slider) return;
    const itemWidth = slider.clientWidth;
    slider.scrollBy({ left: dir * itemWidth, behavior: 'smooth' });
  }

  onSliderScroll(productId, sliderEl) {
    const progress = document.getElementById(`progress-${productId}`);
    if (!progress || !sliderEl) return;
    const maxScroll = sliderEl.scrollWidth - sliderEl.clientWidth;
    const pct = maxScroll > 0 ? (sliderEl.scrollLeft / maxScroll) * 100 : 0;
    progress.style.width = Math.max(20, Math.min(100, pct)) + '%';
  }

  updateCardColor(productId, colorIdx, activeColor) {
    const card = document.getElementById(`card-${productId}`);
    if (!card) return;
    card.querySelectorAll('.swatches .swatch').forEach((sw, i) => {
      sw.classList.toggle('is-active', i === colorIdx);
    });
    card.querySelectorAll('.slider img').forEach(img => {
      img.src = activeColor.img;
    });
    const tag = card.querySelector('.card-tags .tag');
    if (tag) {
      const stock = activeColor.stock;
      const isCritical = stock <= 3;
      tag.className = `tag ${isCritical ? 'tag-red' : ''}`;
      tag.innerHTML = `<span class="live ${isCritical ? 'warn' : ''}"></span> ${isCritical ? `ÚLTIMAS ${stock} UDS` : `${stock} EN STOCK`}`;
    }
  }

  renderQuickView(vm) {
    const content = document.getElementById('quick-view-content');
    if (!content) return;

    content.innerHTML = `
      <div class="qv">
        <div class="qv-media">
          <div class="slider" id="qv-slider" onscroll="window.MONARCC_APP.onQvScroll(this)">
            ${vm.slides.map(v => `
              <div class="slide-item">
                <img src="${vm.activeColor.img}" alt="${vm.name} - ${v.label}"
                     style="object-position: ${v.pos}; transform: scale(${v.zoom}); transform-origin: ${v.pos};">
                <span class="slide-label">${v.label}</span>
              </div>
            `).join('')}
          </div>

          <div class="qv-thumbs">
            ${vm.slides.map((v, i) => `
              <button type="button" class="${i === 0 ? 'is-active' : ''}" onclick="window.MONARCC_APP.setQvSlide(${i})">
                <img src="${vm.activeColor.img}" alt="Miniatura ${v.label}" style="object-position: ${v.pos};">
              </button>
            `).join('')}
          </div>
        </div>

        <div class="qv-info">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span class="eyebrow" style="font-size: 11px;">${vm.category}</span>
              <span class="tag tag-gold" style="font-size: 10px;">MADE IN SOACHA</span>
            </div>
            <h2>${vm.name}</h2>
          </div>

          <div class="price-row">
            <span class="price-old mono">${vm.realPriceFormatted}</span>
            <span class="price mono gold-text">${vm.priceFormatted}</span>
            ${vm.hasDiscount ? `<span class="save">${vm.discountPct} OFF</span>` : ''}
          </div>

          <p style="margin: 0; font-size: 14px; color: var(--muted); line-height: 1.6;">
            ${vm.description}
          </p>

          <!-- Specifications -->
          <div class="spec-list">
            <div><b>Composición:</b> ${vm.fabric}</div>
            <div><b>Corte:</b> Regular / Streetwear estructurado</div>
            <div><b>Despacho:</b> Inter Rapidísimo asegurado (1–3 días)</div>
          </div>

          <!-- Color selector -->
          ${vm.allColors.length > 1 ? `
            <div>
              <label class="label">Color: <b style="color: var(--text);" id="qv-color-name">${vm.activeColor.name}</b></label>
              <div class="swatches" style="gap: 10px;">
                ${vm.allColors.map((c, i) => `
                  <button type="button" class="swatch swatch-lg ${c.isActive ? 'is-active' : ''}"
                          style="background: ${c.hex};"
                          title="${c.name}"
                          onclick="window.MONARCC_APP.onQvColorChange('${vm.id}', ${i})"></button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Size selector -->
          <div>
            <label class="label">Talla</label>
            <div class="sizes" style="gap: 8px;" id="qv-sizes">
              ${vm.allSizes.map(sz => `
                <button type="button" class="size size-lg ${sz === vm.activeSize ? 'is-active' : ''}"
                        onclick="window.MONARCC_APP.onQvSizeChange('${vm.id}', '${sz}')">${sz}</button>
              `).join('')}
            </div>
          </div>

          <button type="button" class="btn btn-gold btn-block" style="height: 48px; margin-top: 8px;"
                  onclick="window.MONARCC_APP.addToCart('${vm.id}'); window.MONARCC_APP.closeQuickView();">
            AÑADIR A LA BOLSA • ${vm.priceFormatted}
          </button>
        </div>
      </div>
    `;

    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.add('is-open');
    document.body.classList.add('is-locked');
  }

  closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.classList.remove('is-open');
    document.body.classList.remove('is-locked');
  }

  setQvSlide(idx) {
    const slider = document.getElementById('qv-slider');
    if (!slider) return;
    slider.scrollTo({ left: idx * slider.clientWidth, behavior: 'smooth' });
    this.updateQvThumbActive(idx);
  }

  updateQvThumbActive(idx) {
    const thumbs = document.querySelectorAll('.qv-thumbs button');
    thumbs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
  }

  renderReviews(reviews) {
    const wrap = document.getElementById('reviews-container');
    if (!wrap || !reviews) return;

    wrap.innerHTML = reviews.map(r => {
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

  updateActiveFilterBar(parts) {
    const bar = document.getElementById('active-filter-bar');
    const label = document.getElementById('active-filter-label');
    if (!bar || !label) return;

    if (parts && parts.length > 0) {
      bar.style.display = 'flex';
      label.textContent = parts.join(' • ');
    } else {
      bar.style.display = 'none';
    }
  }

  _renderCardHtml(vm) {
    const isVipCard = vm.isVip;
    const slides = vm.slides || [
      { pos: 'center center', zoom: 1, label: 'Plano General' }
    ];

    return `
      <article class="card ${isVipCard ? 'card-vip' : ''}" data-id="${vm.id}" id="card-${vm.id}">
        <!-- Media Slider -->
        <div class="card-media" id="media-${vm.id}">
          <div class="card-tags">
            <div class="stack">
              ${isVipCard ? '<span class="tag tag-gold">👑 VIP SECRET DROP</span>' : ''}
              ${vm.isCritical ? `<span class="tag tag-red"><span class="live warn"></span> ÚLTIMAS ${vm.stock} UDS</span>` : `<span class="tag"><span class="live"></span> ${vm.stockFormatted}</span>`}
            </div>
            ${vm.hasDiscount ? `<span class="save">${vm.discountPct}</span>` : ''}
          </div>

          <!-- Slider Images -->
          <div class="slider" id="slider-${vm.id}" onscroll="window.MONARCC_APP.onSliderScroll('${vm.id}', this)">
            ${slides.map((v) => `
              <div class="slide-item">
                <img src="${vm.activeColor.img}" alt="${vm.name} - ${v.label}"
                     style="object-position: ${v.pos}; transform: scale(${v.zoom}); transform-origin: ${v.pos};"
                     loading="lazy" draggable="false">
                <span class="slide-label">${v.label}</span>
              </div>
            `).join('')}
          </div>

          <!-- Slide Controls -->
          <button type="button" class="slide-arrow prev" onclick="window.MONARCC_APP.slide('${vm.id}', -1, event)" aria-label="Anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" class="slide-arrow next" onclick="window.MONARCC_APP.slide('${vm.id}', 1, event)" aria-label="Siguiente">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>

          <!-- Slide Progress -->
          <div class="slide-progress">
            <span id="progress-${vm.id}" style="width: ${100 / Math.max(1, slides.length)}%;"></span>
          </div>

          <!-- Quick View Trigger -->
          <button type="button" class="quick-btn" onclick="window.MONARCC_APP.openQuickView('${vm.id}')">
            VISTA RÁPIDA ↗
          </button>
        </div>

        <!-- Body -->
        <div class="card-body">
          <div class="card-meta">
            <span>${vm.category}</span>
            <span>MADE IN SOACHA</span>
          </div>

          <h3 class="card-title" onclick="window.MONARCC_APP.openQuickView('${vm.id}')" title="${vm.name}">
            ${vm.name}
          </h3>

          <div class="price-row">
            <span class="price-old mono">${vm.realPriceFormatted}</span>
            <span class="price mono">${vm.priceFormatted}</span>
          </div>

          <!-- Size & Color Selectors -->
          <div class="card-options">
            <div class="sizes">
              ${vm.allSizes.map(sz => `
                <button type="button" class="size ${sz === vm.activeSize ? 'is-active' : ''}"
                        onclick="window.MONARCC_APP.selectSize('${vm.id}', '${sz}', event)">${sz}</button>
              `).join('')}
            </div>

            ${vm.allColors.length > 1 ? `
              <div class="swatches">
                ${vm.allColors.map((c, idx) => `
                  <button type="button" class="swatch ${c.isActive ? 'is-active' : ''}"
                          style="background: ${c.hex};"
                          title="${c.name} (${c.stock} uds)"
                          onclick="window.MONARCC_APP.selectColor('${vm.id}', ${idx}, event)"></button>
                `).join('')}
              </div>
            ` : `<span class="mono dim" style="font-size: 11px;">${vm.activeColor.name}</span>`}
          </div>

          <!-- Add to Bag -->
          <button type="button" class="btn btn-dark btn-block" onclick="window.MONARCC_APP.addToCart('${vm.id}')">
            AÑADIR A LA BOLSA
          </button>
        </div>
      </article>
    `;
  }

  _renderVipCard(vipUnlocked, vipVm) {
    if (vipUnlocked && vipVm) {
      return this._renderCardHtml(vipVm);
    }

    return `
      <article class="card card-locked" onclick="window.MONARCC_APP.onLockedCardClick()" title="Pieza Secreta — Haz clic para desbloquear">
        <div class="card-media">
          <div class="card-tags">
            <span class="tag tag-gold">👑 CLASIFICADO</span>
          </div>
          <img src="media/generated_vip_golden_jacket.jpg" alt="Pieza Secreta VIP" loading="lazy" style="filter: brightness(0.22) blur(2px);">
          <div class="lock-overlay">
            <svg class="lock-crown-svg" viewBox="0 0 100 80" fill="currentColor">
              <polyline points="18,62 16,30 35,48 50,18 65,48 84,30 82,62"/>
              <circle cx="16" cy="24" r="4"/><circle cx="50" cy="11" r="4.5"/><circle cx="84" cy="24" r="4"/>
              <line x1="16" y1="66" x2="84" y2="66" stroke="currentColor" stroke-width="4"/>
            </svg>
            <strong>CÍRCULO MONARCA</strong>
            <span>Toca la corona 3 veces o haz clic aquí</span>
            <div class="tap-pill mono">SECRETO 0/3</div>
          </div>
        </div>
        <div class="card-body">
          <div class="card-meta">
            <span>EDICIÓN CERO</span>
            <span>NUMERADA A MANO</span>
          </div>
          <h3 class="card-title">Chaqueta Monarca Golden Embroidered</h3>
          <div class="price-row">
            <span class="price mono gold-text">ACCESO EXCLUSIVO</span>
          </div>
          <button type="button" class="btn btn-outline btn-block">DESBLOQUEAR CON CONTRASEÑA</button>
        </div>
      </article>
    `;
  }

  _getBreakerDropHtml() {
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

  _getBreakerVideosPair1() {
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
              <video src="media/post_003_DeMmJezRqur/video_01.mp4" playsinline loop muted autoplay preload="metadata"></video>
              <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Activar sonido">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <div class="reel-label">
                <b>HOODIE JPN // DETALLE</b>
                <span>Cierre metálico y textura</span>
              </div>
            </div>

            <div class="reel">
              <video src="media/post_004_DeGJ5SmO2kZ/video_01.mp4" playsinline loop muted autoplay preload="metadata"></video>
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

  _getBreakerVideosPair2() {
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
              <video src="media/post_001_DekfatDsou8/video_01.mp4" playsinline loop muted autoplay preload="metadata"></video>
              <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Activar sonido">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              </button>
              <div class="reel-label">
                <b>SCUDERIA WHITE</b>
                <span>Cuello alto &amp; cremallera</span>
              </div>
            </div>

            <div class="reel">
              <video src="media/post_007_Dc_jNaKxknN/video_01.mp4" playsinline loop muted autoplay preload="metadata"></video>
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

  _getBreakerSeasonHtml() {
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
              VER PRENDAS DE TEMPORADA ⚡
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
