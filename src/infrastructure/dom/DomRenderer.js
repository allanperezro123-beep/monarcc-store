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

  renderCatalog(productVms, { isFiltered = false, activeCategory = 'TODOS' } = {}) {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    if (productVms.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3 style="margin-top: 0;">No encontramos prendas con esos filtros</h3>
          <p class="muted" style="margin-bottom: 20px;">Prueba ajustando el precio, las tallas o la categoría.</p>
          <button type="button" class="btn btn-outline" onclick="window.MONARCC_APP.resetFilters()">RESTAURAR FILTROS</button>
        </div>
      `;
      return;
    }

    let html = '';
    productVms.forEach((vm, idx) => {
      html += this._renderCardHtml(vm);

      // Breakers rhythm: insert editorial banners every 4 items if not heavily filtered
      if (!isFiltered) {
        if (idx === 3) html += this._getBreakerDropHtml();
        if (idx === 7) html += this._getBreakerVideo1Html();
        if (idx === 11) html += this._getBreakerSeasonHtml();
        if (idx === 15) html += this._getBreakerVideo2Html();
      }
    });

    grid.innerHTML = html;
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
    if (vm.isVip) {
      return `
        <article class="card card-locked card-vip" id="card-${vm.id}">
          <div class="card-media">
            <span class="tag tag-gold" style="position: absolute; top: 12px; left: 12px; z-index: 3;">👑 EXCLUSIVO VIP</span>
            <img src="${vm.activeColor.img}" alt="${vm.name}" loading="lazy">
            <div class="lock-overlay" onclick="window.MONARCC_APP.openVipModal()">
              <svg viewBox="0 0 100 80" fill="currentColor">
                <polyline points="18,62 16,30 35,48 50,18 65,48 84,30 82,62"/>
                <circle cx="16" cy="24" r="4"/><circle cx="50" cy="11" r="4.5"/><circle cx="84" cy="24" r="4"/>
                <line x1="16" y1="66" x2="84" y2="66" stroke="currentColor" stroke-width="4"/>
              </svg>
              <strong>CÍRCULO MONARCA</strong>
              <small>Pieza secreta desbloqueada</small>
            </div>
          </div>
          <div class="card-body">
            <div class="card-meta"><span>EDICIÓN NUMERADA</span><span class="mono">STOCK: 1 UD</span></div>
            <h3 class="card-title" onclick="window.MONARCC_APP.openQuickView('${vm.id}')">${vm.name}</h3>
            <div class="price-row">
              <span class="price-old mono">${vm.realPriceFormatted}</span>
              <span class="price mono gold-text">${vm.priceFormatted}</span>
              <span class="save">-31% VIP</span>
            </div>
            <button type="button" class="btn btn-gold" onclick="window.MONARCC_APP.addToCart('${vm.id}')">AÑADIR A LA BOLSA</button>
          </div>
        </article>
      `;
    }

    return `
      <article class="card" id="card-${vm.id}">
        <div class="card-media">
          <span class="tag ${vm.isLowStock ? 'tag-red' : ''}">
            <span class="live ${vm.isLowStock ? 'warn' : ''}"></span>
            <span class="mono">${vm.stockFormatted}</span>
          </span>
          <img src="${vm.activeColor.img}" alt="${vm.name}" loading="lazy">
          <button type="button" class="slide-arrow prev" onclick="window.MONARCC_APP.prevSlide('${vm.id}', event)" aria-label="Ver ángulo anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" class="slide-arrow next" onclick="window.MONARCC_APP.nextSlide('${vm.id}', event)" aria-label="Ver siguiente ángulo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button type="button" class="quick-btn" onclick="window.MONARCC_APP.openQuickView('${vm.id}')">
            VISTA RÁPIDA ↗
          </button>
        </div>
        <div class="card-body">
          <div class="card-meta"><span>${vm.category}</span><span class="mono">MADE IN SOACHA</span></div>
          <h3 class="card-title" onclick="window.MONARCC_APP.openQuickView('${vm.id}')" title="${vm.name}">${vm.name}</h3>
          <div class="price-row">
            <span class="price-old mono">${vm.realPriceFormatted}</span>
            <span class="price mono">${vm.priceFormatted}</span>
            ${vm.hasDiscount ? `<span class="save">${vm.discountPct}</span>` : ''}
          </div>
          <div class="card-options">
            <div class="sizes">
              ${vm.allSizes.map(sz => `
                <button type="button" class="size ${sz === vm.activeSize ? 'is-active' : ''}" onclick="window.MONARCC_APP.selectSize('${vm.id}', '${sz}', event)">${sz}</button>
              `).join('')}
            </div>
            ${vm.allColors.length > 1 ? `
              <div class="swatches">
                ${vm.allColors.map((c, i) => `
                  <button type="button" class="swatch ${c.isActive ? 'is-active' : ''}" style="background-color: ${c.hex};" title="${c.name}" onclick="window.MONARCC_APP.selectColor('${vm.id}', ${i}, event)"></button>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <button type="button" class="btn btn-outline" onclick="window.MONARCC_APP.addToCart('${vm.id}')">AGREGAR A LA BOLSA</button>
        </div>
      </article>
    `;
  }

  _getBreakerDropHtml() {
    return `
      <section class="breaker breaker-drop" id="drop-breaker">
        <div class="breaker-copy">
          <span class="eyebrow"><span class="dot"></span> PRÓXIMO LANZAMIENTO</span>
          <h3 class="h-display" style="font-size: clamp(24px, 3.2vw, 36px); margin: 0;">DROP EXCLUSIVO // PISTA 2026</h3>
          <p class="muted" style="margin: 0; font-size: 14.5px;">Chaqueta Racing Red Bull &amp; Puma edición blanco perla. 15 unidades numeradas a mano en Soacha.</p>
          <div class="countdown" id="drop-countdown">
            <div><b id="cd-days">02</b><small>DÍAS</small></div>
            <div><b id="cd-hours">14</b><small>HORAS</small></div>
            <div><b id="cd-mins">38</b><small>MIN</small></div>
            <div><b id="cd-secs">00</b><small>SEG</small></div>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 4px;">
            <button type="button" class="btn btn-gold" onclick="window.MONARCC_APP.addToCart('p02')">PREORDENAR AHORA</button>
            <button type="button" class="btn btn-ghost" onclick="window.MONARCC_APP.openQuickView('p02')">VER CHAQUETA ORACLE</button>
          </div>
        </div>
        <div class="breaker-media">
          <img src="media/generated_redbull_white.jpg" alt="Chaqueta Racing Oracle Monarcc" loading="lazy">
        </div>
      </section>
    `;
  }

  _getBreakerVideo1Html() {
    return `
      <section class="breaker breaker-video" id="lookbook-1">
        <div class="breaker-copy">
          <span class="eyebrow"><span class="dot"></span> LOOKBOOK EN MOVIMIENTO • VOL. 1</span>
          <h3 class="h-display" style="font-size: clamp(22px, 3vw, 32px); margin: 0;">EL PERCHADO EN ACCIÓN</h3>
          <p class="muted" style="margin: 0; font-size: 14px;">Descubre la caída de nuestro algodón de 340 g/m² en movimiento real. Sin efectos de estudio: textura cruda y cremalleras de acero.</p>
          <ul class="detail-list">
            <li>Algodón perchado grueso que no pierde cuerpo</li>
            <li>Costuras reforzadas con doble pespunte</li>
            <li>Cremalleras metálicas de deslizamiento suave</li>
          </ul>
        </div>
        <div class="video-pair">
          <div class="reel">
            <video autoplay muted loop playsinline preload="metadata">
              <source src="https://assets.mixkit.co/videos/preview/mixkit-young-man-wearing-a-jacket-posing-in-a-parking-lot-41484-large.mp4" type="video/mp4">
            </video>
            <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Alternar audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            </button>
            <div class="reel-label"><b>Chaqueta Motorsport</b><span>Caída estructurada en asfalto</span></div>
          </div>
          <div class="reel">
            <video autoplay muted loop playsinline preload="metadata">
              <source src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-urban-setting-41485-large.mp4" type="video/mp4">
            </video>
            <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Alternar audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            </button>
            <div class="reel-label"><b>Hoodie Oversize</b><span>Capota doble capa sin deformación</span></div>
          </div>
        </div>
      </section>
    `;
  }

  _getBreakerSeasonHtml() {
    return `
      <section class="breaker breaker-season" id="season-breaker">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <span class="tag tag-red" style="width: max-content;">⚡ OFERTAS DE TEMPORADA</span>
          <h3 class="h-display" style="font-size: clamp(22px, 2.8vw, 30px); margin: 0;">PRENDAS CON DESCUENTO ACTIVO</h3>
          <p class="muted" style="margin: 0; font-size: 14px;">Descuentos de hasta el 24% en piezas seleccionadas del drop anterior. Últimas unidades en bodega.</p>
        </div>
        <button type="button" class="btn btn-gold" onclick="window.MONARCC_APP.filterSeasonal()">VER OFERTAS ACTIVAS ⚡</button>
      </section>
    `;
  }

  _getBreakerVideo2Html() {
    return `
      <section class="breaker breaker-video reverse" id="lookbook-2">
        <div class="breaker-copy">
          <span class="eyebrow"><span class="dot"></span> LOOKBOOK EN MOVIMIENTO • VOL. 2</span>
          <h3 class="h-display" style="font-size: clamp(22px, 3vw, 32px); margin: 0;">DETALLES DE COSTURA Y BORDADO</h3>
          <p class="muted" style="margin: 0; font-size: 14px;">La alta densidad del hilo en cada bordado evita que se deshilache tras el lavado. Diseñado para resistir el uso diario.</p>
          <ul class="detail-list">
            <li>Bordados de alta definición con hilo japonés</li>
            <li>Pretinas con elástico de recuperación inmediata</li>
            <li>Teñido reactivo que conserva el tono tras 50 lavadas</li>
          </ul>
        </div>
        <div class="video-pair">
          <div class="reel">
            <video autoplay muted loop playsinline preload="metadata">
              <source src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-urban-setting-41486-large.mp4" type="video/mp4">
            </video>
            <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Alternar audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            </button>
            <div class="reel-label"><b>Chaqueta Racing KTM</b><span>Bordado en pecho de alta densidad</span></div>
          </div>
          <div class="reel">
            <video autoplay muted loop playsinline preload="metadata">
              <source src="https://assets.mixkit.co/videos/preview/mixkit-man-posing-in-a-hoodie-outdoors-41487-large.mp4" type="video/mp4">
            </video>
            <button type="button" class="reel-sound" onclick="window.MONARCC_APP.toggleSound(this)" aria-label="Alternar audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            </button>
            <div class="reel-label"><b>Conjunto Brooklyn 1898</b><span>Algodón tono moca en exteriores</span></div>
          </div>
        </div>
      </section>
    `;
  }
}
