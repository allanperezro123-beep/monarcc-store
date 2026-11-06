import { Money } from '../value-objects/Money.js';

/**
 * Domain Entity: Coupon
 * Represents a promotional discount code with percentage deduction rules.
 */
export class Coupon {
  static KNOWN_COUPONS = {
    'MONARCC15': { percent: 15, label: '15% OFF Club Monarcc' },
    'CROWNVIP10': { percent: 10, label: '10% OFF Exclusivo VIP' }
  };

  constructor(code, percent, label) {
    this.code = String(code).trim().toUpperCase();
    this.percent = Number(percent) || 0;
    this.label = String(label || `${this.percent}% OFF`);
  }

  static fromCode(rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    const config = Coupon.KNOWN_COUPONS[code];
    if (!config) {
      return null;
    }
    return new Coupon(code, config.percent, config.label);
  }

  applyDiscount(subtotal) {
    const money = subtotal instanceof Money ? subtotal : new Money(subtotal);
    return money.percentage(this.percent);
  }
}

