import test from 'node:test';
import assert from 'node:assert/strict';
import { Crown3DViewer, CROWN_3D_COORDINATES } from '../src/infrastructure/dom/Crown3DViewer.js';
import * as THREE from '../src/vendor/three.module.min.js';

test('REQ-3D / Crown3DViewer: exports exact canonical mathematical coordinates', () => {
  assert.equal(CROWN_3D_COORDINATES.originX, 800);
  assert.equal(CROWN_3D_COORDINATES.originY, 665);
  assert.equal(CROWN_3D_COORDINATES.outer.length, 11);
  assert.equal(CROWN_3D_COORDINATES.cuts.length, 5);
  assert.equal(CROWN_3D_COORDINATES.pearls.length, 5);
  assert.equal(CROWN_3D_COORDINATES.bar.width, 478);
  assert.equal(CROWN_3D_COORDINATES.bar.height, 30);
});

test('REQ-3D / Crown3DViewer: instantiates with clean initial state and disposables list', () => {
  const viewer = new Crown3DViewer({ three: THREE });
  assert.equal(viewer.containerId, 'hero-crown-3d');
  assert.equal(viewer.lockupSelector, '.hero-brand-lockup');
  assert.equal(viewer.isVisible, false);
  assert.equal(viewer.isDragging, false);
  assert.equal(viewer.currentRotY, 0);
  assert.equal(viewer.currentRotX, 0);
  assert.deepEqual(viewer.disposables, []);
});

test('REQ-3D / Crown3DViewer: non-browser environment gracefully exits init() without throw', async () => {
  const viewer = new Crown3DViewer({ three: THREE });
  const result = await viewer.init();
  assert.equal(result, false, 'Should return false when window/document are absent');
});

test('REQ-3D / Crown3DViewer: triggerShimmer sets flashIntensity to 1.0', () => {
  const viewer = new Crown3DViewer({ three: THREE });
  assert.equal(viewer.flashIntensity, 0);
  viewer.triggerShimmer();
  assert.equal(viewer.flashIntensity, 1.0);
});

test('REQ-3D / Crown3DViewer: destroy() handles unmounted state cleanly', () => {
  const viewer = new Crown3DViewer({ three: THREE });
  assert.doesNotThrow(() => {
    viewer.destroy();
  });
});
