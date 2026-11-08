import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const readProjectFile = (relPath) => fs.readFileSync(path.join(ROOT, relPath), 'utf8');

const EXPECTED_PEARLS = [
  { cx: '800', cy: '398', r: '23' },
  { cx: '476', cy: '531', r: '20.5' },
  { cx: '1124', cy: '531', r: '20.5' },
  { cx: '654', cy: '671', r: '11.5' },
  { cx: '946', cy: '671', r: '11.5' }
];

function extractCircles(svgContent) {
  const tags = svgContent.match(/<circle\b[^>]*>/g) || [];
  return tags.map((tag) => ({
    raw: tag,
    cx: tag.match(/\bcx="([^"]+)"/)?.[1],
    cy: tag.match(/\bcy="([^"]+)"/)?.[1],
    r: tag.match(/\br="([^"]+)"/)?.[1],
    pathLength: tag.match(/\bpathLength="([^"]+)"/)?.[1]
  }));
}

test('REQ-01 / Task 1.1: monarcc_vector.svg uses precision mathematical 5-pearl crown + base bar + Bézier wordmark', () => {
  const svg = readProjectFile('monarcc_vector.svg');

  assert.match(svg, /viewBox="200 365 1200 780"/, 'Full lockup must use clean mathematical viewBox');
  assert.ok(Buffer.byteLength(svg, 'utf8') < 8000, 'Mathematical SVG must replace bloated 55KB auto-trace');
  assert.doesNotMatch(svg, /logo-path-subtitle/, 'Must not contain melted auto-traced subtitle blobs');
  assert.doesNotMatch(svg, /#(?:fff(?:fff)?|000(?:000)?)\b/i, 'Must obey Cromatismo Roto (no pure #fff/#000)');

  const circles = extractCircles(svg);
  assert.equal(circles.length, 5, 'Must render 5 mathematical <circle> pearls');
  for (const expected of EXPECTED_PEARLS) {
    const match = circles.find(
      (c) => c.cx === expected.cx && c.cy === expected.cy && c.r === expected.r
    );
    assert.ok(match, `Missing pearl at (${expected.cx}, ${expected.cy}, r=${expected.r})`);
    assert.equal(match.pathLength, '1', 'Each pearl circle must define pathLength="1"');
  }

  assert.match(
    svg,
    /<rect\b[^>]*\bx="561"[^>]*\by="916"[^>]*\bwidth="478"[^>]*\bheight="30"[^>]*\brx="2"[^>]*\bpathLength="1"/,
    'Must include symmetric horizontal base bar with rx="2" and pathLength="1"'
  );

  assert.match(svg, /\b800 468\b/, 'Must include central spire apex at (800, 468)');
  assert.match(svg, /\b493 586\b/, 'Must include left outer spire tip at (493, 586)');
  assert.match(svg, /\b1107 586\b/, 'Must include mirrored right outer spire tip at (1107, 586)');
  assert.match(svg, /\bC\s*485\.17\s+1025/, 'Wordmark O/R/C bowls must use true cubic Bézier curves');

  // Legacy root monarcc.svg must also be synced to clean mathematical vector lockup (zero #000/#fff)
  const legacySvg = readProjectFile('monarcc.svg');
  assert.equal(legacySvg.trim(), svg.trim(), 'Root monarcc.svg must match clean mathematical monarcc_vector.svg');
});

test('REQ-01 / Task 1.1: media/crown_vector.svg includes 5 pearls, hollow-ribbed crown, and restored base bar', () => {
  const svg = readProjectFile('media/crown_vector.svg');

  assert.match(svg, /viewBox="440 365 720 595"/, 'Standalone crown viewBox must frame pearls down through base bar');
  assert.ok(Buffer.byteLength(svg, 'utf8') < 4500, 'Standalone crown SVG must be compact mathematical geometry');
  assert.doesNotMatch(svg, /#(?:fff(?:fff)?|000(?:000)?)\b/i);

  const circles = extractCircles(svg);
  assert.equal(circles.length, 5, 'media/crown_vector.svg must use 5 <circle> pearls');
  for (const expected of EXPECTED_PEARLS) {
    const match = circles.find((c) => c.cx === expected.cx && c.cy === expected.cy && c.r === expected.r);
    assert.ok(match, `Crown asset missing pearl (${expected.cx}, ${expected.cy})`);
    assert.equal(match.pathLength, '1');
  }

  assert.match(
    svg,
    /<rect\b[^>]*\bx="561"[^>]*\by="916"[^>]*\bwidth="478"[^>]*\bheight="30"[^>]*\brx="2"[^>]*\bpathLength="1"/,
    'media/crown_vector.svg must restore the missing horizontal base bar'
  );
});

test('REQ-01 / Task 1.1: media/wordmark_vector.svg renders 7 geometric MONARCC letters with normalized pathLength', () => {
  const svg = readProjectFile('media/wordmark_vector.svg');

  assert.match(svg, /viewBox="200 1015 1200 125"/);
  assert.ok(Buffer.byteLength(svg, 'utf8') < 4500, 'Wordmark SVG must eliminate 32KB 1px auto-trace staircases');
  assert.doesNotMatch(svg, /#(?:fff(?:fff)?|000(?:000)?)\b/i);

  const paths = svg.match(/<path\b[^>]*>/g) || [];
  assert.equal(paths.length, 7, 'Wordmark must contain 7 discrete geometric letterform <path> elements (M O N A R C C)');
  for (const p of paths) {
    assert.match(p, /\bpathLength="1"/, 'Every wordmark letter <path> must carry pathLength="1"');
  }
  assert.match(svg, /\bC\s*1316\.83\s+1025/, 'Trailing C must use precision cubic Bézier geometry');
});

test('REQ-01 / Task 1.1 (Triangulate): crown geometry is mathematically symmetric across x=800 with zero 1px raster staircases', () => {
  const crownSvg = readProjectFile('media/crown_vector.svg');
  const bodyD = crownSvg.match(/<path[^>]*\bd="([^"]+)"/)?.[1] || '';

  const coords = [...bodyD.matchAll(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2])
  }));
  assert.ok(coords.length >= 20, 'Crown body must include outer silhouette and 5 hollow rib cutouts');

  for (const pt of coords) {
    const mirrorExists = coords.some((other) => Math.abs(other.x - (1600 - pt.x)) < 0.01 && Math.abs(other.y - pt.y) < 0.01);
    assert.ok(mirrorExists, `Crown vertex (${pt.x}, ${pt.y}) must have exact mirror (${1600 - pt.x}, ${pt.y}) across x=800`);
  }

  for (const rel of ['monarcc_vector.svg', 'media/crown_vector.svg', 'media/wordmark_vector.svg']) {
    const dAttrs = [...readProjectFile(rel).matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
    for (const d of dAttrs) {
      const pairs = [...d.matchAll(/L\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      let unitStepCount = 0;
      for (let i = 1; i < pairs.length; i++) {
        const dx = Math.abs(pairs[i][0] - pairs[i - 1][0]);
        const dy = Math.abs(pairs[i][1] - pairs[i - 1][1]);
        if (dx + dy <= 2) unitStepCount++;
      }
      assert.equal(unitStepCount, 0, `${rel} must contain 0 auto-trace 1px staircase steps`);
    }
  }
});

test('REQ-01 & REQ-02 / Task 1.2: index.html removes #top-bar, upgrades all inline SVGs, marks [data-ascii-crowns], and preserves promo/VIP access in sidebar & footer', () => {
  const html = readProjectFile('index.html');

  // Top bar completely removed
  assert.doesNotMatch(html, /id="top-bar"/, '#top-bar element must be removed from index.html');
  assert.doesNotMatch(html, /id="top-discount-trigger"/, '#top-discount-trigger must be removed');
  assert.doesNotMatch(html, /id="vip-top-trigger"/, '#vip-top-trigger must be removed');
  assert.doesNotMatch(html, /\[ATELIER \/\/ 2026\] ACCESO PRIVADO DROPS/, 'Legacy top-bar ticker copy must be removed');

  // Zero bloated auto-trace remnants or melted subtitle blobs (down from ~196KB to ~68KB)
  assert.ok(Buffer.byteLength(html, 'utf8') < 75000, 'index.html must shed >100KB of legacy auto-traced inline SVG staircases');
  assert.doesNotMatch(html, /pre-subtitle|logo-path-subtitle|st-path-subtitle/, 'No melted auto-traced subtitle blobs in index.html');
  assert.doesNotMatch(html, /pathLength="1000"/, 'All animated SVG elements must use normalized pathLength="1" instead of 1000');

  // Verify zero 1px raster staircase sequences across every inline SVG path in index.html
  const inlineDAttrs = [...html.matchAll(/<path[^>]*\bd="([^"]+)"/g)].map((m) => m[1]);
  for (const d of inlineDAttrs) {
    const pairs = [...d.matchAll(/L\s*(\d+(?:\.\d+)?)[,\s]+(\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    let unitStepCount = 0;
    for (let i = 1; i < pairs.length; i++) {
      const dx = Math.abs(pairs[i][0] - pairs[i - 1][0]);
      const dy = Math.abs(pairs[i][1] - pairs[i - 1][1]);
      if (dx + dy <= 2) unitStepCount++;
    }
    assert.equal(unitStepCount, 0, 'Inline SVG path in index.html must contain zero 1px staircase steps');
  }

  // Favicon uses 5-pearl crown + base bar
  const faviconHref = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/)?.[1] || '';
  assert.equal((faviconHref.match(/<circle\b/g) || []).length, 5, 'Favicon must include all 5 MONARCC pearls');
  assert.match(faviconHref, /<rect\b[^>]*x='561'[^>]*y='916'/, 'Favicon must include horizontal base bar');

  // Header logo contains overlapping .brand-crown-svg and .brand-wordmark-svg with data-brand-mode="crown"
  const headerLogoMatch = html.match(/<button[^>]*id="header-logo"[^>]*>([\s\S]*?)<\/button>/);
  assert.ok(headerLogoMatch, '#header-logo button must exist');
  assert.match(headerLogoMatch[0], /data-brand-mode="crown"/, '#header-logo should initialize with data-brand-mode="crown"');
  assert.match(headerLogoMatch[1], /class="[^"]*\bbrand-crown-svg\b[^"]*"/, '#header-logo must contain .brand-crown-svg');
  assert.match(headerLogoMatch[1], /class="[^"]*\bbrand-wordmark-svg\b[^"]*"/, '#header-logo must contain .brand-wordmark-svg');
  const strokeLayer = headerLogoMatch[1].match(/<g[^>]*class="crown-stroke-layer"[^>]*>([\s\S]*?)<\/g>/)?.[1] || '';
  const fillLayer = headerLogoMatch[1].match(/<g[^>]*class="crown-fill-layer"[^>]*>([\s\S]*?)<\/g>/)?.[1] || '';
  assert.equal(extractCircles(strokeLayer).length, 5, '#header-logo crown stroke layer must have 5 <circle> pearls');
  assert.equal(extractCircles(fillLayer).length, 5, '#header-logo crown fill layer must have 5 <circle> pearls');
  assert.match(strokeLayer, /<rect\b[^>]*x="561"[^>]*y="916"[^>]*width="478"[^>]*height="30"[^>]*pathLength="1"/, '#header-logo crown must include base bar with pathLength="1"');

  // [data-ascii-crowns] mounted ONLY on .section-benefits, #about, and .footer (never #catalog or #hero)
  const asciiMatches = [...html.matchAll(/<(section|footer)\b[^>]*\bdata-ascii-crowns\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(asciiMatches.length, 3, 'Exactly 3 dark editorial bands must opt into [data-ascii-crowns]');
  assert.ok(asciiMatches.some((tag) => tag.includes('section-benefits')), '.section-benefits must carry data-ascii-crowns');
  assert.ok(asciiMatches.some((tag) => tag.includes('id="about"')), '#about must carry data-ascii-crowns');
  assert.ok(asciiMatches.some((tag) => tag.includes('class="footer"')), '.footer must carry data-ascii-crowns');
  assert.doesNotMatch(html, /id="catalog"[^>]*data-ascii-crowns/, '#catalog must NEVER carry data-ascii-crowns');
  assert.doesNotMatch(html, /id="hero"[^>]*data-ascii-crowns/, '#hero must NEVER carry data-ascii-crowns');

  // Sidebar & Footer retain promo + VIP unlock access
  const sidebarSection = html.match(/<aside[^>]*id="sidebar-drawer"[\s\S]*?<\/aside>/)?.[0] || '';
  assert.match(sidebarSection, /MONARCC15/, 'Sidebar must expose MONARCC15 editorial promo access');
  assert.match(sidebarSection, /openDiscountModal/, 'Sidebar promo trigger must open discount modal');
  assert.match(sidebarSection, /openVip\(/, 'Sidebar VIP trigger must invoke MONARCC_APP.openVip(...)');
  assert.match(html, /MONARCC_APP\.openVip\(['"]footer['"]\)/, 'Footer VIP trigger must invoke MONARCC_APP.openVip("footer")');
});

test('REQ-01 / Task 1.2: DomRenderer._renderVipCard renders canonical 5-pearl MONARCC crown + base bar in locked state', async () => {
  const { DomRenderer } = await import('../src/infrastructure/dom/DomRenderer.js');
  const renderer = new DomRenderer();
  const lockedHtml = renderer._renderVipCard(false, null);

  assert.doesNotMatch(lockedHtml, /<polyline\b/, 'Locked VIP card must not use legacy 3-peak polyline');
  assert.match(lockedHtml, /viewBox="440 365 720 595"/, 'Locked VIP crown must use canonical 5-pearl crown viewBox');
  const circles = extractCircles(lockedHtml);
  assert.equal(circles.length, 5, 'Locked VIP crown must display all 5 MONARCC pearls');
  assert.match(lockedHtml, /<rect\b[^>]*x="561"[^>]*y="916"[^>]*width="478"[^>]*height="30"/, 'Locked VIP crown must include horizontal base bar');
});

test('REQ-01 / Task 1.2 (Triangulate): DomRenderer._renderVipCard renders unlocked product card without lock overlay when vipUnlocked=true', async () => {
  const { DomRenderer } = await import('../src/infrastructure/dom/DomRenderer.js');
  const renderer = new DomRenderer();
  const mockVipVm = {
    id: 'vip',
    name: 'Chaqueta Monarca Golden Crown Edition',
    isVip: true,
    isCritical: true,
    stock: 3,
    stockFormatted: '3 UDS',
    hasDiscount: false,
    discountPct: '0%',
    priceFormatted: '$210.000 COP',
    realPriceFormatted: '$250.000 COP',
    allSizes: ['M', 'L'],
    activeSize: 'M',
    activeColor: { name: 'Obsidiana', hex: '#111113', img: 'media/vip_1.jpg' },
    allColors: [{ name: 'Obsidiana', hex: '#111113', img: 'media/vip_1.jpg', stock: 3, isActive: true }]
  };
  const unlockedHtml = renderer._renderVipCard(true, mockVipVm);
  assert.doesNotMatch(unlockedHtml, /lock-overlay/, 'Unlocked VIP card must not show lock-overlay');
  assert.match(unlockedHtml, /Chaqueta Monarca Golden Crown Edition/, 'Unlocked VIP card must render product card');
});

// --- Lightweight DOM / Browser Stub Helpers for Behavioral Driver Tests ---
function createClassList(initial = []) {
  const set = new Set(initial);
  return {
    add: (...cls) => cls.forEach((c) => set.add(c)),
    remove: (...cls) => cls.forEach((c) => set.delete(c)),
    toggle: (c, force) => {
      const shouldAdd = force === undefined ? !set.has(c) : Boolean(force);
      if (shouldAdd) set.add(c);
      else set.delete(c);
      return shouldAdd;
    },
    contains: (c) => set.has(c),
    toArray: () => [...set]
  };
}

function createMockElement(tag = 'div', attrs = {}) {
  const listeners = new Map();
  const attrMap = new Map(Object.entries(attrs));
  const dataset = {};
  const style = {};
  const children = [];
  const isSvgTag = ['svg', 'g', 'path', 'rect', 'circle', 'defs', 'lineargradient', 'stop', 'polyline', 'polygon', 'line'].includes(
    tag.toLowerCase()
  );
  const el = {
    tagName: tag.toUpperCase(),
    id: attrs.id || '',
    classList: createClassList((attrs.class || '').split(/\s+/).filter(Boolean)),
    dataset,
    style,
    children,
    textContent: '',
    innerHTML: '',
    value: attrs.value || '',
    offsetWidth: isSvgTag ? undefined : 100,
    offsetTop: isSvgTag ? undefined : 400,
    clientWidth: isSvgTag ? undefined : 320,
    scrollLeft: 0,
    setAttribute(k, v) {
      attrMap.set(k, String(v));
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
        dataset[camel] = String(v);
      }
    },
    getAttribute(k) {
      return attrMap.has(k) ? attrMap.get(k) : null;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const arr = listeners.get(type) || [];
      const idx = arr.indexOf(fn);
      if (idx !== -1) arr.splice(idx, 1);
    },
    dispatchEvent(evt) {
      const arr = listeners.get(evt.type) || [];
      arr.forEach((fn) => fn(evt));
    },
    appendChild(child) {
      children.push(child);
      child.parentNode = el;
      return child;
    },
    prepend(child) {
      children.unshift(child);
      child.parentNode = el;
      return child;
    },
    remove() {
      if (el.parentNode) {
        const idx = el.parentNode.children.indexOf(el);
        if (idx !== -1) el.parentNode.children.splice(idx, 1);
      }
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    scrollIntoView: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 360 })
  };
  return el;
}

test('REQ-01 / Task 1.3: ScreenTransition resets normalized pathLength="1" strokes (never 1000) and toggles aria-hidden', async () => {
  const prevDoc = globalThis.document;
  const prevRaf = globalThis.requestAnimationFrame;

  const overlay = createMockElement('div', { id: 'screen-transition', 'aria-hidden': 'true' });
  let overlayReflowCount = 0;
  Object.defineProperty(overlay, 'offsetWidth', {
    get: () => {
      overlayReflowCount += 1;
      return 1200;
    }
  });
  const labelEl = createMockElement('span', { id: 'st-label' });
  const fillEl = createMockElement('span', { id: 'st-progress-fill' });

  const historyByEl = new Map();
  const makeTrackedStroke = (tag) => {
    const node = createMockElement(tag, { class: 'st-path' });
    const history = [];
    historyByEl.set(node, history);
    let dashOffset = '';
    Object.defineProperty(node.style, 'strokeDashoffset', {
      get: () => dashOffset,
      set: (val) => {
        dashOffset = String(val);
        history.push({ val: String(val), isActive: overlay.classList.contains('is-active') });
      }
    });
    return node;
  };

  const strokeNodes = [makeTrackedStroke('rect'), makeTrackedStroke('path'), makeTrackedStroke('circle')];
  for (const n of strokeNodes) {
    assert.equal(n.offsetWidth, undefined, 'SVGElement mocks must have offsetWidth === undefined');
  }
  overlay.querySelectorAll = (sel) => (sel.includes('.st-path') ? strokeNodes : []);

  globalThis.document = {
    getElementById: (id) => ({ 'screen-transition': overlay, 'st-label': labelEl, 'st-progress-fill': fillEl }[id] || null)
  };
  globalThis.requestAnimationFrame = (cb) => {
    cb();
    return 1;
  };

  try {
    const { ScreenTransition } = await import('../src/infrastructure/dom/ScreenTransition.js');
    const st = new ScreenTransition();
    let callbackCount = 0;

    // 1st trigger
    st.trigger('Hoodies', () => {
      callbackCount += 1;
    }, 15);

    assert.equal(labelEl.textContent, 'MONARCC // HOODIES');
    assert.equal(overlay.classList.contains('is-active'), true);
    assert.equal(overlay.getAttribute('aria-hidden'), 'false', 'Active transition should expose status overlay');
    assert.ok(overlayReflowCount >= 1, 'Must flush reflow via HTMLElement overlay.offsetWidth');

    for (const node of strokeNodes) {
      const hist = historyByEl.get(node);
      assert.deepEqual(
        hist,
        [
          { val: '1', isActive: false },
          { val: '', isActive: false }
        ],
        '1st trigger must reset strokeDashoffset="1" while inactive, flush overlay reflow, and clear inline style before .is-active'
      );
      assert.equal(node.style.strokeDashoffset, '', 'Must NOT leave sticky inline strokeDashoffset="0"');
    }

    await new Promise((r) => setTimeout(r, 640));
    assert.equal(callbackCount, 1, '1st transition callback must run');
    assert.equal(overlay.getAttribute('aria-hidden'), 'true', 'Completed transition must restore aria-hidden="true"');

    // 2nd consecutive trigger (replay check!)
    const reflowsBeforeSecond = overlayReflowCount;
    st.trigger('Chaquetas', () => {
      callbackCount += 1;
    }, 15);

    assert.equal(labelEl.textContent, 'MONARCC // CHAQUETAS');
    assert.equal(overlay.classList.contains('is-active'), true);
    assert.ok(overlayReflowCount > reflowsBeforeSecond, '2nd trigger must flush overlay.offsetWidth again');

    for (const node of strokeNodes) {
      const hist = historyByEl.get(node);
      assert.deepEqual(
        hist.slice(2),
        [
          { val: '1', isActive: false },
          { val: '', isActive: false }
        ],
        '2nd trigger must cleanly replay "1" -> "" reset before adding .is-active'
      );
      assert.equal(node.style.strokeDashoffset, '');
    }

    await new Promise((r) => setTimeout(r, 640));
    assert.equal(callbackCount, 2, '2nd transition callback must run');
    assert.equal(overlay.getAttribute('aria-hidden'), 'true', '2nd completed transition must restore aria-hidden="true"');
  } finally {
    globalThis.document = prevDoc;
    globalThis.requestAnimationFrame = prevRaf;
  }
});

test('REQ-02 / Task 1.3: style.css removes .top-bar rules & negative sticky translateY and normalizes preloader/transition stroke-dasharray to 1', () => {
  const css = readProjectFile('style.css');

  assert.doesNotMatch(css, /--top-bar-h\b/, '--top-bar-h variable must be removed');
  assert.doesNotMatch(css, /\.top-bar\b/, '.top-bar rules must be removed from style.css');
  assert.doesNotMatch(css, /body\.is-scrolled\s+\.site-top\s*\{[^}]*translateY/, 'Negative sticky translateY on .site-top must be removed');
  assert.match(css, /scroll-padding-top:\s*76px/, 'scroll-padding-top must be calibrated for single 68px sticky header');
  assert.doesNotMatch(css, /border-radius:\s*0\s+0\s+48px\s+48px/, 'Preloader exit must not use 48px pill/slop radius');
  assert.doesNotMatch(css, /stroke-dasharray:\s*1000\b/, 'All stroke-dasharray rules must be normalized to 1');
  assert.doesNotMatch(css, /stroke-dashoffset:\s*1000\b/, 'All stroke-dashoffset rules must be normalized to 1');
  assert.match(css, /\.sidebar-atelier-access\b/, 'Sidebar editorial promo/VIP block must be styled');
});

test('REQ-02 / Task 1.3: container.js removes dead top-bar hooks and wires MONARCC_APP.openVip() & closeSidebar() cleanly', async () => {
  const containerSrc = readProjectFile('src/container.js');
  assert.doesNotMatch(containerSrc, /top-discount-trigger/, 'Dead #top-discount-trigger listener must be removed');
  assert.doesNotMatch(containerSrc, /vip-top-trigger/, 'Dead #vip-top-trigger listener must be removed');

  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  const prevRAF = globalThis.requestAnimationFrame;

  const sidebarDrawer = createMockElement('aside', { id: 'sidebar-drawer', class: 'drawer is-open' });
  const sidebarBackdrop = createMockElement('div', { id: 'sidebar-backdrop', class: 'backdrop is-open' });
  const vipModal = createMockElement('div', { id: 'vip-modal', class: 'modal' });
  const headerLogo = createMockElement('button', { id: 'header-logo' });
  const elements = new Map([
    ['sidebar-drawer', sidebarDrawer],
    ['sidebar-backdrop', sidebarBackdrop],
    ['vip-modal', vipModal],
    ['header-logo', headerLogo]
  ]);

  const storage = new Map();
  globalThis.document = {
    readyState: 'loading',
    body: createMockElement('body'),
    addEventListener: () => {},
    getElementById: (id) => elements.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement(tag)
  };
  globalThis.window = {
    scrollY: 0,
    pageYOffset: 0,
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    MONARCC: {
      products: [
        {
          id: 'vip',
          name: 'Chaqueta Monarca Golden Crown Edition',
          category: 'Chaquetas',
          price: 210000,
          realPrice: 250000,
          sizes: ['M', 'L'],
          vipOnly: true,
          colors: [{ name: 'Obsidiana', hex: '#111113', img: 'media/vip.jpg', stock: 3 }]
        }
      ],
      reviews: [],
      shipping: { departments: { Cundinamarca: ['Soacha'] } }
    }
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.requestAnimationFrame = (cb) => {
    cb();
    return 1;
  };

  try {
    const { bootstrapApplication } = await import('../src/container.js');
    const app = bootstrapApplication();

    assert.equal(typeof globalThis.window.MONARCC_APP.openVip, 'function', 'MONARCC_APP.openVip must be exposed');
    assert.equal(typeof globalThis.window.MONARCC_APP.closeSidebar, 'function', 'MONARCC_APP.closeSidebar must be exposed');

    globalThis.window.MONARCC_APP.closeSidebar();
    assert.equal(sidebarDrawer.classList.contains('is-open'), false, 'closeSidebar() must close #sidebar-drawer');

    globalThis.window.MONARCC_APP.openVip('footer');
    assert.equal(app.catalogController.vipUnlocked, true, 'openVip("footer") must unlock VIP catalog items');
    assert.equal(vipModal.classList.contains('is-open'), true, 'openVip("footer") must open #vip-modal');

    // Triangulate with 'sidebar' source and verify CROWNVIP10 coupon activation
    vipModal.classList.remove('is-open');
    const res = globalThis.window.MONARCC_APP.openVip('sidebar');
    assert.equal(vipModal.classList.contains('is-open'), true, 'openVip("sidebar") must also open #vip-modal');
    assert.equal(res?.appliedCoupon?.code, 'CROWNVIP10', 'openVip must execute UnlockVipUseCase and apply CROWNVIP10');
  } finally {
    await new Promise((r) => setTimeout(r, 15));
    globalThis.window = prevWindow;
    globalThis.document = prevDocument;
    globalThis.requestAnimationFrame = prevRAF;
    delete globalThis.localStorage;
  }
});

test('REQ-01 / Task 1.3 (Triangulate): ScreenTransition.trigger invokes callback synchronously when #screen-transition is absent', async () => {
  const prevDoc = globalThis.document;
  globalThis.document = { getElementById: () => null };
  try {
    const { ScreenTransition } = await import('../src/infrastructure/dom/ScreenTransition.js');
    const st = new ScreenTransition();
    let called = false;
    st.trigger('Archivo', () => {
      called = true;
    });
    assert.equal(called, true, 'Missing #screen-transition must fall back to immediate callback execution');
  } finally {
    globalThis.document = prevDoc;
  }
});

test('REQ-03 / Task 2.1: ScrollMachine enforces hysteresis (down > 14 => wordmark, up <= 2 => crown + self-draw)', async () => {
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;

  let scrollHandler = null;
  const brandEl = createMockElement('button', { id: 'header-logo' });
  const strokeNode = createMockElement('path', { class: 'crown-stroke' });
  brandEl.querySelectorAll = (sel) => (sel.includes('.crown-stroke') ? [strokeNode] : []);
  const body = createMockElement('body');

  globalThis.document = {
    body,
    getElementById: (id) => (id === 'header-logo' ? brandEl : null)
  };
  globalThis.window = {
    scrollY: 0,
    pageYOffset: 0,
    addEventListener: (type, fn) => {
      if (type === 'scroll') scrollHandler = fn;
    },
    removeEventListener: (type, fn) => {
      if (type === 'scroll' && scrollHandler === fn) scrollHandler = null;
    }
  };

  try {
    const { ScrollMachine } = await import('../src/infrastructure/dom/ScrollMachine.js');
    let reachTopCount = 0;
    const sm = new ScrollMachine({
      downThreshold: 14,
      topThreshold: 2,
      brandEl,
      drawDurationMs: 40,
      onReachTop: () => {
        reachTopCount += 1;
      }
    });
    sm.init();

    // 1. At 0px on init -> crown mode, not scrolled
    assert.equal(sm.isAtTop(), true);
    assert.equal(brandEl.getAttribute('data-brand-mode'), 'crown');
    assert.equal(body.classList.contains('is-scrolled'), false);

    // 2. Micro-scroll into hysteresis deadzone (10px <= 14px) -> stays crown!
    globalThis.window.scrollY = 10;
    scrollHandler();
    assert.equal(sm.isAtTop(), true, '10px is inside <=14px deadzone and must remain at top');
    assert.equal(brandEl.getAttribute('data-brand-mode'), 'crown');
    assert.equal(body.classList.contains('is-scrolled'), false);

    // 3. Scroll past 14px (18px) -> morphs to wordmark!
    globalThis.window.scrollY = 18;
    scrollHandler();
    assert.equal(sm.isAtTop(), false);
    assert.equal(brandEl.getAttribute('data-brand-mode'), 'wordmark');
    assert.equal(body.classList.contains('is-scrolled'), true);

    // 4. Scroll partially up into deadzone (6px > 2px) -> stays wordmark (no flicker!)
    globalThis.window.scrollY = 6;
    scrollHandler();
    assert.equal(sm.isAtTop(), false, '6px is above 2px topThreshold and must remain wordmark');
    assert.equal(brandEl.getAttribute('data-brand-mode'), 'wordmark');
    assert.equal(reachTopCount, 0);

    // 5. Scroll to 100% top (0px <= 2px) -> morphs back to crown + triggers self-draw!
    globalThis.window.scrollY = 0;
    scrollHandler();
    assert.equal(sm.isAtTop(), true);
    assert.equal(brandEl.getAttribute('data-brand-mode'), 'crown');
    assert.equal(body.classList.contains('is-scrolled'), false);
    assert.equal(reachTopCount, 1, 'onReachTop must fire when returning to <= 2px');
    assert.equal(brandEl.classList.contains('is-drawing'), true, 'Returning to top must trigger .is-drawing crown animation');
    assert.equal(brandEl.getAttribute('data-drawing'), 'true');

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(brandEl.classList.contains('is-drawing'), false, '.is-drawing class cleans up after drawDurationMs');

    sm.destroy();
    assert.equal(scrollHandler, null, 'destroy() must detach scroll listener');
  } finally {
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
  }
});

test('REQ-03 / Task 2.1: #header-logo smart click scrolls to top when scrolled, unlocks VIP on triple-click at top, and draws crown after preloader', async () => {
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;
  const prevRAF = globalThis.requestAnimationFrame;

  const headerLogo = createMockElement('button', { id: 'header-logo' });
  const vipModal = createMockElement('div', { id: 'vip-modal', class: 'modal' });
  const preloader = createMockElement('div', { id: 'preloader' });
  const preCounter = createMockElement('div', { id: 'preloader-counter' });
  const preFill = createMockElement('span', { id: 'preloader-fill' });
  const elements = new Map([
    ['header-logo', headerLogo],
    ['vip-modal', vipModal],
    ['preloader', preloader],
    ['preloader-counter', preCounter],
    ['preloader-fill', preFill]
  ]);

  let scrollHandler = null;
  const scrollToCalls = [];
  const storage = new Map();

  globalThis.document = {
    readyState: 'loading',
    body: createMockElement('body'),
    addEventListener: () => {},
    getElementById: (id) => elements.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement(tag)
  };
  globalThis.window = {
    scrollY: 0,
    pageYOffset: 0,
    addEventListener: (type, fn) => {
      if (type === 'scroll') scrollHandler = fn;
    },
    removeEventListener: () => {},
    scrollTo: (opts) => scrollToCalls.push(opts),
    matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    MONARCC: { products: [], reviews: [], shipping: { departments: { Cundinamarca: ['Soacha'] } } }
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.requestAnimationFrame = (cb) => {
    cb();
    return 1;
  };

  try {
    const { bootstrapApplication } = await import('../src/container.js');
    const app = bootstrapApplication();

    // Scroll down to wordmark state
    globalThis.window.scrollY = 120;
    scrollHandler();
    assert.equal(headerLogo.getAttribute('data-brand-mode'), 'wordmark');

    // Clicking 3x while scrolled must scroll smoothly to top and NOT unlock VIP
    headerLogo.dispatchEvent({ type: 'click' });
    headerLogo.dispatchEvent({ type: 'click' });
    headerLogo.dispatchEvent({ type: 'click' });
    assert.equal(scrollToCalls.length, 3);
    assert.deepEqual(scrollToCalls[0], { top: 0, behavior: 'smooth' });
    assert.equal(app.catalogController.vipUnlocked, false, 'Clicking wordmark while scrolled must not trigger VIP unlock');

    // Return to top (0px) -> crown mode; now triple-clicking unlocks VIP!
    globalThis.window.scrollY = 0;
    scrollHandler();
    assert.equal(headerLogo.getAttribute('data-brand-mode'), 'crown');
    headerLogo.dispatchEvent({ type: 'click' });
    headerLogo.dispatchEvent({ type: 'click' });
    headerLogo.dispatchEvent({ type: 'click' });
    assert.equal(app.catalogController.vipUnlocked, true, 'Triple-clicking crown at 100% top must unlock VIP');
    app.destroy();
  } finally {
    await new Promise((r) => setTimeout(r, 15));
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
    globalThis.requestAnimationFrame = prevRAF;
    delete globalThis.localStorage;
  }
});

test('REQ-03 / Task 2.1 (Triangulate): ScrollMachine booting mid-scroll (scrollY=240) starts in wordmark mode without crown draw', async () => {
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;
  const brandEl = createMockElement('button', { id: 'header-logo' });
  const body = createMockElement('body');

  globalThis.document = { body, getElementById: () => brandEl };
  globalThis.window = { scrollY: 240, addEventListener: () => {}, removeEventListener: () => {} };

  try {
    const { ScrollMachine } = await import('../src/infrastructure/dom/ScrollMachine.js');
    const sm = new ScrollMachine({ downThreshold: 14, topThreshold: 2, brandEl });
    sm.init();

    assert.equal(sm.isAtTop(), false);
    assert.equal(brandEl.getAttribute('data-brand-mode'), 'wordmark');
    assert.equal(body.classList.contains('is-scrolled'), true);
    assert.equal(brandEl.classList.contains('is-drawing'), false);
    sm.destroy();
  } finally {
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
  }
});

test('REQ-03 / Task 2.2: style.css implements inline-grid brand overlap, [data-brand-mode] morph, and staggered self-drawing crown keyframes', () => {
  const css = readProjectFile('style.css');

  assert.doesNotMatch(css, /\.header-crown-vec\b|\.header-wordmark-vec\b/, 'Legacy stacked header vector selectors must be replaced');
  assert.match(css, /\.header-logo-group\s*\{[\s\S]*?display:\s*inline-grid/, '#header-logo must use inline-grid overlap');
  assert.match(css, /grid-area:\s*1\s*\/\s*1/, '.brand-crown-svg and .brand-wordmark-svg must share grid-area: 1 / 1');
  assert.match(css, /\[data-brand-mode="crown"\]/, 'style.css must define [data-brand-mode="crown"] state');
  assert.match(css, /\[data-brand-mode="wordmark"\]/, 'style.css must define [data-brand-mode="wordmark"] state');
  assert.match(css, /@keyframes\s+headerCrownDraw\b/, 'style.css must define @keyframes headerCrownDraw');
  assert.match(css, /@keyframes\s+headerCrownFillBloom\b/, 'style.css must define @keyframes headerCrownFillBloom');
  assert.match(css, /\.brand-crown-svg\s+\.crown-stroke-layer\s*\{[^}]*opacity:\s*0/, '.crown-stroke-layer must rest at opacity: 0 so inner pearls stay 1:1 crisp');
  assert.match(css, /@keyframes\s+headerCrownStrokeFade\b/, '.crown-stroke-layer must smoothly fade out after fill bloom during .is-drawing');
  assert.match(css, /\.crown-stroke-bar\b/, 'Self-draw must stagger base bar -> outer spires -> ribs -> pearls');
  assert.match(css, /\.crown-stroke-pearl\b/, 'Self-draw must stagger 5 pearls');
});

test('REQ-04 / Task 3.1: AsciiCrownField pure math renders symmetric 5-pearl hollow-ribbed crown SDF, ASCII ramp, and pointer dispersion', async () => {
  const {
    ASCII_RAMP,
    sampleAsciiRamp,
    evaluateCrownStamp,
    computeCellSignal
  } = await import('../src/infrastructure/dom/AsciiCrownField.js');

  assert.equal(ASCII_RAMP, ' .:-=+*#%@');
  assert.equal(sampleAsciiRamp(0), ' ');
  assert.equal(sampleAsciiRamp(1), '@');
  assert.notEqual(sampleAsciiRamp(0.45), ' ');

  // Convert canonical SVG coordinate (sx, sy) to normalized crown stamp space: cx=800, cy=662.5, halfSpan=360
  const toNorm = (sx, sy) => [(sx - 800) / 360, (sy - 662.5) / 360];

  const centerPearl = evaluateCrownStamp(...toNorm(800, 398));
  const leftOuterPearl = evaluateCrownStamp(...toNorm(476, 531));
  const rightOuterPearl = evaluateCrownStamp(...toNorm(1124, 531));
  const centerSpire = evaluateCrownStamp(...toNorm(800, 500));
  const baseBar = evaluateCrownStamp(...toNorm(800, 931));
  const centerCutout = evaluateCrownStamp(...toNorm(800, 790));
  const farOutside = evaluateCrownStamp(1.5, 1.5);

  assert.ok(centerPearl > 0.75, `Center pearl should have high ASCII density, got ${centerPearl}`);
  assert.ok(leftOuterPearl > 0.75, `Left outer pearl should have high ASCII density, got ${leftOuterPearl}`);
  assert.equal(leftOuterPearl.toFixed(5), rightOuterPearl.toFixed(5), 'Crown SDF must be symmetric across x=800');
  assert.ok(centerSpire > 0.7, `Central spire should be solid, got ${centerSpire}`);
  assert.ok(baseBar > 0.75, `Horizontal base bar should be solid, got ${baseBar}`);
  assert.ok(centerCutout < 0.2, `Interior rib cutout must remain hollow/recessed, got ${centerCutout}`);
  assert.equal(farOutside, 0, 'Far outside crown silhouette must have 0 intensity');

  // Pointer dispersion within 135px radius
  const crowns = [{ x: 200, y: 200, scale: 120, angle: 0 }];
  const [nx, ny] = toNorm(800, 398);
  const pearlX = 200 + nx * 120;
  const pearlY = 200 + ny * 120;

  const calm = computeCellSignal(pearlX, pearlY, crowns, { active: false, x: 0, y: 0 }, 0);
  const dispersed = computeCellSignal(pearlX, pearlY, crowns, { active: true, x: pearlX + 20, y: pearlY }, 0);
  assert.notEqual(
    calm.intensity.toFixed(4),
    dispersed.intensity.toFixed(4),
    'Active pointer within 135px must smoothly disperse crown field sampling'
  );
});

test('REQ-04 / Task 3.1: AsciiCrownField mounts only on [data-ascii-crowns], enforces subtle <=0.085 alpha, pauses offscreen, and honors reduced-motion', async () => {
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;
  const prevIO = globalThis.IntersectionObserver;
  const prevRAF = globalThis.requestAnimationFrame;
  const prevCRAF = globalThis.cancelAnimationFrame;

  const fillStylesUsed = [];
  const createCanvasMock = () => {
    const canvas = createMockElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    const ctx = {
      font: '',
      textBaseline: 'top',
      _fillStyle: '',
      set fillStyle(v) {
        this._fillStyle = v;
        fillStylesUsed.push(v);
      },
      get fillStyle() {
        return this._fillStyle;
      },
      setTransform: () => {},
      clearRect: () => {},
      fillText: () => {}
    };
    canvas.getContext = () => ctx;
    return canvas;
  };

  const benefitsSec = createMockElement('section', { class: 'section section-benefits', 'data-ascii-crowns': '' });
  const catalogSec = createMockElement('section', { id: 'catalog', class: 'section catalog-section' });
  const ioInstances = [];

  globalThis.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
      this.observed = [];
      this.disconnected = false;
      ioInstances.push(this);
    }
    observe(el) {
      this.observed.push(el);
    }
    disconnect() {
      this.disconnected = true;
    }
  };

  let rafCount = 0;
  let cancelledRafs = 0;
  let lastRafCb = null;
  globalThis.requestAnimationFrame = (cb) => {
    lastRafCb = cb;
    return ++rafCount;
  };
  globalThis.cancelAnimationFrame = () => {
    cancelledRafs += 1;
  };

  let reducedMotion = false;
  let resizeCb = null;
  globalThis.document = {
    querySelectorAll: (sel) => (sel === '[data-ascii-crowns]' ? [benefitsSec] : []),
    createElement: (tag) => (tag === 'canvas' ? createCanvasMock() : createMockElement(tag))
  };
  globalThis.window = {
    devicePixelRatio: 1.5,
    addEventListener: (ev, fn) => {
      if (ev === 'resize') resizeCb = fn;
    },
    removeEventListener: () => {},
    matchMedia: () => ({ matches: reducedMotion, addEventListener: () => {}, removeEventListener: () => {} })
  };

  try {
    const { AsciiCrownField } = await import('../src/infrastructure/dom/AsciiCrownField.js');

    // 1. Standard motion: mounts canvas, schedules RAF, pauses when offscreen
    const field = new AsciiCrownField();
    field.init();

    assert.equal(benefitsSec.children.length, 1, '[data-ascii-crowns] section must receive 1 prepended canvas');
    assert.equal(catalogSec.children.length, 0, '#catalog must NEVER receive an ASCII background canvas');
    const mountedCanvas = benefitsSec.children[0];
    assert.equal(mountedCanvas.classList.contains('ascii-crown-bg'), true);
    assert.equal(mountedCanvas.getAttribute('aria-hidden'), 'true');
    assert.ok(rafCount >= 1, 'Animated mode must schedule requestAnimationFrame while visible');

    // Verify all rgba alpha values used on canvas are strictly subtle (<= 0.085)
    assert.ok(fillStylesUsed.length > 0, 'Initial frame must draw subtle ASCII characters');
    for (const style of fillStylesUsed) {
      const alphaMatch = style.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\)/);
      assert.ok(alphaMatch, `Canvas fillStyle must use rgba with explicit subtle alpha, got ${style}`);
      const alpha = Number(alphaMatch[1]);
      assert.ok(alpha > 0 && alpha <= 0.085, `ASCII crown alpha (${alpha}) must remain whisper-subtle (<= 0.085)`);
    }

    // Exercise pointer dispersion + physics tick + resize while visible
    benefitsSec.dispatchEvent({ type: 'pointermove', clientX: 220, clientY: 160 });
    if (lastRafCb) lastRafCb();
    if (resizeCb) resizeCb();
    benefitsSec.dispatchEvent({ type: 'pointerleave' });

    // Offscreen via IntersectionObserver -> cancels RAF!
    const io = ioInstances[0];
    io.cb([{ target: benefitsSec, isIntersecting: false }]);
    assert.ok(cancelledRafs >= 1, 'Offscreen section must cancel requestAnimationFrame');

    // Re-entering viewport -> resumes RAF!
    const prevRafCount = rafCount;
    io.cb([{ target: benefitsSec, isIntersecting: true }]);
    assert.ok(rafCount > prevRafCount, 'Intersecting section must resume requestAnimationFrame');

    field.destroy();
    assert.equal(io.disconnected, true, 'destroy() must disconnect IntersectionObserver');
    assert.equal(benefitsSec.children.length, 0, 'destroy() must remove injected canvas');

    // 2. Triangulate: prefers-reduced-motion: reduce renders 1 static frame with ZERO continuous RAF
    reducedMotion = true;
    const rafBeforeReduced = rafCount;
    const reducedField = new AsciiCrownField();
    reducedField.init();
    assert.equal(benefitsSec.children.length, 1, 'Reduced-motion mode still mounts static subtle ASCII texture');
    assert.equal(rafCount, rafBeforeReduced, 'Reduced-motion mode must NOT schedule continuous requestAnimationFrame');
    reducedField.destroy();
  } finally {
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
    globalThis.IntersectionObserver = prevIO;
    globalThis.requestAnimationFrame = prevRAF;
    globalThis.cancelAnimationFrame = prevCRAF;
  }
});

test('REQ-05 / Task 3.2: DomRenderer.renderCart updates #cart-*-val totals and #free-shipping-* progress across partial, unlocked, and empty states', async () => {
  const prevDoc = globalThis.document;

  const ids = [
    'header-cart-count',
    'cart-drawer-count',
    'dock-cart-count',
    'cart-items-container',
    'cart-empty-state',
    'cart-subtotal-val',
    'cart-discount-row',
    'cart-discount-val',
    'cart-shipping-val',
    'cart-total-val',
    'free-shipping-text',
    'free-shipping-percent',
    'free-shipping-bar',
    'cart-coupon-tags'
  ];
  const map = new Map(ids.map((id) => [id, createMockElement('div', { id })]));
  globalThis.document = {
    getElementById: (id) => map.get(id) || null
  };

  try {
    const { DomRenderer } = await import('../src/infrastructure/dom/DomRenderer.js');
    const renderer = new DomRenderer();

    // Case A: Partial progress ($150.000 subtotal, $150.000 remaining -> 50%)
    renderer.renderCart({
      totalQty: 1,
      isEmpty: false,
      items: [
        {
          key: 'p1-M-0',
          name: 'Chaqueta Motorsport',
          size: 'M',
          colorName: 'Obsidiana',
          img: 'media/p1.jpg',
          qty: 1,
          hasSavings: false,
          realPriceFormatted: '$150.000',
          subtotalFormatted: '$150.000 COP'
        }
      ],
      coupons: [{ code: 'MONARCC15', label: '15% OFF' }],
      subtotalFormatted: '$150.000 COP',
      hasDiscount: true,
      discountFormatted: '-$22.500 COP',
      shippingCostFormatted: '$8.900 COP',
      isFreeShipping: false,
      freeShippingRemainingFormatted: '$150.000 COP',
      grandTotalFormatted: '$136.400 COP'
    });

    assert.equal(map.get('cart-subtotal-val').textContent, '$150.000 COP');
    assert.equal(map.get('cart-discount-row').style.display, 'flex');
    assert.equal(map.get('cart-discount-val').textContent, '-$22.500 COP');
    assert.equal(map.get('cart-shipping-val').textContent, '$8.900 COP');
    assert.equal(map.get('cart-total-val').textContent, '$136.400 COP');
    assert.equal(map.get('free-shipping-percent').textContent, '50%');
    assert.equal(map.get('free-shipping-bar').style.width, '50%');
    assert.match(map.get('free-shipping-text').textContent, /\$150\.000 COP/);

    // Case B (Triangulate): Unlocked free shipping ($320.000 -> 100%)
    renderer.renderCart({
      totalQty: 2,
      isEmpty: false,
      items: [],
      coupons: [],
      subtotalFormatted: '$320.000 COP',
      hasDiscount: false,
      discountFormatted: '-$0 COP',
      shippingCostFormatted: 'GRATIS',
      isFreeShipping: true,
      freeShippingRemainingFormatted: '$0 COP',
      grandTotalFormatted: '$320.000 COP'
    });

    assert.equal(map.get('cart-discount-row').style.display, 'none');
    assert.equal(map.get('cart-shipping-val').textContent, 'GRATIS');
    assert.equal(map.get('free-shipping-percent').textContent, '100%');
    assert.equal(map.get('free-shipping-bar').style.width, '100%');
    assert.match(map.get('free-shipping-text').textContent, /ENVÍO GRATIS/i);

    // Case C (Triangulate): Empty cart -> 0%
    renderer.renderCart({
      totalQty: 0,
      isEmpty: true,
      items: [],
      coupons: [],
      subtotalFormatted: '$0 COP',
      hasDiscount: false,
      discountFormatted: '-$0 COP',
      shippingCostFormatted: '$8.900 COP',
      isFreeShipping: false,
      freeShippingRemainingFormatted: '$300.000 COP',
      grandTotalFormatted: '$8.900 COP'
    });

    assert.equal(map.get('free-shipping-percent').textContent, '0%');
    assert.equal(map.get('free-shipping-bar').style.width, '0%');
  } finally {
    globalThis.document = prevDoc;
  }
});

test('REQ-05 / Task 3.2: style.css and index.html enforce Cromatismo Roto (zero pure #000/#fff) and style .qty-stepper, .btn-outline, and :focus-visible', () => {
  const css = readProjectFile('style.css');
  const html = readProjectFile('index.html');

  assert.doesNotMatch(html, /#(?:fff(?:fff)?|000(?:000)?)\b/i, 'index.html must contain zero pure #fff/#000 hex values');
  assert.doesNotMatch(css, /#(?:fff(?:fff)?|000(?:000)?)\b/i, 'style.css must contain zero pure #fff/#000 hex values');
  assert.doesNotMatch(css, /rgba\(\s*(?:0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*,/, 'style.css must use broken obsidian/chalk rgba tokens instead of pure 0/255');

  assert.match(css, /\.qty-stepper\b/, 'style.css must style .qty-stepper rendered in cart items');
  assert.match(css, /\.cart-item-actions\b/, 'style.css must style .cart-item-actions');
  assert.match(css, /\.btn-outline\b/, 'style.css must define .btn-outline');
  assert.match(css, /:focus-visible\b/, 'style.css must define accessible :focus-visible ring');
  assert.match(
    css,
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)\s*\{[\s\S]*?animation-iteration-count:\s*1\s*!important/,
    'prefers-reduced-motion must cap infinite keyframe animations via animation-iteration-count: 1 !important'
  );

  const countdownDivRules = css.match(/\.countdown\s+div\s*\{/g) || [];
  assert.equal(countdownDivRules.length, 2, '.countdown div should appear once for desktop and once in @media mobile (no duplicate override)');
});

test('Task 3.3: End-to-end CartController -> CartPresenter -> DomRenderer integration & preloader crown draw at top', async () => {
  const prevWin = globalThis.window;
  const prevDoc = globalThis.document;
  const prevRAF = globalThis.requestAnimationFrame;

  const rawProductsCode = readProjectFile('products.js');
  const sandbox = { window: {} };
  new Function('window', rawProductsCode)(sandbox.window);

  const ids = [
    'preloader',
    'preloader-counter',
    'preloader-fill',
    'header-logo',
    'header-cart-count',
    'cart-drawer-count',
    'dock-cart-count',
    'cart-items-container',
    'cart-empty-state',
    'cart-subtotal-val',
    'cart-discount-row',
    'cart-discount-val',
    'cart-shipping-val',
    'cart-total-val',
    'free-shipping-text',
    'free-shipping-percent',
    'free-shipping-bar',
    'cart-coupon-tags'
  ];
  const elements = new Map(ids.map((id) => [id, createMockElement('div', { id })]));
  const storage = new Map();

  globalThis.document = {
    readyState: 'loading',
    body: createMockElement('body'),
    addEventListener: () => {},
    getElementById: (id) => elements.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement(tag)
  };
  globalThis.window = {
    scrollY: 0,
    pageYOffset: 0,
    addEventListener: () => {},
    removeEventListener: () => {},
    scrollTo: () => {},
    matchMedia: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k)
    },
    MONARCC: sandbox.window.MONARCC
  };
  globalThis.localStorage = globalThis.window.localStorage;
  globalThis.requestAnimationFrame = (cb) => {
    cb();
    return 1;
  };

  let app = null;
  try {
    const { bootstrapApplication } = await import('../src/container.js');
    app = bootstrapApplication();

    // Add real catalog product p01 + apply MONARCC15 coupon end-to-end
    const firstProduct = sandbox.window.MONARCC.products[0];
    await globalThis.window.MONARCC_APP.addToCart(firstProduct.id);
    globalThis.window.MONARCC_APP.applyCoupon('MONARCC15');

    assert.match(elements.get('cart-subtotal-val').textContent, /COP$/, '#cart-subtotal-val must render formatted COP');
    assert.equal(elements.get('cart-discount-row').style.display, 'flex', '#cart-discount-row must display on coupon');
    assert.match(elements.get('cart-discount-val').textContent, /^-\$/, '#cart-discount-val must render negative discount');
    assert.match(elements.get('cart-total-val').textContent, /COP$/, '#cart-total-val must render grand total');
    assert.match(elements.get('free-shipping-percent').textContent, /^\d+%$/, '#free-shipping-percent must update');
    assert.equal(elements.get('free-shipping-bar').style.width, elements.get('free-shipping-percent').textContent);

    // Wait for preloader to reach 100% and verify it triggers crown self-draw at scrollY=0
    await new Promise((r) => setTimeout(r, 1500));
    assert.equal(elements.get('preloader').classList.contains('is-done'), true, 'Preloader must reach .is-done');
    assert.equal(elements.get('header-logo').getAttribute('data-brand-mode'), 'crown');
    assert.equal(elements.get('header-logo').classList.contains('is-drawing'), true, 'Preloader completion at top must trigger header crown self-draw');
  } finally {
    if (app) app.destroy();
    await new Promise((r) => setTimeout(r, 15));
    globalThis.window = prevWin;
    globalThis.document = prevDoc;
    globalThis.requestAnimationFrame = prevRAF;
    delete globalThis.localStorage;
  }
});

test('Task 3.3: Clean Architecture inward Dependency Rule is strictly preserved (Domain & Application untouched)', async () => {
  const { execSync } = await import('node:child_process');

  const listJsFiles = (dir) => {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...listJsFiles(full));
      else if (entry.name.endsWith('.js')) out.push(full);
    }
    return out;
  };

  for (const file of listJsFiles(path.join(ROOT, 'src/domain'))) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /from\s+['"][^'"]*(?:application|adapters|infrastructure)/, `Domain file ${file} must have zero outward imports`);
  }

  for (const file of listJsFiles(path.join(ROOT, 'src/application'))) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /from\s+['"][^'"]*(?:adapters|infrastructure)/, `Application file ${file} must not import adapters/infrastructure`);
  }

  for (const file of listJsFiles(path.join(ROOT, 'src/adapters'))) {
    const src = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(src, /from\s+['"][^'"]*infrastructure/, `Adapter file ${file} must not import infrastructure`);
  }

  const diffCore = execSync('git diff --name-only src/domain src/application', { cwd: ROOT, encoding: 'utf8' }).trim();
  assert.equal(diffCore, '', 'src/domain and src/application must remain 100% untouched');
});

test('REQ-06 / Discreet Aesthetic Grid Resource: math-plot-grid.mp4 is integrated as discreet ambient watermark in #drop-breaker without software UI clutter', async () => {
  const html = readProjectFile('index.html');
  const css = readProjectFile('style.css');

  // 1. Video asset exists on disk with valid file size
  const gridVideoPath = path.join(ROOT, 'media/math-plot-grid.mp4');
  assert.ok(fs.existsSync(gridVideoPath), 'media/math-plot-grid.mp4 must exist on disk');
  const stat = fs.statSync(gridVideoPath);
  assert.ok(stat.size > 100000 && stat.size < 2000000, `Video file size (${stat.size}B) must be valid`);

  // 2. Poster image exists
  const posterPath = path.join(ROOT, 'media/math-plot-grid-poster.jpg');
  assert.ok(fs.existsSync(posterPath), 'media/math-plot-grid-poster.jpg must exist on disk');

  // 3. DomRenderer embeds math-plot-grid as discreet ambient background in #drop-breaker
  const { DomRenderer } = await import('../src/infrastructure/dom/DomRenderer.js');
  const renderer = new DomRenderer();
  const dropHtml = renderer._getBreakerDropHtml();
  assert.match(dropHtml, /<video\b[^>]*class="breaker-ambient-grid"[^>]*src="media\/math-plot-grid\.mp4"[^>]*>/i, '#drop-breaker must embed ambient grid video');
  assert.match(dropHtml, /\bautoplay\b/i, 'Ambient grid video must autoplay');
  assert.match(dropHtml, /\bloop\b/i, 'Ambient grid video must loop');
  assert.match(dropHtml, /\bmuted\b/i, 'Ambient grid video must be muted');
  assert.match(dropHtml, /\bplaysinline\b/i, 'Ambient grid video must have playsinline');
  assert.match(dropHtml, /aria-hidden="true"/i, 'Ambient grid video must be aria-hidden for accessibility');

  // 4. style.css styles .breaker-ambient-grid with low opacity, pointer-events: none, and no interaction
  assert.match(css, /\.breaker-ambient-grid\b[^}]*opacity:\s*0\.08/i, '.breaker-ambient-grid must have subtle ~0.08 opacity');
  assert.match(css, /\.breaker-ambient-grid\b[^}]*pointer-events:\s*none/i, '.breaker-ambient-grid must have pointer-events: none');

  // 5. Store purity: NO software lab, NO formulas, NO simulator UI, strictly e-commerce streetwear
  assert.doesNotMatch(html, /id="lab"/i, 'index.html must NOT have software #lab section');
  assert.doesNotMatch(html, /href="#lab"/i, 'Header nav must NOT link to #lab');
  assert.doesNotMatch(html, /SIMULADOR ASCII/i, 'index.html must NOT contain software simulator widgets');
  assert.doesNotMatch(html, /\\sigma\(x,y/i, 'index.html must NOT contain math formulas');
});











