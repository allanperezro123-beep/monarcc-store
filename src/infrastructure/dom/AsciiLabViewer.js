/**
 * Infrastructure (DOM/Canvas Driver): AsciiLabViewer
 * Interactive Mathematical ASCII CAD & Topography Field Simulator.
 * Renders an interactive 2D ASCII character landscape matching the Monarcc Atelier
 * mathematical plot & editorial terrain reference.
 *
 * Obeys Clean Architecture (Infrastructure-only), Cromatismo Roto (obsidian #0C0C0D,
 * slate blue-gray #627E96, champagne gold #C5A46D, warm chalk #F4F2EE),
 * offscreen IntersectionObserver pausing, and prefers-reduced-motion fallback.
 */

import { ASCII_RAMP, evaluateCrownStamp, sampleAsciiRamp } from './AsciiCrownField.js';

export class AsciiLabViewer {
  constructor(options = {}) {
    this.canvasId = options.canvasId ?? 'lab-interactive-canvas';
    this.readoutId = options.readoutId ?? 'lab-readout';
    this.cellWidth = options.cellWidth ?? 10;
    this.cellHeight = options.cellHeight ?? 15;
    this.mode = options.initialMode ?? 'contour'; // 'contour' | 'crown' | 'grid'

    this.canvas = null;
    this.ctx = null;
    this.readoutEl = null;
    this.modeButtons = [];
    this.width = 0;
    this.height = 0;
    this.visible = false;
    this.reducedMotion = false;
    this._rafId = null;
    this._io = null;
    this._onResize = null;
    this._startTime = Date.now();

    this.pointer = {
      active: false,
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 140
    };
  }

