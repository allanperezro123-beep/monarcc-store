/**
 * Use Case: RemoveCartItem
 * Removes a line item from the cart and persists state.
 */
export class RemoveCartItemUseCase {
  constructor(storageService) {
    this.storageService = storageService;
  }

  execute({ cart, key }) {
    if (!cart) throw new Error('Cart aggregate is required');
    if (!key) throw new Error('Cart item key is required');

    cart.removeItem(key);

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

