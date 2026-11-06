/**
 * Infrastructure (DOM Driver): TouchGestures
 * Handles touch gestures (swipe left/right) on product cards and quick-view modals.
 */
export class TouchGestures {
  constructor(onQuickViewSwipe) {
    this.onQuickViewSwipe = onQuickViewSwipe;
  }

  init() {
    document.addEventListener('touchstart', (e) => {
      const slider = e.target.closest('.card-media, #qv-slider');
      if (!slider) return;
      slider._touchStartX = e.touches[0].clientX;
      slider._touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const slider = e.target.closest('.card-media, #qv-slider');
      if (!slider || slider._touchStartX === undefined) return;
      const diffX = e.changedTouches[0].clientX - slider._touchStartX;
      const diffY = e.changedTouches[0].clientY - slider._touchStartY;
      slider._touchStartX = undefined;

      // Only trigger if horizontal swipe > 35px and more horizontal than vertical
      if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        if (slider.id === 'qv-slider') {
          const currentIdx = Math.round(slider.scrollLeft / slider.clientWidth);
          const nextIdx = diffX < 0 ? currentIdx + 1 : currentIdx - 1;
          if (this.onQuickViewSwipe) {
            this.onQuickViewSwipe(Math.max(0, nextIdx));
          }
        } else {
          const prevBtn = slider.querySelector('.slide-arrow.prev');
          const nextBtn = slider.querySelector('.slide-arrow.next');
          if (diffX < 0 && nextBtn) {
            nextBtn.click();
          } else if (diffX > 0 && prevBtn) {
            prevBtn.click();
          }
        }
      }
    }, { passive: true });
  }
}

