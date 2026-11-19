import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SALA_TERAPIA_ASSETS,
  SALA_TERAPIA_BACKGROUND,
  buildCrayonFurnitureSvg,
  buildFixedAiFurniturePrompt,
  clampRoomPosition,
  clampRoomScale,
  getRoomItemLayerPosition,
  moveRoomItemLayerDown,
  moveRoomItemLayerUp,
  svgMarkupToDataUrl,
  toggleRoomItemFlip,
  type TherapyRoomItemInstance,
} from './therapyRoomLogic';

test('SALA_TERAPIA_BACKGROUND points to real uploaded perspective image with exact natural ratio', () => {
  assert.equal(SALA_TERAPIA_BACKGROUND.imageUrl, '/assets/aistudio/sala-terapia/sala-fundo.png.png.png');
  assert.equal(SALA_TERAPIA_BACKGROUND.width, 3542);
  assert.equal(SALA_TERAPIA_BACKGROUND.height, 2514);
  const bgDiskPath = path.join(process.cwd(), 'public', decodeURI(SALA_TERAPIA_BACKGROUND.imageUrl));
  assert.equal(fs.existsSync(bgDiskPath), true, `Missing sala-fundo file: ${bgDiskPath}`);
});

test('SALA_TERAPIA_ASSETS exclusively loads sala-terapia folder items with lowercase .png matching disk', () => {
  assert.equal(SALA_TERAPIA_ASSETS.length, 12);
  for (const item of SALA_TERAPIA_ASSETS) {
    assert.equal(item.imageUrl.startsWith('/assets/aistudio/sala-terapia/'), true);
    assert.ok(item.cropBox && item.cropBox.w > 0 && item.cropBox.h > 0);
    const diskPath = path.join(process.cwd(), 'public', decodeURI(item.imageUrl));
    assert.equal(fs.existsSync(diskPath), true, `Missing sala-terapia file: ${diskPath}`);
  }
  const requiredFiles = [
    'IMG_1555.png',
    'IMG_1556.png',
    'IMG_1557.png',
    'IMG_1558.png',
    'IMG_1560.png',
    'IMG_1561.png',
    'IMG_1562.png',
    'IMG_1563.png',
  ];
  for (const file of requiredFiles) {
    assert.equal(
      SALA_TERAPIA_ASSETS.some((a) => a.fileName === file),
      true,
      `Expected ${file} in SALA_TERAPIA_ASSETS`
    );
  }
});

test('clampRoomPosition and clampRoomScale keep items within room perspective bounds', () => {
  assert.deepEqual(clampRoomPosition(-10, 120), { x: 6, y: 94 });
  assert.deepEqual(clampRoomPosition(48, 62), { x: 48, y: 62 });
  assert.equal(clampRoomScale(0.1), 0.35);
  assert.equal(clampRoomScale(4.0), 2.6);
  assert.equal(clampRoomScale(1.25), 1.25);
});

test('toggleRoomItemFlip and layer ordering adjust flipped state and zIndex cleanly', () => {
  const items: TherapyRoomItemInstance[] = [
    {
      instanceId: 'a',
      catalogId: 'sala-img-1557',
      label: 'Divã Clássico',
      imageUrl: '/assets/aistudio/sala-terapia/IMG_1557.png',
      x: 40,
      y: 65,
      scale: 1,
      rotation: 0,
      flipped: false,
      zIndex: 1,
    },
    {
      instanceId: 'b',
      catalogId: 'sala-img-1560',
      label: 'Luminária de Chão',
      imageUrl: '/assets/aistudio/sala-terapia/IMG_1560.png',
      x: 65,
      y: 55,
      scale: 1,
      rotation: 0,
      flipped: false,
      zIndex: 2,
    },
  ];

  const flipped = toggleRoomItemFlip(items, 'a');
  assert.equal(flipped[0].flipped, true);
  assert.equal(flipped[1].flipped, false);

  const movedUp = moveRoomItemLayerUp(flipped, 'a');
  assert.deepEqual(getRoomItemLayerPosition(movedUp, 'a'), { layer: 2, total: 2 });

  const movedDown = moveRoomItemLayerDown(movedUp, 'a');
  assert.deepEqual(getRoomItemLayerPosition(movedDown, 'a'), { layer: 1, total: 2 });
});

test('buildFixedAiFurniturePrompt and buildCrayonFurnitureSvg enforce exact style prompt and sanitize SVG', () => {
  const prompt = buildFixedAiFurniturePrompt('uma mesa de centro');
  assert.equal(prompt.includes('uma mesa de centro'), true);
  assert.equal(prompt.includes('#2071B8'), true);
  assert.equal(prompt.includes('#F8CCE1'), true);
  assert.equal(prompt.includes('#000000'), true);
  assert.equal(prompt.includes('vintage editorial zine style'), true);

  const svg = buildCrayonFurnitureSvg({
    label: 'Mesa de Centro',
    paths: [
      { d: 'M60 180 L260 180 L230 220 L90 220 Z <script>alert(1)</script>', role: 'primary_blue', strokeWidth: 4 },
      { d: 'M95 190 L225 190', role: 'pink_accent', strokeWidth: 3 },
    ],
  });
  assert.equal(svg.includes('<svg'), true);
  assert.equal(svg.includes('#2071B8'), true);
  assert.equal(svg.includes('#F8CCE1'), true);
  assert.equal(svg.includes('<script'), false);

  const dataUrl = svgMarkupToDataUrl(svg);
  assert.equal(dataUrl.startsWith('data:image/svg+xml;charset=utf-8,'), true);
});
