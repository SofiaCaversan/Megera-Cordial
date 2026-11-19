import test from 'node:test';
import assert from 'node:assert/strict';
import { getCdPaletteSpec } from './moodboardCdCanvas.ts';

test('getCdPaletteSpec maps acts 1, 2, 3 to standardized ATO 1..3 labels and official palette', () => {
  const act1 = getCdPaletteSpec(1);
  const act2 = getCdPaletteSpec(2);
  const act3 = getCdPaletteSpec(3);

  assert.equal(act1.actTitle, 'ATO 1');
  assert.equal(act2.actTitle, 'ATO 2');
  assert.equal(act3.actTitle, 'ATO 3');

  assert.equal(act1.midColor, '#F8CCE1');
  assert.equal(act2.midColor, '#2071B8');
  assert.equal(act3.midColor, '#E3CD32');
});
