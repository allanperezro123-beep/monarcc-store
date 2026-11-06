import { CartPresenter } from '../presenters/CartPresenter.js';

/**
 * Controller: CartController
 * Translates UI gestures & user intent into Use Case invocations.
 */
export class CartController {
  constructor({
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
  }) {
    this.cart = cart; 
    this.appliedCouponsMap = appliedCouponsMap;
    this.shippingLocation = shippingLocation;
    this.addToCartUseCase = addToCartUseCase;
    this.updateQtyUseCase = updateQtyUseCase;
    this.removeCartItemUseCase = removeCartItemUseCase;
    this.applyCouponUseCase = applyCouponUseCase;
    this.removeCouponUseCase = removeCouponUseCase;
    this.calculateTotalsUseCase = calculateTotalsUseCase;
    this.domRenderer = domRenderer;
  }

  getTotals() {
    return this.calculateTotalsUseCase.execute({
      cart: this.cart,
      appliedCouponsMap: this.appliedCouponsMap,
      shippingLocation: this.shippingLocation
    });
  }

  updateUI() {
    const totals = this.getTotals();
    const vm = CartPresenter.toDrawerViewModel(this.cart, totals, this.appliedCouponsMap);
    if (this.domRenderer) {
      this.domRenderer.renderCart(vm);
    }
    return vm;
  }

  async addItem({ productId, size, colorIdx, qty }) {
    const res = await this.addToCartUseCase.execute({
      cart: this.cart,
      productId,
      size,
      colorIdx,
      qty
    });

    this.updateUI();
    return res;
  }

  updateItemQty(key, delta) {
    const res = this.updateQtyUseCase.execute({
      cart: this.cart,
      key,
      delta
    });

    this.updateUI();
    return res;
  }

  removeItem(key) {
    const res = this.removeCartItemUseCase.execute({
      cart: this.cart,
      key
    });

    this.updateUI();
    return res;
  }

  applyCouponCode(code) {
    const res = this.applyCouponUseCase.execute({
      rawCode: code,
      appliedCouponsMap: this.appliedCouponsMap
    });

    this.updateUI();
    return res;
  }

  removeCouponCode(code) {
    const res = this.removeCouponUseCase.execute({
      code,
      appliedCouponsMap: this.appliedCouponsMap
    });

    this.updateUI();
    return res;
  }

  setShippingLocation(dept, city) {
    this.shippingLocation.dept = dept;
    this.shippingLocation.city = city;
    this.updateUI();
  }
}
