/**
 * Use Case: UpdateCartItemQty
 * Adjusts line item quantity, bounds to available stock, or removes item.
 */
export class UpdateCartItemQtyUseCase {
  constructor(storageService) {
    this.storageService = storageService;
  }

  execute({ cart, key, delta }) {
    if (!cart) throw new Error('Cart aggregate is required');
    if (!key) throw new Error('Cart item key is required');

    cart.updateQty(key, delta);

    if (this.storageService) {
      this.storageService.setItem('monarcc_cart', JSON.stringify(cart.toJSON()));
    }

    return {
      success: true,
      cart,
      totalQty: cart.getTotalQty(),
      subtotal: cart.getSubtotal()
    };
  }
}

