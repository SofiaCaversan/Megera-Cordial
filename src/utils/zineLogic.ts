export interface SpreadView {
  leftPageIndex: number | null;
  rightPageIndex: number | null;
  spreadIndex: number;
  totalSpreads: number;
  label: string;
}

/**
 * In desktop 2-page flipbook mode for a 12-page zine:
 * Spread 0: [null, 0] (Front cover on right)
 * Spread 1: [1, 2]
 * Spread 2: [3, 4]
 * Spread 3: [5, 6]
 * Spread 4: [7, 8]
 * Spread 5: [9, 10]
 * Spread 6: [11, null] (Back cover on left)
 */
export function getTotalDesktopSpreads(totalPages: number): number {
  if (totalPages <= 0) return 0;
  if (totalPages === 1) return 1;
  return 1 + Math.ceil((totalPages - 1) / 2);
}

export function getDesktopSpread(spreadIndex: number, totalPages: number): SpreadView {
  const totalSpreads = getTotalDesktopSpreads(totalPages);
  if (totalSpreads === 0) {
    return { leftPageIndex: null, rightPageIndex: null, spreadIndex: 0, totalSpreads: 0, label: '0 / 0' };
  }
  const safeSpread = Math.max(0, Math.min(spreadIndex, totalSpreads - 1));
  if (safeSpread === 0) {
    return {
      leftPageIndex: null,
      rightPageIndex: 0,
      spreadIndex: 0,
      totalSpreads,
      label: `Capa (1 / ${totalPages})`,
    };
  }
  const left = 1 + (safeSpread - 1) * 2;
  const rightCandidate = left + 1;
  const right = rightCandidate < totalPages ? rightCandidate : null;
  const label =
    right !== null
      ? `Págs. ${left + 1}–${right + 1} de ${totalPages}`
      : `Contracapa (${left + 1} / ${totalPages})`;

  return {
    leftPageIndex: left < totalPages ? left : null,
    rightPageIndex: right,
    spreadIndex: safeSpread,
    totalSpreads,
    label,
  };
}

export function pageIndexToDesktopSpread(pageIndex: number, totalPages: number): number {
  if (pageIndex <= 0 || totalPages <= 0) return 0;
  const clamped = Math.min(pageIndex, totalPages - 1);
  return Math.floor((clamped + 1) / 2);
}

export function desktopSpreadToPrimaryPage(spreadIndex: number, totalPages: number): number {
  const spread = getDesktopSpread(spreadIndex, totalPages);
  if (spread.leftPageIndex !== null) return spread.leftPageIndex;
  if (spread.rightPageIndex !== null) return spread.rightPageIndex;
  return 0;
}

export interface FlipLeafTransition {
  direction: 1 | -1;
  underLeftIndex: number | null;
  underRightIndex: number | null;
  leafFrontIndex: number | null;
  leafBackIndex: number | null;
}

/**
 * Computes exact page indices for a physical single-leaf 3D turn between two desktop spreads.
 * - Forward (+1): turning leaf starts over the right slot (prev.right) and flips left to reveal next.left on its back.
 * - Backward (-1): turning leaf starts over the left slot (prev.left) and flips right to reveal next.right on its back.
 */
export function computeFlipTransition(
  fromSpreadIndex: number,
  toSpreadIndex: number,
  totalPages: number
): FlipLeafTransition {
  const fromSpread = getDesktopSpread(fromSpreadIndex, totalPages);
  const toSpread = getDesktopSpread(toSpreadIndex, totalPages);
  const direction: 1 | -1 = toSpreadIndex >= fromSpreadIndex ? 1 : -1;

  if (direction === 1) {
    return {
      direction: 1,
      underLeftIndex: fromSpread.leftPageIndex,
      underRightIndex: toSpread.rightPageIndex,
      leafFrontIndex: fromSpread.rightPageIndex,
      leafBackIndex: toSpread.leftPageIndex,
    };
  }

  return {
    direction: -1,
    underLeftIndex: toSpread.leftPageIndex,
    underRightIndex: fromSpread.rightPageIndex,
    leafFrontIndex: fromSpread.leftPageIndex,
    leafBackIndex: toSpread.rightPageIndex,
  };
}

export interface PdfPageDimensions {
  width: number;
  height: number;
}

export interface ZineFlipbookSlot {
  pdfPageNumber: number;
  crop: 'full' | 'left' | 'right';
  spineSide: 'left' | 'right';
}

export function isPanoramicDoublePage(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return false;
  return width > height * 1.05;
}

/**
 * Given an imposed zine PDF where Page 1 is [Back Cover | Front Cover] and subsequent
 * landscape pages are facing spreads [Left | Right], reorders the sliced halves into
 * physical flipbook order: [Front Cover, Spread2-L, Spread2-R, ..., Back Cover].
 */
