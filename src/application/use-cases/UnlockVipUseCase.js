import { Coupon } from '../../domain/entities/Coupon.js';

/**
 * Use Case: UnlockVip
 * Application business rule: Unlocks the secret VIP Monarca mode,
 * granting the hidden product and applying the VIP 10% coupon.
 */
export class UnlockVipUseCase {
  constructor(storageService) {
    this.storageService = storageService;
  }

  execute({ appliedCouponsMap, source = 'secreto' }) {
    const vipCoupon = Coupon.fromCode('CROWNVIP10');
    if (vipCoupon && appliedCouponsMap) {
      appliedCouponsMap.set(vipCoupon.code, vipCoupon);
    }

    if (this.storageService) {
      this.storageService.setItem('monarcc_vip_unlocked', 'true');
    }

    return {
      success: true,
      vipUnlocked: true,
      appliedCoupon: vipCoupon,
      source,
      message: `¡MODO MONARCA VIP DESBLOQUEADO (${source})!`
    };
  }
}

