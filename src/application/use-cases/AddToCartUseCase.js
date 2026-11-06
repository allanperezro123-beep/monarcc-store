import { CartItem } from '../../domain/entities/CartItem.js';

/**
 * Use Case: AddToCart
 * Application business rule: Orchestrates fetching product, validating stock,
 * creating a CartItem, adding to the Cart aggregate, and saving state.
 */
export class AddToCartUseCase {
  constructor(productRepo, storageService) {
    this.productRepo = productRepo;
    this.storageService = storageService;
  }

  async execute({ cart, productId, size, colorIdx = 0, qty = 1 }) {
    if (!cart) throw new Error('Cart aggregate is required');
    if (!productId) throw new Error('productId is required');

    const product = await this.productRepo.getById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const selectedSize = size || product.sizes[0];
    const selectedColor = product.getColor(colorIdx);
    const maxStock = selectedColor.stock || 10;

    const cartItem = new CartItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      realPrice: product.realPrice,
      size: selectedSize,
      colorKey: selectedColor.key,
      colorName: selectedColor.name,
      img: selectedColor.img,
      qty: Math.max(1, qty),
      maxStock: maxStock
    });

    cart.addItem(cartItem);

    if (this.storageService) {
      this.storageService.setItem('monarcc_cart', JSON.stringify(cart.toJSON()));
    }

    return {
      success: true,
      cart,
      addedItem: cartItem,
      totalQty: cart.getTotalQty(),
      subtotal: cart.getSubtotal()
    };
  }
}

