/**
 * Infrastructure (DOM/WebGL Driver): Crown3DViewer
 * Renders a high-performance, semi-interactive 3D volumetric model of the official
 * MONARCC 5-pearl hollow-ribbed crown in the main Hero section.
 *
 * Adheres strictly to:
 * - Clean Architecture (Infrastructure-only DOM/WebGL driver)
 * - Cromatismo Roto (Warm champagne gold #C5A46D, ivory #F7E8C8, ochre #9A7D49; zero pure #000/#fff)
 * - Offscreen IntersectionObserver render-loop pausing (0% GPU/battery drain offscreen)
 * - Touch & pointer drag with inertia, tilt parallax, and gentle idle floating
 * - prefers-reduced-motion static rendering
 * - Graceful progressive enhancement (preserves 2D SVG if WebGL is unavailable)
 */

let THREE_MODULE = null;

async function resolveThree(injectedThree = null) {
  if (injectedThree) return injectedThree;
  if (THREE_MODULE) return THREE_MODULE;

  // 1. Primary: Local vendor module (zero network latency, offline ready)
  try {
    THREE_MODULE = await import('../../vendor/three.module.min.js');
    return THREE_MODULE;
  } catch (localErr) {
    console.warn('[Crown3DViewer] Local Three.js vendor unavailable, falling back to CDN...', localErr);
  }

  // 2. Secondary: High-availability CDN fallback
  try {
    THREE_MODULE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js');
    return THREE_MODULE;
  } catch (cdnErr) {
    console.error('[Crown3DViewer] Three.js could not be resolved from vendor or CDN:', cdnErr);
    throw cdnErr;
  }
}

// Canonical mathematical coordinates of the MONARCC crown in SVG viewBox space
export const CROWN_3D_COORDINATES = {
  scale: 0.0036,
  originX: 800,
  originY: 665,
  outer: [
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
  ],
  cuts: [
    [[552, 726], [582, 864], [638, 864]],
    [[673, 782], [673, 864], [708, 864]],
    [[800, 608], [748, 864], [852, 864]],
    [[927, 782], [892, 864], [927, 864]],
    [[1048, 726], [962, 864], [1018, 864]]
  ],
  bar: {
    width: 478,
    height: 30,
    y: 931,
    radius: 4
  },
  pearls: [
    { cx: 800, cy: 398, r: 23 },
    { cx: 476, cy: 531, r: 20.5 },
    { cx: 1124, cy: 531, r: 20.5 },
    { cx: 654, cy: 671, r: 11.5 },
    { cx: 946, cy: 671, r: 11.5 }
  ]
};

