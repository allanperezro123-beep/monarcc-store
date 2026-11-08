/**
 * Infrastructure (DOM/Canvas Driver): AsciiCrownField
 * Renders a whisper-subtle, interactive 2D ASCII field of drifting multi-scale
 * 5-pearl hollow-ribbed MONARCC crowns on dark editorial bands ([data-ascii-crowns]).
 *
 * Strictly obeys Clean Architecture (Infrastructure-only), Cromatismo Roto
 * (broken champagne #C5A46D & warm chalk #F4F2EE at <= 0.078 alpha),
 * offscreen IntersectionObserver pausing, and prefers-reduced-motion static fallback.
 */

export const ASCII_RAMP = ' .:-=+*#%@';

const CROWN_OUTER = [
  [561, 884],
  [493, 586],
  [656, 856],
  [658, 703],
  [724, 858],
  [800, 468],
  [876, 858],
  [942, 703],
  [944, 856],
  [1107, 586],
  [1039, 884]
];

const CUT_LEFT_OUTER = [
  [552, 726],
  [582, 864],
  [638, 864]
];

const CUT_LEFT_INNER = [
  [673, 782],
  [673, 864],
  [708, 864]
];

const CUT_CENTER = [
  [800, 608],
  [748, 864],
  [852, 864]
];

function sdPolygon(px, py, poly) {
  let minDistSq = Infinity;
  let sign = 1;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const ex = xj - xi;
    const ey = yj - yi;
    const wx = px - xi;
    const wy = py - yi;
    const lenSq = ex * ex + ey * ey;
    const h = lenSq > 0 ? Math.max(0, Math.min(1, (wx * ex + wy * ey) / lenSq)) : 0;
    const dx = wx - ex * h;
    const dy = wy - ey * h;
    const distSq = dx * dx + dy * dy;
    if (distSq < minDistSq) minDistSq = distSq;

    const c1 = py >= yi;
    const c2 = py < yj;
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) {
      sign = -sign;
    }
  }
  return sign * Math.sqrt(minDistSq);
}

/**
 * Evaluates the canonical 5-pearl hollow-ribbed MONARCC crown + base bar SDF
 * in normalized stamp space where (0, 0) = (800, 662.5) and 1.0 = 360 SVG units.
 */
export function evaluateCrownStamp(nx, ny) {
  if (Math.abs(nx) > 1.16 || Math.abs(ny) > 1.02) return 0;

  // Exploit exact mirror symmetry across x = 800
  const absDx = Math.abs(nx * 360);
  const sx = 800 - absDx;
  const sy = 662.5 + ny * 360;

  // 1. 5 mathematical pearls (folded onto left + center)
  const dPearlCenter = Math.hypot(absDx, sy - 398) - 23;
  const dPearlOuter = Math.hypot(sx - 476, sy - 531) - 20.5;
  const dPearlInner = Math.hypot(sx - 654, sy - 671) - 11.5;
  const sdPearls = Math.min(dPearlCenter, dPearlOuter, dPearlInner);

  // 2. Horizontal base bar: centered at (800, 931), half-size (239, 15)
  const bx = absDx - 239;
  const by = Math.abs(sy - 931) - 15;
  const sdBar = Math.hypot(Math.max(bx, 0), Math.max(by, 0)) + Math.min(Math.max(bx, by), 0);

  // 3. Hollow-ribbed crown body: outer silhouette minus interior rib cutouts
  const sdOuter = sdPolygon(sx, sy, CROWN_OUTER);
  const sdCut1 = sdPolygon(sx, sy, CUT_LEFT_OUTER);
  const sdCut2 = sdPolygon(sx, sy, CUT_LEFT_INNER);
  const sdCut3 = sdPolygon(sx, sy, CUT_CENTER);
  const sdHollowBody = Math.max(sdOuter, -sdCut1, -sdCut2, -sdCut3);

  const sd = Math.min(sdPearls, sdBar, sdHollowBody);

  if (sd <= 0) {
    return Math.min(1, 0.82 + Math.min(1, -sd / 18) * 0.18);
  }
  const feather = 28;
  if (sd < feather) {
    const t = 1 - sd / feather;
    return t * t * 0.58;
  }
  return 0;
}

/**
 * Maps normalized [0..1] intensity to the editorial ASCII density ramp.
 */
export function sampleAsciiRamp(intensity) {
  const clamped = Math.max(0, Math.min(1, intensity));
  if (clamped <= 0.045) return ' ';
  const normalized = (clamped - 0.045) / 0.955;
  const idx = Math.min(ASCII_RAMP.length - 1, 1 + Math.floor(normalized * (ASCII_RAMP.length - 1)));
  return ASCII_RAMP[idx];
}

