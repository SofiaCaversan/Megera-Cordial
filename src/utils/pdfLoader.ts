export interface PdfPageProxyLike {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    canvas?: HTMLCanvasElement;
  }) => { promise: Promise<void> };
}

export interface PdfDocumentProxyLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxyLike>;
}

export interface PdfJsApiLike {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PdfDocumentProxyLike> };
}

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_CDN_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let cachedPdfJsPromise: Promise<PdfJsApiLike> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-pdfjs-cdn="${src}"]`);
    if (existing) {
      if ((window as unknown as { pdfjsLib?: PdfJsApiLike }).pdfjsLib) {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('CDN script failed')), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-pdfjs-cdn', src);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Loads PDF.js via CDN first (per user specification), falling back to bundled pdfjs-dist
 * only if the CDN cannot be reached in a sandboxed/offline environment.
 */
export function loadPdfJs(): Promise<PdfJsApiLike> {
  if (cachedPdfJsPromise) return cachedPdfJsPromise;

  cachedPdfJsPromise = (async () => {
    const win = window as unknown as { pdfjsLib?: PdfJsApiLike };
    if (win.pdfjsLib) {
      win.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN_WORKER_URL;
      return win.pdfjsLib;
    }

    try {
      await loadScript(PDFJS_CDN_URL);
      const loadedLib = (window as unknown as { pdfjsLib?: PdfJsApiLike }).pdfjsLib;
      if (loadedLib) {
        loadedLib.GlobalWorkerOptions.workerSrc = PDFJS_CDN_WORKER_URL;
        return loadedLib;
      }
    } catch {
      // Fallback handled below
    }

    const [bundledRaw, workerRaw] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);
    const bundled = bundledRaw as unknown as PdfJsApiLike;
    const workerMod = workerRaw as unknown as { default: string };
    bundled.GlobalWorkerOptions.workerSrc = workerMod.default;
    return bundled;
  })();

  return cachedPdfJsPromise;
}
