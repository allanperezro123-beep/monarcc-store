/**
 * Infrastructure (DOM Driver): ScreenTransition
 * Handles cinematic vector logo self-drawing screen transition overlay.
 */
export class ScreenTransition {
  constructor() {
    this.overlay = document.getElementById('screen-transition');
    this.label = document.getElementById('st-label');
    this.fill = document.getElementById('st-progress-fill');
  }

  trigger(label, callback, minDuration = 600) {
    if (!this.overlay) {
      if (callback) callback();
      return;
    }

    if (this.label && label) {
      this.label.textContent = `MONARCC // ${label.toUpperCase()}`;
    }
    if (this.fill) this.fill.style.width = '0%';

    this.overlay.classList.remove('is-leaving');
    this.overlay.classList.add('is-active');

    // Force draw animation reset & trigger
    const paths = this.overlay.querySelectorAll('.st-stroke-group .st-path');
    paths.forEach(p => {
      p.style.strokeDashoffset = '1000';
      void p.offsetWidth; // force reflow
      p.style.strokeDashoffset = '0';
    });

    // Animate progress bar
    requestAnimationFrame(() => {
      if (this.fill) this.fill.style.width = '100%';
    });

    setTimeout(() => {
      if (callback) callback();

      setTimeout(() => {
        this.overlay.classList.add('is-leaving');
        setTimeout(() => {
          this.overlay.classList.remove('is-active', 'is-leaving');
          if (this.fill) this.fill.style.width = '0%';
        }, 360);
      }, 160);
    }, minDuration);
  }
}

