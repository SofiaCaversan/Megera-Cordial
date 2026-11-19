import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CD_COVER_ARTWORKS,
  INITIAL_CD_CASE_OPEN,
  computeDragRotation,
  computeFlip180Target,
  getCoverArtForAct,
  getDiscSpinPlayState,
  getLidTransformState,
  isBackSideVisible,
  nextShelfSelection,
} from './cdCaseLogic.ts';

test('CD jewel case starts closed by default', () => {
  assert.equal(INITIAL_CD_CASE_OPEN, false);
  const closed = getLidTransformState(INITIAL_CD_CASE_OPEN);
  assert.equal(closed.rotateY, 0);
  assert.equal(closed.buttonLabel, 'Abrir Capa');
});

test('Opening the lid rotates along the left hinge in 3D and updates label', () => {
  const open = getLidTransformState(true);
  assert.ok(open.rotateY < -90);
  assert.equal(open.buttonLabel, 'Fechar Capa');
});

test('Each CD act maps to its reorganized /capa-cd/ illustration and exists on disk', () => {
  assert.equal(getCoverArtForAct(1).imageUrl, '/assets/aistudio/capa-cd/IMG_1562.PNG');
  assert.equal(getCoverArtForAct(2).imageUrl, '/assets/aistudio/capa-cd/IMG_1558.PNG');
  assert.equal(getCoverArtForAct(3).imageUrl, '/assets/aistudio/capa-cd/IMG_1557.PNG');

  for (const act of Object.values(CD_COVER_ARTWORKS)) {
    const diskPath = path.join(process.cwd(), 'public', decodeURI(act.imageUrl));
    assert.equal(fs.existsSync(diskPath), true, `Missing CD cover file on disk: ${diskPath}`);
  }
});

test('Selecting a different disc on the shelf resets lid to closed so its cover art is shown', () => {
  const switched = nextShelfSelection(0, 1, true);
  assert.deepEqual(switched, { inspectedIndex: 1, caseOpened: false });

  const toggledSame = nextShelfSelection(1, 1, false);
  assert.deepEqual(toggledSame, { inspectedIndex: 1, caseOpened: true });
});

test('CD spin animation uses animation-play-state running/paused without resetting angle', () => {
  assert.equal(getDiscSpinPlayState(true), 'running');
  assert.equal(getDiscSpinPlayState(false), 'paused');
});

test('isBackSideVisible exposes verso strictly between 90° and 270° across continuous 360° spins', () => {
  assert.equal(isBackSideVisible(0), false);
  assert.equal(isBackSideVisible(89), false);
  assert.equal(isBackSideVisible(91), true);
  assert.equal(isBackSideVisible(180), true);
  assert.equal(isBackSideVisible(269), true);
  assert.equal(isBackSideVisible(271), false);
  assert.equal(isBackSideVisible(360), false);
  assert.equal(isBackSideVisible(-180), true);
  assert.equal(isBackSideVisible(540), true);
});

test('computeDragRotation allows unbounded 360°+ horizontal rotation and clamps vertical tilt', () => {
  const spinRight = computeDragRotation({
    startX: 100,
    currentX: 700,
    startY: 100,
    currentY: 100,
    startRotateY: 0,
    startRotateX: -4,
  });
  assert.equal(spinRight.rotateY, 450);
  assert.equal(spinRight.rotateX, -4);

  const clampedTilt = computeDragRotation({
    startX: 100,
    currentX: 100,
    startY: 0,
    currentY: 500,
    startRotateY: 180,
    startRotateX: 0,
  });
  assert.equal(clampedTilt.rotateX, -24);
});

test('computeFlip180Target smoothly alternates between nearest 0°/360° front and 180° back', () => {
  assert.deepEqual(computeFlip180Target(0), { targetRotateY: 180, showingBack: true });
  assert.deepEqual(computeFlip180Target(180), { targetRotateY: 0, showingBack: false });
  assert.deepEqual(computeFlip180Target(200), { targetRotateY: 360, showingBack: false });
  assert.deepEqual(computeFlip180Target(368), { targetRotateY: 540, showingBack: true });
});

