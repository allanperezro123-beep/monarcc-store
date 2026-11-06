import { Money } from '../value-objects/Money.js';

/**
 * Domain Entity / Value Object: CartItem
 * Represents a specific size and color configuration of a product in the bag.
 */
export class CartItem {
  constructor({ id, productId, name, price, realPrice, size, colorKey, colorName, img, qty = 1, maxStock = 10 }) {
    if (!productId || !size || !colorKey) {
      throw new Error('CartItem requires productId, size, and colorKey');
    }

    this.productId = String(productId);
    this.size = String(size);
    this.colorKey = String(colorKey);
    this.key = id || `${this.productId}_${this.size}_${this.colorKey}`;
    this.name = String(name);
    this.price = price instanceof Money ? price : new Money(price);
    this.realPrice = realPrice instanceof Money ? realPrice : new Money(realPrice || price);
    this.colorName = String(colorName || colorKey);
    this.img = String(img || '');
    this.maxStock = Math.max(1, Number(maxStock) || 1);
    this.qty = Math.max(1, Math.min(this.maxStock, Number(qty) || 1));
  }

  getSubtotal() {
    return this.price.multiply(this.qty);
  }

  getSavings() {
    if (this.realPrice.amount <= this.price.amount) return new Money(0);
    return this.realPrice.subtract(this.price).multiply(this.qty);
  }

  canIncrement(delta = 1) {
    return this.qty + delta <= this.maxStock;
  }

  withQty(newQty) {
    return new CartItem({
      id: this.key,
      productId: this.productId,
      name: this.name,
      price: this.price,
      realPrice: this.realPrice,
      size: this.size,
      colorKey: this.colorKey,
      colorName: this.colorName,
      img: this.img,
      qty: Math.max(0, Math.min(this.maxStock, newQty)),
      maxStock: this.maxStock
    });
  }
}

