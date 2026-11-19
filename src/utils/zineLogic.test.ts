import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getTotalDesktopSpreads,
  getDesktopSpread,
  pageIndexToDesktopSpread,
  desktopSpreadToPrimaryPage,
  computeFlipTransition,
  reorderOfficialCoverWrapHalves,
  buildZineFlipbookPlan,
  isPanoramicDoublePage,
  getZineBookPresentation,
} from './zineLogic';

test('12-page zine produces 7 spreads with cover on right and back cover on left', () => {
  assert.equal(getTotalDesktopSpreads(12), 7);

  const cover = getDesktopSpread(0, 12);
  assert.equal(cover.leftPageIndex, null);
  assert.equal(cover.rightPageIndex, 0);

  const middle = getDesktopSpread(2, 12);
  assert.equal(middle.leftPageIndex, 3);
  assert.equal(middle.rightPageIndex, 4);
  assert.equal(middle.label, 'Págs. 4–5 de 12');

  const back = getDesktopSpread(6, 12);
  assert.equal(back.leftPageIndex, 11);
  assert.equal(back.rightPageIndex, null);
});

test('pageIndexToDesktopSpread maps any page index to its spread', () => {
  assert.equal(pageIndexToDesktopSpread(0, 12), 0);
  assert.equal(pageIndexToDesktopSpread(1, 12), 1);
  assert.equal(pageIndexToDesktopSpread(2, 12), 1);
  assert.equal(pageIndexToDesktopSpread(11, 12), 6);
  assert.equal(desktopSpreadToPrimaryPage(0, 12), 0);
  assert.equal(desktopSpreadToPrimaryPage(3, 12), 5);
});

test('computeFlipTransition maps forward and backward single-leaf geometry', () => {
  const forward = computeFlipTransition(0, 1, 12);
  assert.equal(forward.direction, 1);
  assert.equal(forward.underLeftIndex, null);
  assert.equal(forward.leafFrontIndex, 0);
  assert.equal(forward.leafBackIndex, 1);
  assert.equal(forward.underRightIndex, 2);

  const backward = computeFlipTransition(2, 1, 12);
  assert.equal(backward.direction, -1);
  assert.equal(backward.underLeftIndex, 1);
  assert.equal(backward.leafFrontIndex, 3);
  assert.equal(backward.leafBackIndex, 2);
  assert.equal(backward.underRightIndex, 4);
});

test('reorderOfficialCoverWrapHalves places Sheet1-Right as cover and Sheet1-Left as back cover', () => {
  const halves = ['S1-L(Back)', 'S1-R(Front)', 'S2-L', 'S2-R', 'S3-L', 'S3-R'];
  assert.deepEqual(reorderOfficialCoverWrapHalves(halves), [
    'S1-R(Front)',
    'S2-L',
    'S2-R',
    'S3-L',
    'S3-R',
    'S1-L(Back)',
  ]);
});

test('buildZineFlipbookPlan keeps 16 sequential A5 portrait pages in exact reading order with proper spine sides', () => {
  const pages16 = Array.from({ length: 16 }, () => ({ width: 419.53, height: 595.28 }));
  const plan = buildZineFlipbookPlan(pages16, { coverWrapMode: 'auto' });

  assert.equal(plan.length, 16);
  assert.deepEqual(plan[0], { pdfPageNumber: 1, crop: 'full', spineSide: 'left' }); // Front Cover
  assert.deepEqual(plan[7], { pdfPageNumber: 8, crop: 'full', spineSide: 'right' }); // Sala Left
  assert.deepEqual(plan[8], { pdfPageNumber: 9, crop: 'full', spineSide: 'left' }); // Sala Right
  assert.deepEqual(plan[15], { pdfPageNumber: 16, crop: 'full', spineSide: 'right' }); // Back Cover
});

test('buildZineFlipbookPlan splits panoramic landscape pages cleanly and handles last-sheet cover wrap', () => {
  assert.equal(isPanoramicDoublePage(842, 595), true);
  assert.equal(isPanoramicDoublePage(419.53, 595.28), false);

  const mixedPages = [
    { width: 420, height: 595 }, // P1 portrait
    { width: 840, height: 595 }, // P2 panoramic interior spread -> P2-L, P2-R
    { width: 420, height: 595 }, // P3 portrait
    { width: 840, height: 595 }, // P4 last panoramic cover wrap [Back | Front]
  ];
  const plan = buildZineFlipbookPlan(mixedPages, { coverWrapMode: 'auto' });
  assert.equal(plan.length, 6);
  assert.deepEqual(plan.map((s) => `${s.pdfPageNumber}:${s.crop}:${s.spineSide}`), [
    '4:right:left', // Front cover centered
    '1:full:right',
    '2:left:left',
    '2:right:right',
    '3:full:left',
    '4:left:right', // Back cover centered
  ]);
});

test('buildZineFlipbookPlan detects all-landscape imposed wrap-around PDFs', () => {
  const imposed = Array.from({ length: 4 }, () => ({ width: 842, height: 595 }));
  const plan = buildZineFlipbookPlan(imposed, { coverWrapMode: 'auto' });
  assert.equal(plan.length, 8);
  assert.equal(plan[0].pdfPageNumber, 1);
  assert.equal(plan[0].crop, 'right');
  assert.equal(plan[7].pdfPageNumber, 1);
  assert.equal(plan[7].crop, 'left');
});

test('getZineBookPresentation centers closed front/back covers and resets when opening or in portrait mode', () => {
  const closedCover = getZineBookPresentation(0, 16, 'read', 'landscape');
  assert.equal(closedCover.isClosedFrontCover, true);
  assert.equal(closedCover.translateXPercent, -25);
  assert.equal(closedCover.clipPath, 'inset(0 0 0 50%)');

  const openingCover = getZineBookPresentation(0, 16, 'user_fold', 'landscape');
  assert.equal(openingCover.isClosedFrontCover, false);
  assert.equal(openingCover.translateXPercent, 0);
  assert.equal(openingCover.clipPath, 'inset(0 0 0 0)');

  const interiorSpread = getZineBookPresentation(1, 16, 'read', 'landscape');
  assert.equal(interiorSpread.translateXPercent, 0);
  assert.equal(interiorSpread.clipPath, 'inset(0 0 0 0)');

  const closedBackCover = getZineBookPresentation(15, 16, 'read', 'landscape');
  assert.equal(closedBackCover.isClosedBackCover, true);
  assert.equal(closedBackCover.translateXPercent, 25);
  assert.equal(closedBackCover.clipPath, 'inset(0 50% 0 0)');

  const portraitCover = getZineBookPresentation(0, 16, 'read', 'portrait');
  assert.equal(portraitCover.translateXPercent, 0);
  assert.equal(portraitCover.clipPath, 'inset(0 0 0 0)');
});

test('official zine PDF file exists on disk under public/assets/aistudio/zine.pdf.pdf', () => {
  const pdfPath = path.resolve(process.cwd(), 'public/assets/aistudio/zine.pdf.pdf');
  assert.equal(fs.existsSync(pdfPath), true);
  assert.ok(fs.statSync(pdfPath).size > 100000);
});



