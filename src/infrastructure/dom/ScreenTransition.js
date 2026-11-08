/**
 * Infrastructure (DOM Driver): ScreenTransition
 * Handles cinematic vector logo self-drawing screen transition overlay.
 * All SVG stroke contours use normalized pathLength="1".
 */
export class ScreenTransition {
  constructor() {
    this.overlay = document.getElementById('screen-transition');
    this.label = document.getElementById('st-label');
    this.fill = document.getElementById('st-progress-fill');
    this._timers = [];
  }

  _clearTimers() {
    while (this._timers.length > 0) {
      clearTimeout(this._timers.pop());
    }
  }

  trigger(label, callback, minDuration = 600) {
    if (!this.overlay) {
      if (callback) callback();
      return;
    }

    this._clearTimers();

    if (this.label && label) {
      this.label.textContent = `MONARCC // ${label.toUpperCase()}`;
    }
    if (this.fill) this.fill.style.width = '0%';

    // Reset active/leaving state BEFORE flushing strokeDashoffset="1" so CSS
    // .screen-transition.is-active .st-stroke-group .st-path-* { stroke-dashoffset: 0 }
    // drives every 1st, 2nd, and Nth replay cleanly without sticky inline "0".
    this.overlay.classList.remove('is-active', 'is-leaving');
    this.overlay.setAttribute('aria-hidden', 'false');

    const paths = this.overlay.querySelectorAll('.st-stroke-group .st-path');
    paths.forEach((p) => {
      p.style.transition = 'none';
      p.style.strokeDashoffset = '1';
    });

    // Flush layout on HTMLElement overlay (SVGElement.offsetWidth is undefined in browsers)
    void this.overlay.offsetWidth;

    paths.forEach((p) => {
      p.style.transition = '';
      p.style.strokeDashoffset = '';
    });

    this.overlay.classList.add('is-active');

    // Animate progress bar
    requestAnimationFrame(() => {
      if (this.fill) this.fill.style.width = '100%';
    });

    this._timers.push(
      setTimeout(() => {
        if (callback) callback();

        this._timers.push(
          setTimeout(() => {
            this.overlay.classList.add('is-leaving');
            this._timers.push(
              setTimeout(() => {
                this.overlay.classList.remove('is-active', 'is-leaving');
                this.overlay.setAttribute('aria-hidden', 'true');
                if (this.fill) this.fill.style.width = '0%';
              }, 360)
            );
          }, 160)
        );
      }, minDuration)
    );
  }
}
