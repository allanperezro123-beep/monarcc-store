import { Coupon } from '../../domain/entities/Coupon.js';

/**
 * Use Case: ApplyCoupon
 * Validates promotional codes against enterprise rules.
 */
export class ApplyCouponUseCase {
  execute({ rawCode, appliedCouponsMap }) {
    if (!rawCode) {
      return { success: false, error: 'Ingresa un código de cupón' };
    }

    const coupon = Coupon.fromCode(rawCode);
    if (!coupon) {
      return { success: false, error: 'Cupón no válido o expirado' };
    }

    if (appliedCouponsMap.has(coupon.code)) {
      return { success: false, error: `El cupón ${coupon.code} ya está aplicado` };
    }

    appliedCouponsMap.set(coupon.code, coupon);

    return {
      success: true,
      coupon,
      message: `¡Cupón ${coupon.code} aplicado con éxito (-${coupon.percent}%)!`
    };
  }
}

