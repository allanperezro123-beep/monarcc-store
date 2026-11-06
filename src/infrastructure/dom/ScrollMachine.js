/**
 * Infrastructure (DOM Driver): ScrollMachine
 * Sticky header & scroll state transitions.
 */
export class ScrollMachine {
  constructor(threshold = 60) {
    this.threshold = threshold;
  }

  init() {
    const body = document.body;
    window.addEventListener('scroll', () => {
      const y = window.scrollY || window.pageYOffset;
      if (y > this.threshold) {
        body.classList.add('is-scrolled');
      } else {
        body.classList.remove('is-scrolled');
      }
    }, { passive: true });
  }
}

