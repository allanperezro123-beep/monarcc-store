import { Money } from '../../domain/value-objects/Money.js';
import { ShippingRate } from '../../domain/entities/ShippingRate.js';

/**
 * Use Case: CalculateOrderTotals
 * Application business rule: Computes subtotal, deductions for all active coupons,
 * shipping cost according to destination, free shipping thresholds, and grand total.
 */
export class CalculateOrderTotalsUseCase {
  execute({ cart, appliedCouponsMap, shippingLocation }) {
    const subtotal = cart ? cart.getSubtotal() : new Money(0);
    const savings = cart ? cart.getTotalSavings() : new Money(0);

    // Calculate coupon discounts
    let discountAmount = new Money(0);
    if (appliedCouponsMap && appliedCouponsMap.size > 0 && subtotal.amount > 0) {
      for (const coupon of appliedCouponsMap.values()) {
        const discount = coupon.applyDiscount(subtotal);
        discountAmount = discountAmount.add(discount);
      }
    }

    // Shipping calculation
    const dept = shippingLocation ? shippingLocation.dept : 'Cundinamarca';
    const city = shippingLocation ? shippingLocation.city : 'Soacha';
    const shipping = new ShippingRate(dept, city);

    const shippingCost = cart && !cart.isEmpty()
      ? shipping.calculateCost(subtotal)
      : new Money(0);

    const isFreeShipping = cart && !cart.isEmpty()
      ? shipping.isFree(subtotal)
      : false;

    const freeShippingRemaining = shipping.remainingForFreeShipping(subtotal);

    // Grand total: max(0, subtotal - discounts) + shipping
    const discountedSubtotal = subtotal.subtract(discountAmount);
    const grandTotal = discountedSubtotal.add(shippingCost);

    return {
      subtotal,
      savings,
      discountAmount,
      shippingCost,
      isFreeShipping,
      freeShippingRemaining,
      shippingZone: shipping.label,
      shippingDays: shipping.deliveryDays,
      grandTotal
    };
  }
}