export class Crown3DViewer {
  /**
   * @param {Object} [options]
   * @param {Object} [options.three] Optional injected Three.js instance
   * @param {string} [options.containerId='hero-crown-3d'] DOM container ID
   * @param {string} [options.lockupSelector='.hero-brand-lockup'] Parent brand lockup selector
   */
  constructor(options = {}) {
    this.injectedThree = options.three || null;
    this.containerId = options.containerId || 'hero-crown-3d';
    this.lockupSelector = options.lockupSelector || '.hero-brand-lockup';

    this.container = null;
    this.lockup = null;
    this.three = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.crownGroup = null;
    this.pointLight = null;
    this.keyLight = null;

    // Materials and Geometries tracking for clean disposal
    this.disposables = [];

    // State & Physics Animation variables
    this.animId = null;
    this.isVisible = false;
    this.isDragging = false;
    this.hasUserInteracted = false;
    this.clock = null;

    // Damped rotational state
    this.targetRotY = 0;
    this.targetRotX = 0;
    this.currentRotY = 0;
    this.currentRotX = 0;
    this.manualRotY = 0;
    this.manualRotX = 0;
    this.hoverRotY = 0;
    this.hoverRotX = 0;
    this.dragVelocityY = 0;
    this.dragVelocityX = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    // Flash/Shimmer effect state
    this.flashIntensity = 0;

    // Bound listeners for clean destruction
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);
    this._onResize = this._handleResize.bind(this);
    this._onContextLost = this._handleContextLost.bind(this);
    this._onContextRestored = this._handleContextRestored.bind(this);
  }

  /**
   * Initializes and mounts the 3D Crown Viewer.
   */
  async init() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    this.container = document.getElementById(this.containerId);
    this.lockup = document.querySelector(this.lockupSelector);

    if (!this.container) {
      return false;
    }

    try {
      this.three = await resolveThree(this.injectedThree);
      if (!this.three) return false;

      // Verify WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('[Crown3DViewer] WebGL is not supported on this device. Retaining 2D SVG logo.');
        return false;
      }

      this._setupScene();
      this._buildCrownGeometry();
      this._setupLighting();
      this._bindEvents();
      this._setupIntersectionObserver();

      // Signal successful 3D mount to parent lockup (fades in 3D canvas, hides 2D crown)
      if (this.lockup) {
        this.lockup.classList.add('has-3d-crown');
      }

      this.isVisible = true;
      this._animate();
      return true;
    } catch (err) {
      console.warn('[Crown3DViewer] Initialization failed, maintaining SVG fallback:', err);
      return false;
    }
  }

  _setupScene() {
    const THREE = this.three;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    const rect = this.container.getBoundingClientRect();
    const width = Math.max(rect.width || 340, 240);
    const height = Math.max(rect.height || 220, 160);
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 50);
    this.camera.position.set(0, 0, 4.4);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Empty container before attaching canvas
    this.container.innerHTML = '';
    const domElement = this.renderer.domElement;
    domElement.style.display = 'block';
    domElement.style.width = '100%';
    domElement.style.height = '100%';
    domElement.style.outline = 'none';
    domElement.style.cursor = 'grab';
    this.container.appendChild(domElement);
  }

  _buildCrownGeometry() {
    const THREE = this.three;
    const { scale, originX, originY, outer, cuts, bar, pearls } = CROWN_3D_COORDINATES;

    const tx = (x) => (x - originX) * scale;
    const ty = (y) => -(y - originY) * scale;

    this.crownGroup = new THREE.Group();

    // 1. Extruded Hollow Crown Mesh
    const crownShape = new THREE.Shape();
    crownShape.moveTo(tx(outer[0][0]), ty(outer[0][1]));
    for (let i = 1; i < outer.length; i++) {
      crownShape.lineTo(tx(outer[i][0]), ty(outer[i][1]));
    }
    crownShape.closePath();

    cuts.forEach((cut) => {
      const hole = new THREE.Path();
      hole.moveTo(tx(cut[0][0]), ty(cut[0][1]));
      for (let i = 1; i < cut.length; i++) {
        hole.lineTo(tx(cut[i][0]), ty(cut[i][1]));
      }
      hole.closePath();
      crownShape.holes.push(hole);
    });

    const crownExtrudeSettings = {
      depth: 0.11,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.016,
      bevelThickness: 0.02
    };

    const crownGeo = new THREE.ExtrudeGeometry(crownShape, crownExtrudeSettings);
    this.disposables.push(crownGeo);

    // Luxury PBR Champagne Gold Material (Cromatismo Roto)
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xC5A46D,
      emissive: 0x181308,
      metalness: 0.90,
      roughness: 0.22,
      clearcoat: 0.55,
      clearcoatRoughness: 0.16,
      reflectivity: 0.92
    });
    this.disposables.push(goldMaterial);

    const crownMesh = new THREE.Mesh(crownGeo, goldMaterial);
    crownMesh.position.z = -crownExtrudeSettings.depth / 2;
    this.crownGroup.add(crownMesh);

    // 2. Extruded Base Bar
    const barShape = new THREE.Shape();
    const barW = bar.width * scale;
    const barH = bar.height * scale;
    const barR = bar.radius * scale;

    barShape.moveTo(-barW / 2 + barR, -barH / 2);
    barShape.lineTo(barW / 2 - barR, -barH / 2);
    barShape.quadraticCurveTo(barW / 2, -barH / 2, barW / 2, -barH / 2 + barR);
    barShape.lineTo(barW / 2, barH / 2 - barR);
    barShape.quadraticCurveTo(barW / 2, barH / 2, barW / 2 - barR, barH / 2);
    barShape.lineTo(-barW / 2 + barR, barH / 2);
    barShape.quadraticCurveTo(-barW / 2, barH / 2, -barW / 2, barH / 2 - barR);
    barShape.lineTo(-barW / 2, -barH / 2 + barR);
    barShape.quadraticCurveTo(-barW / 2, -barH / 2, -barW / 2 + barR, -barH / 2);

    const barGeo = new THREE.ExtrudeGeometry(barShape, {
      depth: 0.11,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.018
    });
    this.disposables.push(barGeo);

    const barMesh = new THREE.Mesh(barGeo, goldMaterial);
    barMesh.position.set(0, ty(bar.y), -0.055);
    this.crownGroup.add(barMesh);

    // 3. Five Pearls (High-gloss Ivory Champagne)
    const pearlMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xF7E8C8,
      emissive: 0x1E180B,
      metalness: 0.60,
      roughness: 0.14,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
      reflectivity: 1.0
    });
    this.disposables.push(pearlMaterial);

    pearls.forEach((p) => {
      const radius = p.r * scale;
      const pearlGeo = new THREE.SphereGeometry(radius, 24, 18);
      this.disposables.push(pearlGeo);

      const pearlMesh = new THREE.Mesh(pearlGeo, pearlMaterial);
      pearlMesh.position.set(tx(p.cx), ty(p.cy), 0);
      this.crownGroup.add(pearlMesh);
    });

    this.scene.add(this.crownGroup);
  }

  _setupLighting() {
    const THREE = this.three;

    // Warm, broken ambient light (never pitch-black shadows)
    const ambientLight = new THREE.AmbientLight(0x32281D, 1.6);
    this.scene.add(ambientLight);

    // Key Light: Upper right warm champagne highlight (illuminates face with rich gold speculars)
    this.keyLight = new THREE.DirectionalLight(0xFFF6E2, 2.6);
    this.keyLight.position.set(2.5, 3.8, 5.0);
    this.scene.add(this.keyLight);

    // Fill Light: Lower left bronze/gold reflection
    const fillLight = new THREE.DirectionalLight(0xC5A46D, 1.8);
    fillLight.position.set(-3.5, -2.0, 3.5);
    this.scene.add(fillLight);

    // Rim Light: Top back subtle edge highlight
    const rimLight = new THREE.DirectionalLight(0xE4CA92, 1.8);
    rimLight.position.set(0, 3.5, -4.0);
    this.scene.add(rimLight);

    // Interactive Point Light (moves slightly with pointer to trace specular facets)
    this.pointLight = new THREE.PointLight(0xF7E8C8, 1.4, 8.0);
    this.pointLight.position.set(0, 0, 2.5);
    this.scene.add(this.pointLight);
  }

  _bindEvents() {
    const dom = this.renderer.domElement;

    dom.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    window.addEventListener('pointermove', this._onPointerMove, { passive: true });
    window.addEventListener('pointerup', this._onPointerUp, { passive: true });
    dom.addEventListener('pointerleave', this._onPointerLeave, { passive: true });
    dom.addEventListener('webglcontextlost', this._onContextLost, false);
    dom.addEventListener('webglcontextrestored', this._onContextRestored, false);
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _setupIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') {
      this.isVisible = true;
      return;
    }

    const heroSection = document.getElementById('hero') || this.container;
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const wasVisible = this.isVisible;
        this.isVisible = entry.isIntersecting;
        if (!wasVisible && this.isVisible) {
          this._animate();
        }
      });
    }, { threshold: 0.05 });

    this.observer.observe(heroSection);
  }

  _handlePointerDown(e) {
    this.isDragging = true;
    this.hasUserInteracted = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.dragVelocityY = 0;
    this.dragVelocityX = 0;

    if (this.renderer?.domElement) {
      this.renderer.domElement.style.cursor = 'grabbing';
    }

    // Trigger shimmer flash effect on grab
    this.triggerShimmer();

    // Subtle haptic pulse on mobile if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch (_) {}
    }
  }

  _handlePointerMove(e) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;

      this.dragVelocityY = deltaX * 0.006;
      this.dragVelocityX = deltaY * 0.004;

      this.manualRotY += this.dragVelocityY;
      this.manualRotX += this.dragVelocityX;

      // Bound interactive drag rotation to a generous inspection window (±55° yaw, ±22° pitch)
      // so the user can inspect the 3D volume without the logo flipping backwards or vanishing edge-on
      this.manualRotY = Math.max(-0.96, Math.min(0.96, this.manualRotY));
      this.manualRotX = Math.max(-0.38, Math.min(0.38, this.manualRotX));

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    } else if (this.container && this.isVisible) {
      // Parallax subtle tilt when hovering without dragging
      const rect = this.container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        if (Math.abs(normX) <= 1.8 && Math.abs(normY) <= 1.8) {
          this.hoverRotY = normX * 0.22;
          this.hoverRotX = -normY * 0.16;

          if (this.pointLight) {
            this.pointLight.position.x = normX * 1.6;
            this.pointLight.position.y = -normY * 1.2;
          }
        }
      }
    }
  }

  _handlePointerUp() {
    this.isDragging = false;
    if (this.renderer?.domElement) {
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  _handlePointerLeave() {
    if (!this.isDragging) {
      // Smoothly return hover tilt towards center when cursor leaves
      this.hoverRotX = 0;
      this.hoverRotY = 0;
      if (this.pointLight) {
        this.pointLight.position.x = 0;
        this.pointLight.position.y = 0;
      }
    }
  }

  _handleResize() {
    if (!this.renderer || !this.camera || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(rect.width || 340, 240);
    const height = Math.max(rect.height || 220, 160);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  _handleContextLost(e) {
    e.preventDefault();
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    console.warn('[Crown3DViewer] WebGL context lost.');
  }

  _handleContextRestored() {
    console.info('[Crown3DViewer] WebGL context restored. Rebuilding scene.');
    this._setupScene();
    this._buildCrownGeometry();
    this._setupLighting();
    this._animate();
  }

  /**
   * Triggers a temporary specular shimmer flash across the golden facets.
   */
  triggerShimmer() {
    this.flashIntensity = 1.0;
  }

  _animate() {
    if (!this.isVisible || !this.renderer || !this.scene || !this.camera) {
      return;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const delta = this.clock ? Math.min(this.clock.getDelta(), 0.1) : 0.016;
    const time = this.clock ? this.clock.getElapsedTime() : 0;

    if (!prefersReducedMotion && this.crownGroup) {
      // 1. Idle controlled ambient turntable sweep (±17.2° yaw, ±4.0° pitch)
      // Ensures the logo is ALWAYS front-facing, unmistakable and legible,
      // while showcasing full 3D bevels, extruded thickness, and specular highlights.
      const idleRotY = Math.sin(time * 0.75) * 0.30;
      const idleRotX = Math.sin(time * 0.55) * 0.07;

      // 2. Drag inertia friction decay & gentle elastic return to front orientation
      if (!this.isDragging) {
        if (Math.abs(this.dragVelocityY) > 0.0001) {
          this.manualRotY += this.dragVelocityY;
          this.dragVelocityY *= 0.90;
        }
        if (Math.abs(this.dragVelocityX) > 0.0001) {
          this.manualRotX += this.dragVelocityX;
          this.dragVelocityX *= 0.90;
        }

        // Soft elastic spring return towards center so the logo always faces the viewer
        this.manualRotY *= 0.955;
        this.manualRotX *= 0.955;
      }

      // Calculate combined target angles
      const targetY = idleRotY + this.manualRotY + this.hoverRotY;
      const targetX = idleRotX + this.manualRotX + this.hoverRotX;

      // Damped lerp for silky smooth organic motion (60-120fps)
      this.currentRotY += (targetY - this.currentRotY) * 0.075;
      this.currentRotX += (targetX - this.currentRotX) * 0.075;

      this.crownGroup.rotation.y = this.currentRotY;
      this.crownGroup.rotation.x = this.currentRotX;

      // Gentle vertical floating breathing
      this.crownGroup.position.y = Math.sin(time * 1.4) * 0.04;
      const breathingScale = 1 + Math.sin(time * 1.0) * 0.012;
      this.crownGroup.scale.set(breathingScale, breathingScale, breathingScale);

      // Handle specular flash decay
      if (this.flashIntensity > 0) {
        this.flashIntensity -= delta * 2.2;
        if (this.flashIntensity < 0) this.flashIntensity = 0;
        if (this.keyLight) {
          this.keyLight.intensity = 2.6 + this.flashIntensity * 2.0;
        }
        if (this.pointLight) {
          this.pointLight.intensity = 1.4 + this.flashIntensity * 1.6;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Cleanly disposes all Three.js geometries, materials, listeners and DOM nodes.
   */
  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.renderer?.domElement) {
      const dom = this.renderer.domElement;
      dom.removeEventListener('pointerdown', this._onPointerDown);
      dom.removeEventListener('pointerleave', this._onPointerLeave);
      dom.removeEventListener('webglcontextlost', this._onContextLost);
      dom.removeEventListener('webglcontextrestored', this._onContextRestored);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this._onPointerMove);
      window.removeEventListener('pointerup', this._onPointerUp);
      window.removeEventListener('resize', this._onResize);
    }

    this.disposables.forEach((item) => {
      try {
        item.dispose?.();
      } catch (_) {}
    });
    this.disposables = [];

    if (this.renderer) {
      try {
        this.renderer.dispose();
      } catch (_) {}
      if (this.container && this.renderer.domElement) {
        try {
          this.container.removeChild(this.renderer.domElement);
        } catch (_) {}
      }
      this.renderer = null;
    }

    if (this.lockup) {
      this.lockup.classList.remove('has-3d-crown');
    }
  }
}
