/**
 * Infrastructure (DOM Driver): ScrollMachine
 * Hysteresis-protected sticky header & brand scroll morph state machine:
 * - scrollY > downThreshold (14px) -> 'scrolled' (shows crisp MONARCC wordmark)
 * - scrollY <= topThreshold (2px)  -> 'top' (swaps to 5-pearl crown + plays self-drawing animation)
 */
export class ScrollMachine {
  constructor(options = {}) {
    if (typeof options === 'number') {
      this.downThreshold = options;
      this.topThreshold = 2;
      this.brandEl = null;
      this.onReachTop = null;
      this.drawDurationMs = 920;
    } else {
      this.downThreshold = options.downThreshold ?? 14;
      this.topThreshold = options.topThreshold ?? 2;
      this.brandEl = options.brandEl ?? null;
      this.onReachTop = options.onReachTop ?? null;
      this.drawDurationMs = options.drawDurationMs ?? 920;
    }

    this.state = 'top';
    this._onScroll = null;
    this._drawTimer = null;
  }

  _readScrollY() {
    if (typeof window === 'undefined') return 0;
    return Math.max(0, window.scrollY ?? window.pageYOffset ?? 0);
  }

  init() {
    if (typeof document !== 'undefined' && !this.brandEl) {
      this.brandEl = document.getElementById('header-logo');
    }

    const y = this._readScrollY();
    if (y > this.downThreshold) {
      this._applyState('scrolled', { animateCrown: false, notifyTop: false });
    } else {
      this._applyState('top', { animateCrown: false, notifyTop: false });
    }

    if (typeof window !== 'undefined') {
      this._onScroll = () => this.update();
      window.addEventListener('scroll', this._onScroll, { passive: true });
    }
  }

  update() {
    const y = this._readScrollY();

    if (this.state !== 'scrolled' && y > this.downThreshold) {
      this._applyState('scrolled', { animateCrown: false, notifyTop: false });
    } else if (this.state === 'scrolled' && y <= this.topThreshold) {
      this._applyState('top', { animateCrown: true, notifyTop: true });
    }
  }

  _applyState(nextState, { animateCrown, notifyTop }) {
    this.state = nextState;
    const body = typeof document !== 'undefined' ? document.body : null;

    if (nextState === 'scrolled') {
      if (body) body.classList.add('is-scrolled');
      if (this._drawTimer) {
        clearTimeout(this._drawTimer);
        this._drawTimer = null;
      }
      if (this.brandEl) {
        this.brandEl.classList.remove('is-drawing');
        this.brandEl.setAttribute('data-drawing', 'false');
        this.brandEl.setAttribute('data-brand-mode', 'wordmark');
      }
      return;
    }

    if (body) body.classList.remove('is-scrolled');
    if (this.brandEl) {
      this.brandEl.setAttribute('data-brand-mode', 'crown');
    }

    if (animateCrown) {
      this.triggerCrownDraw();
    }
    if (notifyTop && typeof this.onReachTop === 'function') {
      this.onReachTop();
    }
  }

  isAtTop() {
    return this.state !== 'scrolled';
  }

  triggerCrownDraw() {
    if (typeof document !== 'undefined' && !this.brandEl) {
      this.brandEl = document.getElementById('header-logo');
    }
    if (!this.brandEl) return;

    if (this._drawTimer) {
      clearTimeout(this._drawTimer);
      this._drawTimer = null;
    }

    this.brandEl.setAttribute('data-brand-mode', 'crown');
    this.brandEl.classList.remove('is-drawing');
    this.brandEl.setAttribute('data-drawing', 'false');

    const strokes = this.brandEl.querySelectorAll('.crown-stroke');
    strokes.forEach((el) => {
      el.style.transition = 'none';
      el.style.strokeDashoffset = '1';
    });

    // Flush layout on HTMLElement button (SVGElement.offsetWidth is undefined in browsers)
    void this.brandEl.offsetWidth;

    strokes.forEach((el) => {
      el.style.transition = '';
      el.style.strokeDashoffset = '';
    });

    this.brandEl.classList.add('is-drawing');
    this.brandEl.setAttribute('data-drawing', 'true');

    this._drawTimer = setTimeout(() => {
      if (this.brandEl) {
        this.brandEl.classList.remove('is-drawing');
        this.brandEl.setAttribute('data-drawing', 'false');
      }
      this._drawTimer = null;
    }, this.drawDurationMs);
  }

  destroy() {
    if (typeof window !== 'undefined' && this._onScroll) {
      window.removeEventListener('scroll', this._onScroll);
      this._onScroll = null;
    }
    if (this._drawTimer) {
      clearTimeout(this._drawTimer);
      this._drawTimer = null;
    }
  }
}