  init() {
    if (typeof document === 'undefined') return;

    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext ? this.canvas.getContext('2d') : null;
    if (!this.ctx) return;

    this.readoutEl = document.getElementById(this.readoutId);
    this.modeButtons = Array.from(document.querySelectorAll('[data-lab-mode]'));

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.reducedMotion = Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    this._setupModeControls();
    this._setupPointerEvents();
    this._resize();

    if (typeof IntersectionObserver !== 'undefined') {
      this._io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.target === this.canvas || entry.target === this.canvas.parentElement) {
              this.visible = Boolean(entry.isIntersecting);
            }
          }
          this._syncLoop();
        },
        { rootMargin: '100px 0px' }
      );
      this._io.observe(this.canvas.parentElement || this.canvas);
    } else {
      this.visible = true;
    }

    if (typeof window !== 'undefined') {
      this._onResize = () => {
        this._resize();
        this._render(0);
      };
      window.addEventListener('resize', this._onResize, { passive: true });
    }

    this._render(0);
    this._syncLoop();
  }

  setMode(newMode) {
    if (newMode === this.mode) return;
    this.mode = newMode;
    this.modeButtons.forEach((btn) => {
      const match = btn.getAttribute('data-lab-mode') === newMode;
      btn.classList.toggle('is-active', match);
      btn.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
    this._updateReadout(this.pointer.x, this.pointer.y, 0);
    if (this.reducedMotion) {
      this._render((Date.now() - this._startTime) * 0.001);
    }
  }

  _setupModeControls() {
    this.modeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = btn.getAttribute('data-lab-mode');
        if (mode) this.setMode(mode);
      });
    });
  }

  _setupPointerEvents() {
    const parent = this.canvas.parentElement || this.canvas;

    const onPointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const px = (e.clientX ?? 0) - rect.left;
      const py = (e.clientY ?? 0) - rect.top;
      if (!this.pointer.active) {
        this.pointer.x = px;
        this.pointer.y = py;
      }
      this.pointer.active = true;
      this.pointer.targetX = px;
      this.pointer.targetY = py;
    };

    const onPointerLeave = () => {
      this.pointer.active = false;
      this._updateReadout(0, 0, 0);
    };

    parent.addEventListener('pointermove', onPointerMove, { passive: true });
    parent.addEventListener('pointerleave', onPointerLeave, { passive: true });

    this._cleanupPointer = () => {
      parent.removeEventListener('pointermove', onPointerMove);
      parent.removeEventListener('pointerleave', onPointerLeave);
    };
  }

  _resize() {
    const parent = this.canvas.parentElement || this.canvas;
    const rect = parent.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || 800));
    const height = Math.max(220, Math.min(480, Math.round(rect.height || 360)));
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  _computeSignal(x, y, timeSec) {
    let sampleX = x;
    let sampleY = y;
    let pointerShimmer = 0;

    if (this.pointer.active) {
      const dx = x - this.pointer.x;
      const dy = y - this.pointer.y;
      const distSq = dx * dx + dy * dy;
      const radSq = this.pointer.radius * this.pointer.radius;
      if (distSq < radSq) {
        const dist = Math.sqrt(distSq);
        const falloff = Math.pow(1 - dist / this.pointer.radius, 2);
        const invDist = dist > 0.001 ? 1 / dist : 0;
        const push = falloff * 32;
        sampleX -= dx * invDist * push;
        sampleY -= dy * invDist * push;
        pointerShimmer = falloff;
      }
    }

    const normX = sampleX / this.width;
    const normY = sampleY / this.height;

    if (this.mode === 'crown') {
      // 5-pearl MONARCC crown in normalized stamp space centered on canvas
      const cx = this.width * 0.5;
      const cy = this.height * 0.52;
      const scale = Math.min(this.width * 0.22, this.height * 0.62);
      const nx = (sampleX - cx) / scale;
      const ny = (sampleY - cy) / scale;
      const crownVal = evaluateCrownStamp(nx, ny);

      // Ambient ripple waves radiating outward
      const distCenter = Math.hypot(sampleX - cx, (sampleY - cy) * 1.4);
      const ripple = Math.sin(distCenter * 0.04 - timeSec * 3.5) * 0.5 + 0.5;
      const ambient = ripple * Math.max(0, 1 - distCenter / (this.width * 0.6)) * 0.22;

      const combined = Math.max(crownVal, ambient) + pointerShimmer * 0.25;
      return {
        intensity: Math.max(0, Math.min(1, combined)),
        isGold: crownVal > 0.3 || pointerShimmer > 0.35,
        shimmer: pointerShimmer
      };
    }

    if (this.mode === 'grid') {
      // Wireframe math plot grid lines (similar to math-plot-grid.mp4)
      const gridSpacingX = 24;
      const gridSpacingY = 18;
      const waveZ = Math.sin(normX * 9 + timeSec * 2.2) * Math.cos(normY * 6 - timeSec * 1.8) * 14;
      const modY = (sampleY + waveZ) % gridSpacingY;
      const modX = sampleX % gridSpacingX;
      const isGridLine = modY < 1.4 || modX < 1.2;
      const heightVal = (waveZ + 14) / 28;
      const intensity = (isGridLine ? 0.75 : 0.06) + heightVal * 0.2 + pointerShimmer * 0.3;
      return {
        intensity: Math.max(0, Math.min(1, intensity)),
        isGold: isGridLine && (normY > 0.45 || pointerShimmer > 0.2),
        shimmer: pointerShimmer
      };
    }

    // Default 'contour': Topographical wavy contour strata (matching the reference image!)
    const w1 = Math.sin(normX * 5.2 + timeSec * 0.85);
    const w2 = Math.cos(normY * 4.4 - timeSec * 0.65);
    const w3 = Math.sin((normX + normY) * 3.8 + timeSec * 1.1);
    const elevation = (w1 * 0.4 + w2 * 0.35 + w3 * 0.25 + 1) * 0.5;

    // Strata ridge isolines: peaks repeat vertically to form layered cloud/terrain ridges
    const strataFreq = 16;
    const strataPhase = (normY * strataFreq + elevation * 4.2 + timeSec * 0.35) % 1.0;
    const ridgeIntensity = Math.pow(Math.sin(strataPhase * Math.PI), 3.2);

    const baseVal = elevation * 0.65 + ridgeIntensity * 0.45 + pointerShimmer * 0.25;
    return {
      intensity: Math.max(0, Math.min(1, baseVal)),
      isGold: baseVal > 0.72 || pointerShimmer > 0.4,
      shimmer: pointerShimmer
    };
  }

  _render(timeSec) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.width, this.height);

    // Subtle horizontal scanline rule (every 4px) in broken chalk
    if (typeof ctx.beginPath === 'function') {
      ctx.strokeStyle = 'rgba(244, 242, 238, 0.018)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < this.height; y += 4) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(this.width, y + 0.5);
      }
      ctx.stroke();
    }

    ctx.font = `600 11px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = 'top';

    const cols = Math.ceil(this.width / this.cellWidth);
    const rows = Math.ceil(this.height / this.cellHeight);
    let currentStyle = '';

    for (let r = 0; r < rows; r++) {
      const cy = r * this.cellHeight + this.cellHeight * 0.5;
      for (let c = 0; c < cols; c++) {
        const cx = c * this.cellWidth + this.cellWidth * 0.5;
        const sig = this._computeSignal(cx, cy, timeSec);
        if (sig.intensity <= 0.05) continue;

        const ch = sampleAsciiRamp(sig.intensity);
        if (ch === ' ') continue;

        let style = '';
        if (sig.isGold) {
          const alpha = Math.min(0.88, 0.35 + sig.intensity * 0.5);
          style = `rgba(197, 164, 109, ${alpha.toFixed(2)})`;
        } else if (sig.intensity > 0.45) {
          // Warm broken chalk
          const alpha = Math.min(0.82, 0.22 + sig.intensity * 0.55);
          style = `rgba(244, 242, 238, ${alpha.toFixed(2)})`;
        } else {
          // Slate blue-gray tone matching reference image
          const alpha = Math.min(0.65, 0.15 + sig.intensity * 0.45);
          style = `rgba(98, 126, 150, ${alpha.toFixed(2)})`;
        }

        if (style !== currentStyle) {
          ctx.fillStyle = style;
          currentStyle = style;
        }
        ctx.fillText(ch, c * this.cellWidth, r * this.cellHeight);
      }
    }
  }

  _updateReadout(px, py, timeSec) {
    if (!this.readoutEl) return;
    const modeLabel = this.mode.toUpperCase();
    if (this.pointer.active) {
      const tensorVal = (0.65 + 0.3 * Math.sin(px * 0.02 + py * 0.015)).toFixed(3);
      this.readoutEl.textContent = `P: [${Math.round(px)}px, ${Math.round(py)}px] • TENSOR: ${tensorVal} • MODO: ${modeLabel} • FREQ: 30 FPS`;
    } else {
      this.readoutEl.textContent = `ESTADO: ACTIVO • MODO: ${modeLabel} • DINÁMICA: AUTO-ONDULACIÓN TEXTIL`;
    }
  }

  _syncLoop() {
    if (this.reducedMotion || !this.visible) {
      this._stopLoop();
      return;
    }

    if (this._rafId === null && typeof requestAnimationFrame === 'function') {
      let lastTs = Date.now();
      const tick = () => {
        this._rafId = null;
        if (this.reducedMotion || !this.visible) return;

        const now = Date.now();
        const dt = Math.min(0.05, Math.max(0.008, (now - lastTs) * 0.001));
        lastTs = now;
        const timeSec = (now - this._startTime) * 0.001;

        if (this.pointer.active) {
          const ease = Math.min(1, dt * 10);
          this.pointer.x += (this.pointer.targetX - this.pointer.x) * ease;
          this.pointer.y += (this.pointer.targetY - this.pointer.y) * ease;
          this._updateReadout(this.pointer.x, this.pointer.y, timeSec);
        }

        this._render(timeSec);
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    }
  }

  _stopLoop() {
    if (this._rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this._rafId);
    }
    this._rafId = null;
  }

  destroy() {
    this._stopLoop();
    if (this._io) {
      this._io.disconnect();
      this._io = null;
    }
    if (this._cleanupPointer) {
      this._cleanupPointer();
      this._cleanupPointer = null;
    }
    if (typeof window !== 'undefined' && this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
  }
}
