/**
 * Controller: VipController
 * Orchestrates secret VIP unlock interactions (triple taps, key combos).
 */
export class VipController {
  constructor({
    unlockVipUseCase,
    appliedCouponsMap,
    catalogController,
    cartController,
    domRenderer
  }) {
    this.unlockVipUseCase = unlockVipUseCase;
    this.appliedCouponsMap = appliedCouponsMap;
    this.catalogController = catalogController;
    this.cartController = cartController;
    this.domRenderer = domRenderer;
    this.crownTaps = 0;
    this.crownTapTimer = null;
    this.keyBuffer = '';
  }

  handleTap() {
    this.crownTaps += 1;
    clearTimeout(this.crownTapTimer);

    if (this.crownTaps === 1) {
      if (this.domRenderer) this.domRenderer.showToast('Corona tocada... (1/3)');
    } else if (this.crownTaps === 2) {
      if (this.domRenderer) this.domRenderer.showToast('Un toque más para el Círculo VIP... (2/3)');
    } else if (this.crownTaps >= 3) {
      this.crownTaps = 0;
      return this.unlock('triple toque');
    }

    this.crownTapTimer = setTimeout(() => {
      this.crownTaps = 0;
    }, 2000);
  }

  handleKey(char) {
    this.keyBuffer += char.toLowerCase();
    if (this.keyBuffer.length > 10) this.keyBuffer = this.keyBuffer.slice(-10);

    if (this.keyBuffer.includes('monarcc')) {
      this.keyBuffer = '';
      return this.unlock('código de teclado');
    }
  }

  unlock(source = 'secreto') {
    const res = this.unlockVipUseCase.execute({
      appliedCouponsMap: this.appliedCouponsMap,
      source
    });

    if (this.catalogController) {
      this.catalogController.vipUnlocked = true;
      this.catalogController.filterAndRender();
    }
    if (this.cartController) {
      this.cartController.updateUI();
    }
    if (this.domRenderer) {
      this.domRenderer.triggerVipFlash();
      this.domRenderer.showToast(res.message);
      this.domRenderer.openVipModal();
    }
    return res;
  }
}