/**
 * Computes combined multi-crown ASCII intensity + subtle pointer dispersion at (x, y).
 */
export function computeCellSignal(x, y, crowns, pointer, timeSec = 0, pointerRadius = 135) {
  let sampleX = x;
  let sampleY = y;
  let shimmer = 0;

  if (pointer && pointer.active) {
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const distSq = dx * dx + dy * dy;
    const radSq = pointerRadius * pointerRadius;
    if (distSq < radSq) {
      const dist = Math.sqrt(distSq);
      const falloff = Math.pow(1 - dist / pointerRadius, 2);
      const invDist = dist > 0.001 ? 1 / dist : 0;
      const push = falloff * 24;
      sampleX -= dx * invDist * push;
      sampleY -= dy * invDist * push;
      shimmer = falloff;
    }
  }

  let peak = 0;
  for (let i = 0; i < crowns.length; i++) {
    const c = crowns[i];
    const relX = (sampleX - c.x) / c.scale;
    const relY = (sampleY - c.y) / c.scale;
    const cos = Math.cos(c.angle || 0);
    const sin = Math.sin(c.angle || 0);
    const nx = relX * cos + relY * sin;
    const ny = -relX * sin + relY * cos;
    const val = evaluateCrownStamp(nx, ny);
    if (val > peak) peak = val;
  }

  if (peak > 0 && timeSec !== 0) {
    const breathe = 0.95 + 0.05 * Math.sin(timeSec * 1.15 + x * 0.012);
    peak *= breathe;
  }

  if (peak > 0 && shimmer > 0) {
    peak = Math.min(1, peak + shimmer * 0.14);
  }

  return {
    intensity: Math.max(0, Math.min(1, peak)),
    shimmer
  };
}

export class AsciiCrownField {
  constructor(options = {}) {
    this.selector = options.selector ?? '[data-ascii-crowns]';
    this.cellWidth = options.cellWidth ?? 10;
    this.cellHeight = options.cellHeight ?? 15;
    this.maxAlpha = Math.min(0.082, options.maxAlpha ?? 0.072);
    this.pointerRadius = options.pointerRadius ?? 135;

    this.instances = [];
    this.reducedMotion = false;
    this._rafId = null;
    this._io = null;
    this._onResize = null;
    this._startTime = Date.now();
  }

