import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampBoardPosition,
  clampScale,
  normalizeRotation,
  arrangeItemsKnolling,
  bringItemToFront,
  moveItemLayerUp,
  moveItemLayerDown,
  getItemLayerPosition,
  buildUnifiedMoodboardLibrary,
  type MoodboardItemInstance,
} from './moodboardLogic';

test('clampBoardPosition keeps items inside the aluminum plate margin', () => {
  assert.deepEqual(clampBoardPosition(-10, 120), { x: 8, y: 90 });
  assert.deepEqual(clampBoardPosition(52, 48), { x: 52, y: 48 });
});

test('clampScale and normalizeRotation clamp to ergonomic bounds', () => {
  assert.equal(clampScale(0.1), 0.55);
  assert.equal(clampScale(3.5), 1.85);
  assert.equal(clampScale(1.25), 1.25);
  assert.equal(normalizeRotation(195), -165);
  assert.equal(normalizeRotation(-190), 170);
});

test('arrangeItemsKnolling aligns items in a 0-deg knolling grid', () => {
  const items: MoodboardItemInstance[] = [
    { instanceId: '1', catalogId: 'coffee', label: 'Café', kind: 'svg', x: 75, y: 80, rotation: 33, scale: 1.4, zIndex: 1 },
    { instanceId: '2', catalogId: 'watch', label: 'Relógio', kind: 'svg', x: 12, y: 20, rotation: -18, scale: 0.8, zIndex: 2 },
    { instanceId: '3', catalogId: 'pills', label: 'Cartela', kind: 'svg', x: 40, y: 65, rotation: 14, scale: 1.1, zIndex: 3 },
  ];

  const arranged = arrangeItemsKnolling(items);
  assert.equal(arranged.length, 3);
  assert.ok(arranged.every((it) => it.rotation === 0));
  assert.ok(arranged[0].x < arranged[1].x && arranged[1].x < arranged[2].x);
});

test('bringItemToFront increments zIndex above all others', () => {
  const items: MoodboardItemInstance[] = [
    { instanceId: 'a', catalogId: 'coffee', label: 'Café', kind: 'svg', x: 30, y: 30, rotation: 0, scale: 1, zIndex: 1 },
    { instanceId: 'b', catalogId: 'watch', label: 'Relógio', kind: 'svg', x: 60, y: 30, rotation: 0, scale: 1, zIndex: 5 },
  ];
  const updated = bringItemToFront(items, 'a');
  assert.equal(updated.find((i) => i.instanceId === 'a')?.zIndex, 6);
});

test('moveItemLayerUp and moveItemLayerDown adjust layers deterministically without ties', () => {
  const items: MoodboardItemInstance[] = [
    { instanceId: 'a', catalogId: '1', label: 'Item 1', kind: 'upload', x: 30, y: 30, rotation: 0, scale: 1, zIndex: 1 },
    { instanceId: 'b', catalogId: '2', label: 'Item 2', kind: 'upload', x: 40, y: 40, rotation: 0, scale: 1, zIndex: 2 },
    { instanceId: 'c', catalogId: '3', label: 'Item 3', kind: 'upload', x: 50, y: 50, rotation: 0, scale: 1, zIndex: 3 },
  ];

  const movedUp = moveItemLayerUp(items, 'a');
  assert.deepEqual(getItemLayerPosition(movedUp, 'a'), { layer: 2, total: 3 });
  assert.deepEqual(getItemLayerPosition(movedUp, 'b'), { layer: 1, total: 3 });
  assert.equal(movedUp.find((i) => i.instanceId === 'a')?.zIndex, 2);

  const movedDown = moveItemLayerDown(movedUp, 'c');
  assert.deepEqual(getItemLayerPosition(movedDown, 'c'), { layer: 2, total: 3 });
  assert.deepEqual(getItemLayerPosition(movedDown, 'a'), { layer: 3, total: 3 });

  // Clamped at bottom boundary
  const atBottom = moveItemLayerDown(movedDown, 'b');
  assert.deepEqual(getItemLayerPosition(atBottom, 'b'), { layer: 1, total: 3 });
});

test('buildUnifiedMoodboardLibrary includes all 63 PNGs + 2 JPGs with encoded URLs and zero deleted IMG_* 404s', () => {
  const lib = buildUnifiedMoodboardLibrary(63, 2);
  assert.equal(lib.length, 65);
  assert.equal(lib[0].imageUrl, '/assets/aistudio/moodboard/item%20(1).png');
  assert.equal(lib[27].imageUrl, '/assets/aistudio/moodboard/item%20(28).png');
  assert.equal(lib[62].imageUrl, '/assets/aistudio/moodboard/item%20(63).png');
  assert.equal(lib[63].imageUrl, '/assets/aistudio/moodboard/item%20(1).jpg');
  assert.equal(lib[64].imageUrl, '/assets/aistudio/moodboard/item%20(2).jpg');

  for (const item of lib) {
    assert.equal(item.imageUrl.includes('IMG_'), false, `Stale IMG_ path found: ${item.imageUrl}`);
    const diskPath = path.join(process.cwd(), 'public', decodeURI(item.imageUrl));
    assert.equal(fs.existsSync(diskPath), true, `Missing moodboard file on disk: ${diskPath}`);
  }
});

