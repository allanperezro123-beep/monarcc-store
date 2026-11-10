/**
 * Composition Root: container.js
 * Central point of dependency injection and wiring for MONARCC.
 * Strictly adheres to Clean Architecture Dependency Rules:
 * Domain <- Application <- Adapters <- Infrastructure
 */

// Domain
import { Cart } from './domain/entities/Cart.js';
import { ShippingRate } from './domain/entities/ShippingRate.js';

// Application Ports & Use Cases
import { AddToCartUseCase } from './application/use-cases/AddToCartUseCase.js';
import { UpdateCartItemQtyUseCase } from './application/use-cases/UpdateCartItemQtyUseCase.js';
import { RemoveCartItemUseCase } from './application/use-cases/RemoveCartItemUseCase.js';
import { ApplyCouponUseCase } from './application/use-cases/ApplyCouponUseCase.js';
import { RemoveCouponUseCase } from './application/use-cases/RemoveCouponUseCase.js';
import { CalculateOrderTotalsUseCase } from './application/use-cases/CalculateOrderTotalsUseCase.js';
import { FilterCatalogUseCase } from './application/use-cases/FilterCatalogUseCase.js';
import { TrackShipmentUseCase } from './application/use-cases/TrackShipmentUseCase.js';
import { UnlockVipUseCase } from './application/use-cases/UnlockVipUseCase.js';

// Adapters
import { ProductRepository } from './adapters/repositories/ProductRepository.js';
import { LocalStorageService } from './adapters/repositories/LocalStorageService.js';
import { CartController } from './adapters/controllers/CartController.js';
import { CatalogController } from './adapters/controllers/CatalogController.js';
import { TrackingController } from './adapters/controllers/TrackingController.js';
import { VipController } from './adapters/controllers/VipController.js';
import { CardFormController } from './adapters/controllers/CardFormController.js';

// Infrastructure
import { DomRenderer } from './infrastructure/dom/DomRenderer.js';
import { ScreenTransition } from './infrastructure/dom/ScreenTransition.js';
import { MobileDock } from './infrastructure/dom/MobileDock.js';
import { TouchGestures } from './infrastructure/dom/TouchGestures.js';
import { CardFormView } from './infrastructure/dom/CardFormView.js';
import { ScrollMachine } from './infrastructure/dom/ScrollMachine.js';
import { AsciiCrownField } from './infrastructure/dom/AsciiCrownField.js';
import { GooglePayGateway } from './infrastructure/external/GooglePayGateway.js';