  init() {
    if (typeof document === 'undefined') return;

    const nodes = Array.from(document.querySelectorAll(this.selector));
    if (nodes.length === 0) return;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.reducedMotion = Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this._io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const inst = this.instances.find((it) => it.section === entry.target);
            if (inst) {
              inst.visible = Boolean(entry.isIntersecting);
            }
          }
          this._syncAnimationLoop();
        },
        { rootMargin: '120px 0px' }
      );
    }

    for (let idx = 0; idx < nodes.length; idx++) {
      const section = nodes[idx];
      const canvas = document.createElement('canvas');
      canvas.setAttribute('class', 'ascii-crown-bg');
      canvas.classList.add('ascii-crown-bg');
      canvas.setAttribute('aria-hidden', 'true');
      section.prepend(canvas);

      const inst = {
        section,
        canvas,
        ctx: canvas.getContext ? canvas.getContext('2d') : null,
        width: 0,
        height: 0,
        visible: true,
        crowns: [],
        pointer: {
          active: false,
          targetX: 0,
          targetY: 0,
          x: 0,
          y: 0
        },
        onMove: null,
        onLeave: null
      };

      this._resizeInstance(inst, idx);

      inst.onMove = (e) => {
        const rect = section.getBoundingClientRect();
        const px = (e.clientX ?? 0) - rect.left;
        const py = (e.clientY ?? 0) - rect.top;
        if (!inst.pointer.active) {
          inst.pointer.x = px;
          inst.pointer.y = py;
        }
        inst.pointer.active = true;
        inst.pointer.targetX = px;
        inst.pointer.targetY = py;
      };
      inst.onLeave = () => {
        inst.pointer.active = false;
      };

      section.addEventListener('pointermove', inst.onMove, { passive: true });
      section.addEventListener('pointerleave', inst.onLeave, { passive: true });

      if (this._io) {
        this._io.observe(section);
      }

      this.instances.push(inst);
      this._renderInstance(inst, 0);
    }

    if (typeof window !== 'undefined') {
      this._onResize = () => {
        this.instances.forEach((inst, idx) => {
          this._resizeInstance(inst, idx);
          this._renderInstance(inst, (Date.now() - this._startTime) * 0.001);
        });
      };
      window.addEventListener('resize', this._onResize, { passive: true });
    }

    this._syncAnimationLoop();
  }

  _resizeInstance(inst, seedIdx = 0) {
    const rect = inst.section.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || 1200));
    const height = Math.max(180, Math.round(rect.height || 360));
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    inst.width = width;
    inst.height = height;
    inst.canvas.width = Math.round(width * dpr);
    inst.canvas.height = Math.round(height * dpr);

    if (inst.ctx) {
      inst.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const baseScale = Math.max(88, Math.min(155, Math.min(width * 0.14, height * 0.44)));
    inst.crowns = [
      {
        x: width * 0.16,
        y: height * 0.52,
        scale: baseScale * 1.05,
        vx: 7.5,
        vy: -3.2,
        angle: -0.045,
        spin: 0.018 + seedIdx * 0.003
      },
      {
        x: width * 0.52,
        y: height * 0.46,
        scale: baseScale * 0.82,
        vx: -6.2,
        vy: 2.8,
        angle: 0.03,
        spin: -0.015
      },
      {
        x: width * 0.84,
        y: height * 0.54,
        scale: baseScale * 1.12,
        vx: -8.1,
        vy: -2.4,
        angle: 0.05,
        spin: 0.014
      }
    ];
  }

  _stepPhysics(inst, dt) {
    if (inst.pointer.active) {
      const ease = Math.min(1, dt * 10);
      inst.pointer.x += (inst.pointer.targetX - inst.pointer.x) * ease;
      inst.pointer.y += (inst.pointer.targetY - inst.pointer.y) * ease;
    }

    const padX = 140;
    const padY = 90;
    for (const c of inst.crowns) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.angle = Math.sin((Date.now() - this._startTime) * 0.00045 + c.scale) * 0.055;

      if (c.x < -padX) c.x = inst.width + padX;
      else if (c.x > inst.width + padX) c.x = -padX;

      if (c.y < -padY) c.y = inst.height + padY;
      else if (c.y > inst.height + padY) c.y = -padY;
    }
  }

  _renderInstance(inst, timeSec) {
    const ctx = inst.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, inst.width, inst.height);
    ctx.font = `500 11px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textBaseline = 'top';

    const cols = Math.ceil(inst.width / this.cellWidth);
    const rows = Math.ceil(inst.height / this.cellHeight);
    let currentStyle = '';

    for (let r = 0; r < rows; r++) {
      const cy = r * this.cellHeight + this.cellHeight * 0.5;
      for (let c = 0; c < cols; c++) {
        const cx = c * this.cellWidth + this.cellWidth * 0.5;
        const sig = computeCellSignal(cx, cy, inst.crowns, inst.pointer, timeSec, this.pointerRadius);
        if (sig.intensity <= 0.045) continue;

        const ch = sampleAsciiRamp(sig.intensity);
        if (ch === ' ') continue;

        const useGold = sig.intensity >= 0.42 || sig.shimmer > 0.15;
        const rawAlpha = useGold
          ? 0.032 + sig.intensity * (this.maxAlpha - 0.032) + sig.shimmer * 0.008
          : 0.02 + sig.intensity * 0.028;
        const alpha = Math.min(0.08, Math.round(rawAlpha * 200) / 200);
        const nextStyle = useGold
          ? `rgba(197, 164, 109, ${alpha})`
          : `rgba(244, 242, 238, ${alpha})`;

        if (nextStyle !== currentStyle) {
          ctx.fillStyle = nextStyle;
          currentStyle = nextStyle;
        }
        ctx.fillText(ch, c * this.cellWidth, r * this.cellHeight);
      }
    }
  }

  _syncAnimationLoop() {
    if (this.reducedMotion) {
      this._stopLoop();
      return;
    }

    const anyVisible = this.instances.some((inst) => inst.visible);
    if (!anyVisible) {
      this._stopLoop();
      return;
    }

    if (this._rafId === null && typeof requestAnimationFrame === 'function') {
      let lastTs = Date.now();
      const tick = () => {
        this._rafId = null;
        if (this.reducedMotion || !this.instances.some((inst) => inst.visible)) {
          return;
        }
        const now = Date.now();
        const dt = Math.min(0.05, Math.max(0.008, (now - lastTs) * 0.001));
        lastTs = now;
        const timeSec = (now - this._startTime) * 0.001;

        for (const inst of this.instances) {
          if (!inst.visible) continue;
          this._stepPhysics(inst, dt);
          this._renderInstance(inst, timeSec);
        }

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
    if (typeof window !== 'undefined' && this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    for (const inst of this.instances) {
      if (inst.onMove) inst.section.removeEventListener('pointermove', inst.onMove);
      if (inst.onLeave) inst.section.removeEventListener('pointerleave', inst.onLeave);
      if (inst.canvas && typeof inst.canvas.remove === 'function') {
        inst.canvas.remove();
      }
    }
    this.instances = [];
  }
}
