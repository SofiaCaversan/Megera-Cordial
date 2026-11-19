import { loadPdfJs } from './pdfLoader';
import { buildZineFlipbookPlan, type PdfPageDimensions } from './zineLogic';

export const OFFICIAL_ZINE_PDF_URL = '/assets/aistudio/zine.pdf.pdf';

const renderedUrlCache = new Map<string, string[]>();

/**
 * Paints subtle coated magazine paper (couche) sheen and soft binding-edge gutter shadow
 * directly onto each rendered flipbook page canvas so turning leaves carry realistic materiality.
 */
function applyCouchePaperFinish(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spineSide: 'left' | 'right'
): void {
  // 1. Subtle diagonal satin magazine paper sheen
  const sheen = ctx.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0.01)');
  sheen.addColorStop(0.55, 'rgba(255, 255, 255, 0.06)');
  sheen.addColorStop(0.85, 'rgba(0, 0, 0, 0.005)');
  sheen.addColorStop(1, 'rgba(0, 0, 0, 0.015)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  // 2. Soft, wide feathered spine crease along binding edge (no heavy dark band)
  const gutterWidth = Math.round(w * 0.11);
  if (spineSide === 'right') {
    const g = ctx.createLinearGradient(w - gutterWidth, 0, w, 0);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(0.45, 'rgba(255, 255, 255, 0.035)');
    g.addColorStop(0.75, 'rgba(0, 0, 0, 0.02)');
    g.addColorStop(0.92, 'rgba(0, 0, 0, 0.045)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.075)');
    ctx.fillStyle = g;
    ctx.fillRect(w - gutterWidth, 0, gutterWidth, h);
  } else {
    const g = ctx.createLinearGradient(0, 0, gutterWidth, 0);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.075)');
    g.addColorStop(0.08, 'rgba(0, 0, 0, 0.045)');
    g.addColorStop(0.25, 'rgba(0, 0, 0, 0.02)');
    g.addColorStop(0.55, 'rgba(255, 255, 255, 0.035)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, gutterWidth, h);
  }
}

function sliceCanvasHalf(
  source: HTMLCanvasElement,
  half: 'left' | 'right',
  spineSide: 'left' | 'right'
): string {
  const halfW = Math.floor(source.width / 2);
  const h = source.height;
  const out = document.createElement('canvas');
  out.width = halfW;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return '';

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const sx = half === 'left' ? 0 : halfW;
  ctx.fillStyle = '#FCFBF8';
  ctx.fillRect(0, 0, halfW, h);
  ctx.drawImage(source, sx, 0, halfW, h, 0, 0, halfW, h);
  applyCouchePaperFinish(ctx, halfW, h, spineSide);
  return out.toDataURL('image/png');
}

export async function renderPdfToFlipbookImages(
  source:
    | { url: string; isOfficialCoverWrap?: boolean; coverWrapMode?: 'auto' | 'first-sheet' | 'last-sheet' | 'none' }
    | { buffer: ArrayBuffer; isOfficialCoverWrap?: boolean; coverWrapMode?: 'auto' | 'first-sheet' | 'last-sheet' | 'none' }
): Promise<string[]> {
  if ('url' in source) {
    const cached = renderedUrlCache.get(source.url);
    if (cached) return cached;
  }

  let buffer: ArrayBuffer;
  if ('url' in source) {
    const res = await fetch(source.url, { cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`Failed to fetch PDF (${res.status})`);
    }
    buffer = await res.arrayBuffer();
  } else {
    buffer = source.buffer;
  }

  const pdfjsLib = await loadPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  // 1. Inspect base dimensions of every PDF page to distinguish portrait singles vs panoramic spreads
  const pageDims: PdfPageDimensions[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const baseVp = page.getViewport({ scale: 1 });
    pageDims.push({ width: baseVp.width, height: baseVp.height });
  }

  const plan = buildZineFlipbookPlan(pageDims, {
    coverWrapMode: source.coverWrapMode ?? 'auto',
  });

  // 2. Render each referenced PDF page once at high-DPI (>= 3.0x) with high-quality smoothing
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const renderScale = Math.max(dpr, 3.0);
  const renderedPdfCanvases = new Map<number, HTMLCanvasElement>();

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    renderedPdfCanvases.set(p, canvas);
  }

  // 3. Emit final flipbook pages as lossless PNGs with exact spine gutter & couche paper finish
  const finalPages: string[] = [];
  for (const slot of plan) {
    const srcCanvas = renderedPdfCanvases.get(slot.pdfPageNumber);
    if (!srcCanvas) continue;

    if (slot.crop === 'full') {
      const ctx = srcCanvas.getContext('2d');
      if (ctx) {
        applyCouchePaperFinish(ctx, srcCanvas.width, srcCanvas.height, slot.spineSide);
      }
      finalPages.push(srcCanvas.toDataURL('image/png'));
    } else {
      finalPages.push(sliceCanvasHalf(srcCanvas, slot.crop, slot.spineSide));
    }
  }

  if ('url' in source && finalPages.length > 0) {
    renderedUrlCache.set(source.url, finalPages);
  }

  return finalPages;
}