export function reorderOfficialCoverWrapHalves<T>(halves: T[]): T[] {
  if (halves.length < 4 || halves.length % 2 !== 0) return halves;
  const [backCover, frontCover, ...interior] = halves;
  return [frontCover, ...interior, backCover];
}

/**
 * Builds the exact flipbook slot sequence for mixed portrait + panoramic PDFs:
 * - Portrait pages stay single ('full').
 * - Panoramic landscape pages (width > height) split cleanly into 'left' + 'right' halves.
 * - If all pages are landscape cover-wrap sheets (Sheet 1 = [Back | Front]), reorders to
 *   [Front, ...interior, Back].
 * - Assigns spineSide by final flipbook slot index: even slots (0, 2, 4...) have spine on 'left'
 *   (front cover & right-hand pages); odd slots (1, 3, 5...) have spine on 'right'
 *   (left-hand pages & back cover).
 */
export function buildZineFlipbookPlan(
  pages: PdfPageDimensions[],
  options?: { coverWrapMode?: 'auto' | 'first-sheet' | 'last-sheet' | 'none' }
): ZineFlipbookSlot[] {
  if (pages.length === 0) return [];

  const mode = options?.coverWrapMode ?? 'auto';
  const rawSlots: Array<{ pdfPageNumber: number; crop: 'full' | 'left' | 'right' }> = [];
  let landscapeCount = 0;

  pages.forEach((dim, idx) => {
    const pdfPageNumber = idx + 1;
    if (isPanoramicDoublePage(dim.width, dim.height)) {
      landscapeCount += 1;
      rawSlots.push({ pdfPageNumber, crop: 'left' });
      rawSlots.push({ pdfPageNumber, crop: 'right' });
    } else {
      rawSlots.push({ pdfPageNumber, crop: 'full' });
    }
  });

  const allLandscape = landscapeCount === pages.length && pages.length >= 2;
  const firstIsLandscape = isPanoramicDoublePage(pages[0].width, pages[0].height);
  const lastIsLandscape = isPanoramicDoublePage(
    pages[pages.length - 1].width,
    pages[pages.length - 1].height
  );

  let ordered = rawSlots;

  if (mode === 'first-sheet' || (mode === 'auto' && allLandscape && firstIsLandscape)) {
    ordered = reorderOfficialCoverWrapHalves(rawSlots);
  } else if (
    (mode === 'last-sheet' || (mode === 'auto' && !firstIsLandscape && lastIsLandscape)) &&
    rawSlots.length >= 4
  ) {
    // Last landscape sheet contains [Back Cover (left), Front Cover (right)]
    const backCoverSlot = rawSlots[rawSlots.length - 2];
    const frontCoverSlot = rawSlots[rawSlots.length - 1];
    const interior = rawSlots.slice(0, rawSlots.length - 2);
    ordered = [frontCoverSlot, ...interior, backCoverSlot];
  }

  return ordered.map((slot, index) => ({
    ...slot,
    spineSide: index % 2 === 0 ? 'left' : 'right',
  }));
}

export interface ZineBookPresentation {
  isClosedFrontCover: boolean;
  isClosedBackCover: boolean;
  translateXPercent: -25 | 0 | 25;
  clipPath: string;
}

/**
 * Computes horizontal centering transform and empty-half clipping for StPageFlip:
 * - On page 0 (closed cover) in landscape 2-page mode, StPageFlip renders the cover
 *   on the right half of the canvas; translating -25% centers the cover page itself
 *   while clip-path hides the unused left half until the user begins opening it.
 * - On the final back cover page (even totalPages), translates +25% to center the left half.
 */
export function getZineBookPresentation(
  currentPageIndex: number,
  totalPages: number,
  flipState: string,
  orientation: 'landscape' | 'portrait' = 'landscape'
): ZineBookPresentation {
  if (orientation === 'portrait' || totalPages <= 1 || flipState !== 'read') {
    return {
      isClosedFrontCover: false,
      isClosedBackCover: false,
      translateXPercent: 0,
      clipPath: 'inset(0 0 0 0)',
    };
  }

  if (currentPageIndex === 0) {
    return {
      isClosedFrontCover: true,
      isClosedBackCover: false,
      translateXPercent: -25,
      clipPath: 'inset(0 0 0 50%)',
    };
  }

  if (totalPages % 2 === 0 && currentPageIndex >= totalPages - 1) {
    return {
      isClosedFrontCover: false,
      isClosedBackCover: true,
      translateXPercent: 25,
      clipPath: 'inset(0 50% 0 0)',
    };
  }

  return {
    isClosedFrontCover: false,
    isClosedBackCover: false,
    translateXPercent: 0,
    clipPath: 'inset(0 0 0 0)',
  };
}

