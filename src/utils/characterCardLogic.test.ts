import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLIP_BUTTON_LABEL,
  formatArchivalBadge,
  getCardBackTheme,
  getCardFaceRotation,
} from './characterCardLogic.ts';

test('Character card flip label matches exact requested text', () => {
  assert.equal(FLIP_BUTTON_LABEL, '↻ Virar Ficha');
});

test('formatArchivalBadge renders uppercase name with age', () => {
  assert.equal(formatArchivalBadge('Sara', 37), 'SARA (37)');
  assert.equal(formatArchivalBadge('Inês', 62), 'INÊS (62)');
  assert.equal(formatArchivalBadge('Margarida', 67), 'MARGARIDA (67)');
  assert.equal(formatArchivalBadge('Daniel', 26), 'DANIEL (26)');
});

test('getCardFaceRotation flips to rotateY 180deg and zeroes tilt when showing back', () => {
  assert.deepEqual(getCardFaceRotation(false, -5, 7), { rotateY: 7, rotateX: -5 });
  assert.deepEqual(getCardFaceRotation(true, -5, 7), { rotateY: 180, rotateX: 0 });
});

test('getCardBackTheme uses official Megera Cordial palette with no beige vintage paper', () => {
  const ines = getCardBackTheme('ines');
  const sara = getCardBackTheme('sara');
  const margarida = getCardBackTheme('margarida');
  const daniel = getCardBackTheme('daniel');

  assert.equal(ines.surfaceBg, '#F8CCE1');
  assert.equal(sara.surfaceBg, '#2071B8');
  assert.equal(margarida.surfaceBg, '#A84B70');
  assert.equal(daniel.surfaceBg, '#E3CD32');

  assert.equal(ines.surfaceInk, '#1A1A1A');
  assert.equal(sara.surfaceInk, '#FFFFFF');
  assert.equal(margarida.surfaceInk, '#FFFFFF');
  assert.equal(daniel.surfaceInk, '#1A1A1A');
});
