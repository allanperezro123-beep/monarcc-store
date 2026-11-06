import { Money } from '../value-objects/Money.js';

/**
 * Domain Entity: ShippingRate
 * Business rules for Inter Rapidísimo shipping calculation in Colombia:
 * - Free shipping for orders >= $300.000 COP
 * - Local zone (Soacha / Bogotá): $8.900 COP
 * - Regional zone (Cundinamarca): $12.900 COP
 * - National zone (Rest of Colombia): $18.900 COP
 * - Remote / Special zones: $29.900 COP
 */
export class ShippingRate {
  static FREE_SHIPPING_THRESHOLD = new Money(300000);

  static ZONES = {
    local: { label: 'Local (Soacha / Bogotá)', cost: 8900, days: '1–2 días hábiles' },
    regional: { label: 'Regional (Cundinamarca)', cost: 12900, days: '2–3 días hábiles' },
    national: { label: 'Nacional', cost: 18900, days: '3–5 días hábiles' },
    remote: { label: 'Zona especial', cost: 29900, days: '5–8 días hábiles' }
  };

  static resolveZone(dept, city) {
    const d = String(dept || '').toLowerCase();
    const c = String(city || '').toLowerCase();

    if (c === 'soacha' || c === 'bogotá' || d.includes('bogot')) {
      return 'local';
    }
    if (d.includes('cundinamarca')) {
      return 'regional';
    }
    if (d.includes('amazonas') || d.includes('san andr') || d.includes('guain') || d.includes('vaup')) {
      return 'remote';
    }
    return 'national';
  }

  constructor(dept = 'Cundinamarca', city = 'Soacha') {
    this.department = dept;
    this.city = city;
    this.zoneKey = ShippingRate.resolveZone(dept, city);
    const zoneData = ShippingRate.ZONES[this.zoneKey] || ShippingRate.ZONES.national;
    this.baseCost = new Money(zoneData.cost);
    this.deliveryDays = zoneData.days;
    this.label = zoneData.label;
  }

  calculateCost(orderSubtotal) {
    const subtotal = orderSubtotal instanceof Money ? orderSubtotal : new Money(orderSubtotal);
    if (subtotal.amount >= ShippingRate.FREE_SHIPPING_THRESHOLD.amount) {
      return new Money(0);
    }
    return this.baseCost;
  }

  isFree(orderSubtotal) {
    const subtotal = orderSubtotal instanceof Money ? orderSubtotal : new Money(orderSubtotal);
    return subtotal.amount >= ShippingRate.FREE_SHIPPING_THRESHOLD.amount;
  }

  remainingForFreeShipping(orderSubtotal) {
    const subtotal = orderSubtotal instanceof Money ? orderSubtotal : new Money(orderSubtotal);
    if (subtotal.amount >= ShippingRate.FREE_SHIPPING_THRESHOLD.amount) {
      return new Money(0);
    }
    return ShippingRate.FREE_SHIPPING_THRESHOLD.subtract(subtotal);
  }
}

