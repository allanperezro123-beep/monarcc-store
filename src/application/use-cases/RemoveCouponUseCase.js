/**
 * Use Case: RemoveCoupon
 * Removes an active promotional discount code.
 */
export class RemoveCouponUseCase {
  execute({ code, appliedCouponsMap }) {
    const clean = String(code || '').toUpperCase().trim();
    if (!appliedCouponsMap.has(clean)) {
      return { success: false, error: 'Cupón no encontrado' };
    }

    appliedCouponsMap.delete(clean);
    return {
      success: true,
      removedCode: clean,
      message: `Cupón ${clean} removido`
    };
  }
}

