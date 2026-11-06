/**
 * Infrastructure (DOM Driver): MobileDock
 * Handles floating mobile dock interaction, destination scrolling, and smart hiding.
 */
export class MobileDock {
  constructor(screenTransition, onFilterClick, onCartClick) {
    this.screenTransition = screenTransition;
    this.onFilterClick = onFilterClick;
    this.onCartClick = onCartClick;
    this.dock = document.getElementById('mobile-dock');
  }

  init() {
    if (!this.dock) return;

    // Navigation buttons
    this.dock.querySelectorAll('.dock-btn[data-dest]').forEach(btn => {
      btn.addEventListener('click', () => {
        const destSel = btn.dataset.dest;
        const dest = document.querySelector(destSel);
        const label = btn.querySelector('span')?.textContent || 'MONARCC';

        this.dock.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        if (this.screenTransition) {
          this.screenTransition.trigger(label, () => {
            if (dest) dest.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        } else if (dest) {
          dest.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Filter drawer trigger
    const dockFilter = document.getElementById('dock-filter-btn');
    if (dockFilter && this.onFilterClick) {
      dockFilter.addEventListener('click', () => this.onFilterClick());
    }

    // Cart drawer trigger
    const dockCart = document.getElementById('dock-cart-btn');
    if (dockCart && this.onCartClick) {
      dockCart.addEventListener('click', () => this.onCartClick());
    }

    // Scroll hide/reveal
    let lastScroll = 0;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const curr = window.scrollY || window.pageYOffset;
          if (curr > lastScroll + 10 && curr > 140) {
            document.body.classList.add('dock-hidden');
          } else if (curr < lastScroll - 10 || curr <= 60) {
            document.body.classList.remove('dock-hidden');
          }
          lastScroll = curr;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
}

