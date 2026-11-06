import { Money } from '../value-objects/Money.js';

/**
 * Domain Entity: Product
 * Encapsulates product business rules, pricing invariants, and stock checks.
 * Completely independent of frameworks and DOM.
 */
export class Product {
  constructor(data) {
    if (!data.id || !data.name) {
      throw new Error('Product must have an id and name');
    }

    this.id = String(data.id);
    this.name = String(data.name);
    this.category = String(data.category || 'Streetwear');
    this.price = new Money(data.price);
    this.realPrice = new Money(data.realPrice || data.price);
    this.sizes = Array.isArray(data.sizes) ? [...data.sizes] : ['S', 'M', 'L', 'XL'];
    this.colors = Array.isArray(data.colors) ? [...data.colors] : [];
    this.main = data.main || { pos: '50% 30%', zoom: 1 };
    this.views = Array.isArray(data.views) ? [...data.views] : [];
    this.fabric = String(data.fabric || '');
    this.description = String(data.description || '');
    this.isVip = Boolean(data.isVip);
  }

  getDiscountPercentage() {
    if (this.realPrice.amount <= this.price.amount) return 0;
    const diff = this.realPrice.amount - this.price.amount;
    return Math.round((diff / this.realPrice.amount) * 100);
  }

  isSeasonal() {
    return this.getDiscountPercentage() >= 20;
  }

  getColor(index = 0) {
    if (this.colors.length === 0) {
      return { name: 'Único', key: 'unico', hex: '#111111', img: '', stock: 1 };
    }
    const idx = Math.max(0, Math.min(this.colors.length - 1, index));
    return this.colors[idx];
  }

  hasStock(colorIndex = 0, requestedQty = 1) {
    const color = this.getColor(colorIndex);
    return (color.stock || 0) >= requestedQty;
  }

  getMaxStock(colorIndex = 0) {
    const color = this.getColor(colorIndex);
    return color.stock || 0;
  }

  hasSize(size) {
    return this.sizes.includes(size);
  }
}