// --- COMPOSITION ROOT FACTORY ---
export function bootstrapApplication() {
  // 1. Infrastructure Services & Repositories
  const productRepository = new ProductRepository();
  const storageService = new LocalStorageService();
  const googlePayGateway = new GooglePayGateway();
  const domRenderer = new DomRenderer();
  const screenTransition = new ScreenTransition();
  const scrollMachine = new ScrollMachine({ downThreshold: 14, topThreshold: 2 });
  const asciiCrownField = new AsciiCrownField();

  // 2. Application State & Domain Aggregates
  const cart = new Cart();
  const appliedCouponsMap = new Map();
  const cardOptionsMap = new Map();
  const shippingLocation = {
    dept: 'Cundinamarca',
    city: 'Soacha',
    zone: 'local',
    cost: 8900
  };

  // 3. Application Use Cases
  const addToCartUseCase = new AddToCartUseCase(productRepository, storageService);
  const updateQtyUseCase = new UpdateCartItemQtyUseCase(storageService);
  const removeCartItemUseCase = new RemoveCartItemUseCase(storageService);
  const applyCouponUseCase = new ApplyCouponUseCase();
  const removeCouponUseCase = new RemoveCouponUseCase();
  const calculateTotalsUseCase = new CalculateOrderTotalsUseCase();
  const filterCatalogUseCase = new FilterCatalogUseCase();
  const trackShipmentUseCase = new TrackShipmentUseCase();
  const unlockVipUseCase = new UnlockVipUseCase(storageService);

  // 4. Interface Adapters (Controllers)
  const cartController = new CartController({
    cart,
    appliedCouponsMap,
    shippingLocation,
    addToCartUseCase,
    updateQtyUseCase,
    removeCartItemUseCase,
    applyCouponUseCase,
    removeCouponUseCase,
    calculateTotalsUseCase,
    domRenderer
  });

  const catalogController = new CatalogController({
    productRepository,
    filterCatalogUseCase,
    domRenderer,
    cardOptionsMap
  });

  const trackingController = new TrackingController({
    trackShipmentUseCase,
    domRenderer
  });

  const vipController = new VipController({
    unlockVipUseCase,
    appliedCouponsMap,
    catalogController,
    cartController,
    domRenderer
  });

  // Card payment form: el controlador (sin DOM) valida y bloquea doble envío;
  // la vista solo enlaza eventos. El gateway recibe datos mínimos (sin PAN/CVV).
  const cardFormController = new CardFormController({
    submitPayment: (details) => googlePayGateway.processCardPayment(cart.getAll(), details)
  });
  const cardFormView = new CardFormView({
    modal: document.getElementById('card-modal'),
    form: document.getElementById('card-form'),
    controller: cardFormController,
    onPaid: (res) => {
      domRenderer.closeCardModal();
      cart.clear();
      cartController.updateUI();
      domRenderer.renderSuccessModal(res.orderNumber, res.guideNumber);
    },
    onFailed: (message, { modalOpen }) => {
      // Si el usuario cerró el modal con el pago en vuelo, el error no sería visible.
      if (!modalOpen) domRenderer.showToast(message);
    }
  });

  // 5. Mobile & Touch Drivers
  const mobileDock = new MobileDock(
    screenTransition,
    () => domRenderer.openSidebar(),
    () => domRenderer.openCart()
  );

  const touchGestures = new TouchGestures(nextIdx => {
    domRenderer.setQvSlide(nextIdx);
  });

  // Helper for filter summary bar
  function updateFilterBarUI() {
    const parts = [];
    if (catalogController.category !== 'TODOS') parts.push(`Categoría: ${catalogController.category}`);
    if (catalogController.searchQuery) parts.push(`"${catalogController.searchQuery}"`);
    if (catalogController.selectedSize) parts.push(`Talla ${catalogController.selectedSize}`);
    if (catalogController.selectedColor) parts.push(`Color ${catalogController.selectedColor}`);
    if (catalogController.maxPrice < 220000) parts.push(`Hasta $${catalogController.maxPrice.toLocaleString('es-CO')}`);
    if (catalogController.onlySeasonal) parts.push('Ofertas de Temporada');
    domRenderer.updateActiveFilterBar(parts);
  }

  // 6. Expose global window.MONARCC_APP for HTML onclick hooks
  const appApi = {
    // Cart actions
    async addToCart(productId) {
      const opts = cardOptionsMap.get(productId) || { size: null, colorIdx: 0 };
      const product = await productRepository.getById(productId);
      const chosenSize = opts.size || (product ? product.sizes[0] : 'M');

      const res = await cartController.addItem({
        productId,
        size: chosenSize,
        colorIdx: opts.colorIdx || 0,
        qty: 1
      });

      if (res.success) {
        const addedName = res.addedItem?.name || res.item?.name || product?.name || 'Prenda';
        domRenderer.showToast(`✓ Agregado: ${addedName} (${chosenSize})`);
      } else {
        domRenderer.showToast(res.error || 'No se pudo agregar a la bolsa');
      }
    },

    updateQty(key, delta) {
      cartController.updateItemQty(key, delta);
    },

    removeItem(key) {
      cartController.removeItem(key);
      domRenderer.showToast('Prenda removida de la bolsa');
    },

    applyCoupon(code) {
      const res = cartController.applyCouponCode(code);
      if (res.success) {
        domRenderer.showToast(res.message);
      } else {
        domRenderer.showToast(res.error);
      }
    },

    removeCoupon(code) {
      const res = cartController.removeCouponCode(code);
      if (res.success) {
        domRenderer.showToast(res.message);
      }
    },

    // Card Slides & Options
    slide(productId, delta, event) {
      if (event) event.stopPropagation();
      domRenderer.slide(productId, delta);
    },

    onSliderScroll(productId, el) {
      domRenderer.onSliderScroll(productId, el);
    },

    prevSlide(productId, event) {
      if (event) event.stopPropagation();
      appApi.slide(productId, -1, event);
    },

    nextSlide(productId, event) {
      if (event) event.stopPropagation();
      appApi.slide(productId, 1, event);
    },

    selectSize(productId, size, event) {
      if (event) event.stopPropagation();
      catalogController.selectCardSize(productId, size);
      // Update UI active buttons in that card
      const card = document.getElementById(`card-${productId}`);
      if (card) {
        card.querySelectorAll('.sizes .size').forEach(b => {
          b.classList.toggle('is-active', b.textContent.trim() === size);
        });
      }
    },

    async selectColor(productId, colorIdx, event) {
      if (event) event.stopPropagation();
      const product = await productRepository.getById(productId);
      if (product && product.colors[colorIdx]) {
        catalogController.selectCardColorState(productId, colorIdx);
        domRenderer.updateCardColor(productId, colorIdx, product.colors[colorIdx]);
      }
    },

    // Quick View Modal
    async openQuickView(productId) {
      const vm = await catalogController.getQuickViewModel(productId);
      if (vm) {
        domRenderer.renderQuickView(vm);
      }
    },

    closeQuickView() {
      domRenderer.closeQuickView();
    },

    setQvSlide(idx) {
      domRenderer.setQvSlide(idx);
    },

    onQvScroll(sliderEl) {
      const idx = Math.round(sliderEl.scrollLeft / sliderEl.clientWidth);
      domRenderer.updateQvThumbActive(idx);
    },

    onQvSizeChange(productId, size) {
      catalogController.selectCardSize(productId, size);
      document.querySelectorAll('#qv-sizes .size').forEach(btn => {
        btn.classList.toggle('is-active', btn.textContent.trim() === size);
      });
    },

    onQvColorChange(productId, colorIdx) {
      catalogController.selectCardColor(productId, colorIdx);
      appApi.openQuickView(productId);
    },

    // Filter & Navigation
    filterCat(cat) {
      const label = cat === 'TODOS' ? 'COLECCIÓN COMPLETA' : cat;
      screenTransition.trigger(label, () => {
        catalogController.setCategory(cat);
        updateFilterBarUI();

        // Update chips in catalog & sidebar
        document.querySelectorAll('#catalog-category-chips .chip, #sidebar-category-chips .chip').forEach(btn => {
          btn.classList.toggle('is-active', btn.dataset.cat.toLowerCase() === cat.toLowerCase());
        });

        domRenderer.closeSidebar();

        const grid = document.getElementById('catalog');
        if (grid && window.scrollY > grid.offsetTop + 100) {
          grid.scrollIntoView({ behavior: 'smooth' });
        }
      }, 520);
    },

    filterSeasonal() {
      screenTransition.trigger('OFERTAS TEMPORADA', () => {
        catalogController.setSeasonalOnly(true);
        updateFilterBarUI();
        domRenderer.closeSidebar();
        domRenderer.showToast('Filtro activo: Edición especial de temporada');

        const grid = document.getElementById('catalog');
        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
      }, 520);
    },

    resetFilters() {
      catalogController.resetFilters();
      updateFilterBarUI();

      // Reset DOM inputs
      const searchInput = document.getElementById('sidebar-search-input');
      const priceRange = document.getElementById('sidebar-price-range');
      const priceDisplay = document.getElementById('sidebar-price-display');
      if (searchInput) searchInput.value = '';
      if (priceRange) priceRange.value = 220000;
      if (priceDisplay) priceDisplay.textContent = '$220.000 COP';

      document.querySelectorAll('#sidebar-size-buttons .size').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('#sidebar-color-swatches .swatch').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('.chip').forEach(b => {
        b.classList.toggle('is-active', b.dataset.cat === 'TODOS');
      });

      domRenderer.closeSidebar();
      domRenderer.showToast('Filtros restablecidos');
    },

    // Shipping calculation
    onDeptChange(dept) {
      shippingLocation.dept = dept;
      const citySelect = document.getElementById('shipping-city-select');
      const rawShipping = window.MONARCC?.shipping || {};
      if (citySelect && rawShipping.departments) {
        const cities = rawShipping.departments[dept] || ['Capital'];
        citySelect.innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
        appApi.onCityChange(cities[0]);
      }
    },

    onCityChange(city) {
      shippingLocation.city = city;
      const rate = new ShippingRate(shippingLocation.dept, city);
      shippingLocation.zone = rate.zoneKey;
      shippingLocation.cost = rate.baseCost.amount;

      const zoneName = document.getElementById('shipping-zone-name');
      const zoneCost = document.getElementById('shipping-zone-cost');
      if (zoneName) zoneName.textContent = rate.label;
      if (zoneCost) zoneCost.textContent = `$${rate.baseCost.amount.toLocaleString('es-CO')} COP`;

      cartController.setShippingLocation(shippingLocation.dept, city);
    },

    // Checkout & Gateways
    async processGooglePay() {
      if (cart.isEmpty()) {
        domRenderer.showToast('Tu bolsa está vacía. Agrega prendas primero.');
        return;
      }

      domRenderer.showToast('Conectando con Google Pay API segura...');
      const res = await googlePayGateway.processGooglePay(cart.getAll());
      if (res.success) {
        cart.clear();
        cartController.updateUI();
        domRenderer.renderSuccessModal(res.orderNumber, res.guideNumber);
      } else {
        domRenderer.showToast(res.error || 'Error al procesar con Google Pay');
      }
    },

    openCardModal() {
      if (cart.isEmpty()) {
        domRenderer.showToast('Tu bolsa está vacía. Agrega prendas primero.');
        return;
      }
      domRenderer.openCardModal();
    },

    closeCardModal() {
      domRenderer.closeCardModal();
    },

    closeSuccessModal() {
      domRenderer.closeSuccessModal();
    },

    checkoutWhatsApp() {
      if (cart.isEmpty()) {
        domRenderer.showToast('Tu bolsa está vacía');
        return;
      }

      let msg = `*NUEVO PEDIDO MONARCC (@_monarcc_store)*\n`;
      msg += `— Made in Soacha —\n\n`;
      cart.getAll().forEach(it => {
        msg += `• ${it.qty}x ${it.name} (Talla: ${it.size}, Color: ${it.colorName}) - $${(it.price * it.qty).toLocaleString('es-CO')}\n`;
      });

      const totals = cartController.getTotals();
      msg += `\n*Destino:* ${shippingLocation.city}, ${shippingLocation.dept}\n`;
      msg += `*Envío:* Inter Rapidísimo\n`;
      msg += `*Subtotal:* $${totals.subtotal.amount.toLocaleString('es-CO')} COP\n`;
      msg += `*Total:* $${totals.grandTotal.amount.toLocaleString('es-CO')} COP\n`;
      msg += `\nPor favor envíenme los datos de pago para confirmar mi despacho sin contraentrega.`;

      const encoded = encodeURIComponent(msg);
      window.open(`https://wa.me/573236043408?text=${encoded}`, '_blank');
    },

    // Modals & Banners
    openDiscountModal() {
      domRenderer.openDiscountModal();
    },

    closeDiscountModal() {
      domRenderer.closeDiscountModal();
    },

    handleDiscountSubmit() {
      const input = document.getElementById('discount-input-field');
      const form = document.getElementById('discount-signup-form');
      const result = document.getElementById('discount-code-result');

      if (!input || !input.value.trim()) return;

      if (form) form.style.display = 'none';
      if (result) result.style.display = 'block';

      appApi.applyCoupon('MONARCC15');
      domRenderer.showToast('¡15% OFF desbloqueado y aplicado a tu bolsa!');
    },

    copyCoupon(code) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          domRenderer.showToast(`¡Código ${code} copiado al portapapeles!`);
        }).catch(() => {
          domRenderer.showToast(`Código: ${code}`);
        });
      }
      appApi.applyCoupon(code);
    },

    openVip(source = 'footer') {
      return vipController.unlock(source);
    },

    openVipModal() {
      domRenderer.openVipModal();
    },

    closeVipModal() {
      domRenderer.closeVipModal();
    },

    closeSidebar() {
      domRenderer.closeSidebar();
    },

    onLockedCardClick() {
      vipController.handleTap();
    },

    // Tracking
    searchGuide(guide) {
      const res = trackingController.track(guide);
      if (!res.isValid) {
        domRenderer.showToast(res.error || 'Ingresa un número de guía válido');
      }
    },

    // Video sound
    toggleSound(btn) {
      const container = btn.closest('.reel');
      if (!container) return;
      const video = container.querySelector('video');
      if (!video) return;

      video.muted = !video.muted;
      if (video.muted) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        domRenderer.showToast('Video silenciado');
      } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        domRenderer.showToast('Audio lookbook: Activado');
      }
    },

    triggerScreenTransition(label, callback, minDuration) {
      screenTransition.trigger(label, callback, minDuration);
    }
  };

  window.MONARCC_APP = appApi;

  // 7. Initial Setup & Event Listeners
  const activeIntervals = [];
  const activeTimeouts = [];

  function initPreloader() {
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('preloader-counter');
    const fill = document.getElementById('preloader-fill');
    if (!preloader || !counter || !fill) {
      if (scrollMachine.isAtTop()) {
        scrollMachine.triggerCrownDraw();
      }
      return;
    }

    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.floor(Math.random() * 9) + 4;
      if (pct >= 100) {
        pct = 100;
        clearInterval(timer);
        counter.textContent = '100%';
        fill.style.width = '100%';
        activeTimeouts.push(
          setTimeout(() => {
            preloader.classList.add('is-done');
            if (scrollMachine.isAtTop() && (window.scrollY || window.pageYOffset || 0) <= 2) {
              scrollMachine.triggerCrownDraw();
            }
            activeTimeouts.push(
              setTimeout(() => {
                preloader.style.display = 'none';
              }, 950)
            );
          }, 350)
        );
      } else {
        counter.textContent = (pct < 10 ? '0' : '') + pct + '%';
        fill.style.width = pct + '%';
      }
    }, 40);
    activeIntervals.push(timer);
  }

  function setupShippingSelects() {
    const deptSelect = document.getElementById('shipping-dept-select');
    const rawShipping = window.MONARCC?.shipping || {};
    if (!deptSelect || !rawShipping.departments) return;

    const depts = Object.keys(rawShipping.departments);
    deptSelect.innerHTML = depts.map(d => `<option value="${d}">${d}</option>`).join('');
    appApi.onDeptChange(depts[0]);
  }

  function setupCountdown() {
    const d = document.getElementById('cd-days');
    const h = document.getElementById('cd-hours');
    const m = document.getElementById('cd-mins');
    const s = document.getElementById('cd-secs');
    if (!d || !h || !m || !s) return;

    const target = Date.now() + (2 * 24 * 3600 * 1000) + (14 * 3600 * 1000) + (38 * 60 * 1000);
    const cdTimer = setInterval(() => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / (1000) % 60));

      d.textContent = days < 10 ? '0' + days : days;
      h.textContent = hours < 10 ? '0' + hours : hours;
      m.textContent = mins < 10 ? '0' + mins : mins;
      s.textContent = secs < 10 ? '0' + secs : secs;
    }, 1000);
    activeIntervals.push(cdTimer);
  }

  function setupListeners() {
    // Sidebar toggle
    const sideToggle = document.getElementById('sidebar-toggle-btn');
    const sideClose = document.getElementById('sidebar-close-btn');
    const sideBackdrop = document.getElementById('sidebar-backdrop');
    if (sideToggle) sideToggle.addEventListener('click', () => domRenderer.openSidebar());
    if (sideClose) sideClose.addEventListener('click', () => domRenderer.closeSidebar());
    if (sideBackdrop) sideBackdrop.addEventListener('click', () => domRenderer.closeSidebar());

    // Cart toggle
    const cartToggle = document.getElementById('cart-toggle-btn');
    const cartClose = document.getElementById('cart-close-btn');
    const cartBackdrop = document.getElementById('cart-backdrop');
    if (cartToggle) cartToggle.addEventListener('click', () => domRenderer.openCart());
    if (cartClose) cartClose.addEventListener('click', () => domRenderer.closeCart());
    if (cartBackdrop) cartBackdrop.addEventListener('click', () => domRenderer.closeCart());

    // Category chips
    const catChips = document.getElementById('catalog-category-chips');
    if (catChips) {
      catChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (!btn || !btn.dataset.cat) return;
        appApi.filterCat(btn.dataset.cat);
      });
    }

    const sideCats = document.getElementById('sidebar-category-chips');
    if (sideCats) {
      sideCats.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (!btn || !btn.dataset.cat) return;
        appApi.filterCat(btn.dataset.cat);
      });
    }

    // Sidebar sizes
    const sideSizes = document.getElementById('sidebar-size-buttons');
    if (sideSizes) {
      sideSizes.addEventListener('click', (e) => {
        const btn = e.target.closest('.size');
        if (!btn || !btn.dataset.size) return;
        const sz = btn.dataset.size;
        catalogController.setSize(sz);
        sideSizes.querySelectorAll('.size').forEach(b => b.classList.toggle('is-active', b === btn && catalogController.selectedSize === sz));
        updateFilterBarUI();
      });
    }

    // Sidebar color swatches
    const sideColors = document.getElementById('sidebar-color-swatches');
    if (sideColors) {
      sideColors.addEventListener('click', (e) => {
        const btn = e.target.closest('.swatch');
        if (!btn || !btn.dataset.color) return;
        const clr = btn.dataset.color;
        catalogController.setColor(clr);
        sideColors.querySelectorAll('.swatch').forEach(b => b.classList.toggle('is-active', b === btn && catalogController.selectedColor === clr));
        updateFilterBarUI();
      });
    }

    // Sidebar search input
    const searchInput = document.getElementById('sidebar-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        catalogController.setSearchQuery(e.target.value);
        updateFilterBarUI();
      });
    }

    // Sidebar price slider
    const priceRange = document.getElementById('sidebar-price-range');
    const priceDisplay = document.getElementById('sidebar-price-display');
    if (priceRange) {
      priceRange.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        catalogController.setMaxPrice(val);
        if (priceDisplay) priceDisplay.textContent = `$${val.toLocaleString('es-CO')} COP`;
        updateFilterBarUI();
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
          screenTransition.trigger(label, () => {
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }, 480);
        }
      });
    });

    // Header brand smart click: scroll smoothly to top when scrolled, or count secret VIP taps when at 100% top
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
      headerLogo.addEventListener('click', () => {
        if (!scrollMachine.isAtTop()) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        vipController.handleTap();
      });
    }

    const heroCrown = document.getElementById('hero-crown-trigger');
    if (heroCrown) {
      heroCrown.addEventListener('click', () => vipController.handleTap());
    }

    // Easter egg keyboard buffer
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      vipController.handleKey(e.key);
    });
  }

  // Execute Boot Sequence (scrollMachine first so initial brand mode is ready for preloader)
  scrollMachine.init();
  initPreloader();
  asciiCrownField.init();
  mobileDock.init();
  touchGestures.init();
  setupShippingSelects();
  setupCountdown();
  setupListeners();
  cardFormView.init();

  // Initial Data Renders
  productRepository.getReviews().then(reviews => domRenderer.renderReviews(reviews));
  catalogController.filterAndRender();
  cartController.updateUI();

  return {
    cart,
    cartController,
    catalogController,
    trackingController,
    vipController,
    domRenderer,
    scrollMachine,
    asciiCrownField,
    destroy() {
      cardFormView.destroy();
      scrollMachine.destroy();
      asciiCrownField.destroy();
      activeIntervals.forEach(clearInterval);
      activeTimeouts.forEach(clearTimeout);
    }
  };
}

// Auto-boot on DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApplication);
  } else {
    bootstrapApplication();
  }
}

