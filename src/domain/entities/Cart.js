import { Money } from '../value-objects/Money.js';
import { CartItem } from './CartItem.js';

/**
 * Domain Aggregate Root: Cart
 * Enforces cart-level business rules:
 * - Line item deduplication
 * - Max stock limits
 * - Calculation of total units and subtotal
 */
export class Cart {
  constructor(items = []) {
    this._items = new Map();
    items.forEach(it => {
      const item = it instanceof CartItem ? it : new CartItem(it);
      this._items.set(item.key, item);
    });
  }

  getItems() {
    return Array.from(this._items.values());
  }

  getAll() {
    return this.getItems();
  }

  getItem(key) {
    return this._items.get(key) || null;
  }

  isEmpty() {
    return this._items.size === 0;
  }

  getTotalQty() {
    let count = 0;
    for (const item of this._items.values()) {
      count += item.qty;
    }
    return count;
  }

  getSubtotal() {
    let total = new Money(0);
    for (const item of this._items.values()) {
      total = total.add(item.getSubtotal());
    }
    return total;
  }

  getTotalSavings() {
    let savings = new Money(0);
    for (const item of this._items.values()) {
      savings = savings.add(item.getSavings());
    }
    return savings;
  }

  addItem(newItem) {
    const item = newItem instanceof CartItem ? newItem : new CartItem(newItem);
    const existing = this._items.get(item.key);

    if (existing) {
      const mergedQty = Math.min(existing.maxStock, existing.qty + item.qty);
      this._items.set(item.key, existing.withQty(mergedQty));
    } else {
      this._items.set(item.key, item);
    }
  }

  updateQty(key, delta) {
    const existing = this._items.get(key);
    if (!existing) return;

    const newQty = existing.qty + delta;
    if (newQty <= 0) {
      this._items.delete(key);
    } else {
      const clampedQty = Math.min(existing.maxStock, newQty);
      this._items.set(key, existing.withQty(clampedQty));
    }
  }

  removeItem(key) {
    this._items.delete(key);
  }

  clear() {
    this._items.clear();
  }

  toJSON() {
    return this.getItems().map(it => ({
      key: it.key,
      productId: it.productId,
      name: it.name,
      price: it.price.amount,
      realPrice: it.realPrice.amount,
      size: it.size,
      colorKey: it.colorKey,
      colorName: it.colorName,
      img: it.img,
      qty: it.qty,
      maxStock: it.maxStock
    }));
  }
}

