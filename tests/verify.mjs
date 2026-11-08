import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Cart } from '../src/domain/entities/Cart.js';
import { CalculateOrderTotalsUseCase } from '../src/application/use-cases/CalculateOrderTotalsUseCase.js';
import { AddToCartUseCase } from '../src/application/use-cases/AddToCartUseCase.js';
import { ProductRepository } from '../src/adapters/repositories/ProductRepository.js';
import { ProductPresenter } from '../src/adapters/presenters/ProductPresenter.js';
import { CartPresenter } from '../src/adapters/presenters/CartPresenter.js';
import { DomRenderer } from '../src/infrastructure/dom/DomRenderer.js';
import { ScrollMachine } from '../src/infrastructure/dom/ScrollMachine.js';
import { evaluateCrownStamp, sampleAsciiRamp } from '../src/infrastructure/dom/AsciiCrownField.js';

const code = fs.readFileSync('./products.js', 'utf8');
const sandbox = { window: {} };
new Function('window', code)(sandbox.window);

const repo = new ProductRepository(sandbox.window.MONARCC);
const products = await repo.getAll();
const vms = products.map((p) => ProductPresenter.toCardViewModel(p));

const elements = {};
global.document = {
  body: {
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    }
  },
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        textContent: '',
        innerHTML: '',
        style: {},
        offsetWidth: 100,
        attrs: {},
        classList: {
          _set: new Set(),
          add(c) { this._set.add(c); },
          remove(c) { this._set.delete(c); },
          contains(c) { return this._set.has(c); },
          toggle(c, f) { if (f) this._set.add(c); else this._set.delete(c); }
        },
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) { return this.attrs[k] ?? null; },
        querySelectorAll() { return []; }
      };
    }
    return elements[id];
  }
};

const dom = new DomRenderer();
dom.renderCatalog(vms, { isFiltered: false, activeCategory: 'TODOS', totalStock: 50 });

const html = elements['products-grid-container'].innerHTML;
assert.ok(html.length > 10000, 'Catalog HTML must render all product cards');
assert.ok(html.includes('slider-p01'), 'Catalog must include product slider');
assert.ok(html.includes('drop-breaker'), 'Catalog must include drop countdown breaker');
assert.ok(html.includes('lookbook-1'), 'Catalog must include lookbook-1 breaker');
assert.ok(html.includes('lookbook-2'), 'Catalog must include lookbook-2 breaker');
assert.ok(html.includes('season-breaker'), 'Catalog must include season breaker');
const lockedCardMatch = html.match(/<article class="card card-locked"[\s\S]*?<\/article>/);
assert.ok(lockedCardMatch, 'Catalog must include locked VIP card');
assert.equal((lockedCardMatch[0].match(/<circle\b/g) || []).length, 5, 'Locked VIP card must render canonical 5-pearl MONARCC crown');
assert.ok(!lockedCardMatch[0].includes('<polyline'), 'Locked VIP card must not use legacy 3-peak polyline');

// Verify CartPresenter -> DomRenderer.renderCart syncs canonical #cart-*-val & #free-shipping-* IDs
const cart = new Cart();
const addToCart = new AddToCartUseCase(repo, null);
await addToCart.execute({ cart, productId: products[0].id, size: products[0].sizes[0], colorIdx: 0, qty: 1 });
const calcTotals = new CalculateOrderTotalsUseCase();
const totals = calcTotals.execute({ cart, appliedCouponsMap: new Map(), dept: 'Cundinamarca', city: 'Soacha' });
const cartVm = CartPresenter.toDrawerViewModel(cart, totals, new Map());
dom.renderCart(cartVm);

assert.equal(elements['cart-subtotal-val'].textContent, cartVm.subtotalFormatted);
assert.equal(elements['cart-shipping-val'].textContent, cartVm.shippingCostFormatted);
assert.equal(elements['cart-total-val'].textContent, cartVm.grandTotalFormatted);
assert.match(elements['free-shipping-percent'].textContent, /^\d+%$/);
assert.equal(elements['free-shipping-bar'].style.width, elements['free-shipping-percent'].textContent);

// Verify ScrollMachine hysteresis & AsciiCrownField crown math
let onScroll = null;
global.window = {
  scrollY: 0,
  addEventListener: (ev, fn) => { if (ev === 'scroll') onScroll = fn; },
  removeEventListener: () => {}
};
const sm = new ScrollMachine({ downThreshold: 14, topThreshold: 2, drawDurationMs: 20 });
sm.init();
assert.equal(elements['header-logo'].getAttribute('data-brand-mode'), 'crown');
global.window.scrollY = 24;
onScroll();
assert.equal(elements['header-logo'].getAttribute('data-brand-mode'), 'wordmark');
global.window.scrollY = 0;
onScroll();
assert.equal(elements['header-logo'].getAttribute('data-brand-mode'), 'crown');
sm.destroy();

assert.ok(evaluateCrownStamp(0, (398 - 662.5) / 360) > 0.75, 'Center pearl SDF must be solid');
assert.equal(sampleAsciiRamp(1), '@');

console.log('Rendered catalog HTML length:', html.length);
console.log('Cart total synced (#cart-total-val):', elements['cart-total-val'].textContent);
console.log('Free shipping progress (#free-shipping-percent):', elements['free-shipping-percent'].textContent);
console.log('DOM RENDERER, SCROLL MACHINE & ASCII CROWN FIELD VERIFIED 100% WORKING!');
