import React, { useEffect, useRef, useState } from 'react';
import { PageFlip } from 'page-flip';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  RotateCcw,
  FileText,
  Loader2,
} from 'lucide-react';
import { playPageTouchSound, playPageTurnSound } from '../utils/audioEngine';
import { OFFICIAL_ZINE_PDF_URL, renderPdfToFlipbookImages } from '../utils/zinePdfRenderer';
import { getZineBookPresentation } from '../utils/zineLogic';

interface ZineViewerProps {
  isAdmin: boolean;
}

export const ZineViewer: React.FC<ZineViewerProps> = ({ isAdmin }) => {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isOfficialActive, setIsOfficialActive] = useState<boolean>(true);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customTurnSound, setCustomTurnSound] = useState<string | null>(null);
  const [soundTriggerCount, setSoundTriggerCount] = useState<number>(0);
  const [touchTriggerCount, setTouchTriggerCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentFlipState, setCurrentFlipState] = useState<string>('read');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageHostRef = useRef<HTMLDivElement | null>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);

  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const customSoundRef = useRef<string | null>(customTurnSound);
  const lastTouchSoundAtRef = useRef<number>(0);
  const lastFlipSoundAtRef = useRef<number>(0);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    customSoundRef.current = customTurnSound;
  }, [customTurnSound]);

  const firePaperTouchSound = () => {
    const now = Date.now();
    if (now - lastTouchSoundAtRef.current < 160) return;
    lastTouchSoundAtRef.current = now;
    if (soundEnabledRef.current) {
      playPageTouchSound();
      setTouchTriggerCount((c) => c + 1);
    }
  };

  const fireSyncedPaperSound = () => {
    const now = Date.now();
    if (now - lastFlipSoundAtRef.current < 220) return;
    lastFlipSoundAtRef.current = now;
    if (soundEnabledRef.current) {
      playPageTurnSound(customSoundRef.current);
      setSoundTriggerCount((c) => c + 1);
    }
  };

  // Auto-load the permanent Zine PDF on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingPdf(true);
      setLoadError(null);
      try {
        const pages = await renderPdfToFlipbookImages({
          url: OFFICIAL_ZINE_PDF_URL,
          coverWrapMode: 'auto',
        });
        if (!cancelled) {
          setPageImages(pages);
          setIsOfficialActive(true);
          setCurrentPageIndex(0);
        }
      } catch {
        if (!cancelled) {
          setLoadError('Não foi possível carregar o PDF oficial do Zine.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPdf(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mount StPageFlip with realistic flexible paper curl & corner-drag physics
  useEffect(() => {
    const host = stageHostRef.current;
    if (!host || pageImages.length === 0) return;

    host.innerHTML = '';
    const bookMount = document.createElement('div');
    bookMount.className = 'mx-auto';
    host.appendChild(bookMount);

    const flip = new PageFlip(bookMount, {
      width: 420,
      height: 595,
      size: 'stretch',
      minWidth: 250,
      maxWidth: 460,
      minHeight: 354,
      maxHeight: 652,
      drawShadow: true,
      maxShadowOpacity: 0.16,
      flippingTime: 900,
      usePortrait: true,
      startZIndex: 10,
      autoSize: true,
      showCover: true,
      mobileScrollSupport: false,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 20,
      showPageCorners: true,
      disableFlipByClick: false,
    });

    const applyHiDpiCanvas = () => {
      const canvas = bookMount.querySelector('canvas.stf__canvas') as HTMLCanvasElement | null;
      if (!canvas) return;
      const dpr = Math.max(window.devicePixelRatio || 1, 3);
      const cssW = canvas.clientWidth || parseInt(getComputedStyle(canvas).width, 10);
      const cssH = canvas.clientHeight || parseInt(getComputedStyle(canvas).height, 10);
      if (cssW > 0 && cssH > 0) {
        const targetW = Math.round(cssW * dpr);
        const targetH = Math.round(cssH * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      }
    };

    flip.on('changeState', (ev: { data?: string }) => {
      const nextState = String(ev.data ?? 'read');
      setCurrentFlipState(nextState);
      if (nextState === 'flipping') {
        fireSyncedPaperSound();
      }
    });

    flip.on('flip', (ev: { data?: number }) => {
      const pageIdx = typeof ev.data === 'number' ? ev.data : 0;
      setCurrentPageIndex(pageIdx);
    });

    flip.on('changeOrientation', (ev: { data?: string }) => {
      setOrientation(ev.data === 'portrait' ? 'portrait' : 'landscape');
      window.requestAnimationFrame(applyHiDpiCanvas);
    });

    flip.on('init', () => {
      applyHiDpiCanvas();
    });

    flip.loadFromImages(pageImages);
    const ui = (
      flip as unknown as {
        getUI?: () => { resizeCanvas?: () => void } | undefined;
      }
    ).getUI?.();
    if (ui && typeof ui.resizeCanvas === 'function') {
      const origResize = ui.resizeCanvas.bind(ui);
      ui.resizeCanvas = () => {
        origResize();
        applyHiDpiCanvas();
      };
    }
    applyHiDpiCanvas();
    setOrientation(flip.getOrientation() === 'portrait' ? 'portrait' : 'landscape');
    pageFlipRef.current = flip;

    return () => {
      pageFlipRef.current = null;
      try {
        flip.destroy();
      } catch {
        // Ignore cleanup errors if DOM already detached
      }
    };
  }, [pageImages]);

  // Update PageFlip canvas bounds smoothly when zoom changes (keeps 1:1 mouse corner grab alignment)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        pageFlipRef.current?.update();
      } catch {
        // Ignore before init
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [zoom]);

  // Keyboard ArrowLeft / ArrowRight navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement | null)?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowRight') {
        pageFlipRef.current?.flipNext('top');
      } else if (e.key === 'ArrowLeft') {
        pageFlipRef.current?.flipPrev('top');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleAdminPdfUpload = async (files: FileList | null) => {
    if (!isAdmin || !files || files.length === 0) return;
    const pdfFile = Array.from(files).find(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (!pdfFile) {
      setAdminNotice('Selecione um arquivo .pdf válido.');
      return;
    }

    setIsLoadingPdf(true);
    setAdminNotice(null);
    try {
      const buffer = await pdfFile.arrayBuffer();
      const pages = await renderPdfToFlipbookImages({ buffer, coverWrapMode: 'auto' });
      if (pages.length > 0) {
        setPageImages(pages);
        setIsOfficialActive(false);
        setCurrentPageIndex(0);
        setAdminNotice(`PDF "${pdfFile.name}" carregado em modo administrador.`);
      }
    } catch {
      setAdminNotice('Não foi possível processar o PDF enviado.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const restoreOfficialPdf = async () => {
    if (!isAdmin) return;
    setIsLoadingPdf(true);
    setAdminNotice(null);
    try {
      const pages = await renderPdfToFlipbookImages({
        url: OFFICIAL_ZINE_PDF_URL,
        coverWrapMode: 'auto',
      });
      setPageImages(pages);
      setIsOfficialActive(true);
      setCurrentPageIndex(0);
    } catch {
      setAdminNotice('Erro ao restaurar o Zine oficial.');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const totalPages = pageImages.length;
  const canGoPrev = totalPages > 0 && currentPageIndex > 0;
  const canGoNext = totalPages > 0 && currentPageIndex < totalPages - 1;
  const bookMaxWidthPx = Math.round(700 * zoom);
  const presentation = getZineBookPresentation(
    currentPageIndex,
    totalPages,
    currentFlipState,
    orientation
  );

  return (
    <section
      ref={containerRef}
      aria-labelledby="zine-heading"
      className={`max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-24 ${
        isFullscreen ? 'bg-[#F7F5F0] overflow-y-auto' : ''
      }`}
    >
      {/* Clean Artistic Header & Toolbar (No Page Numbers) */}
      <div className="border-b border-[#1A1A1A]/15 pb-3 mb-4 flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[#2071B8]">
            ZINE DIGITAL
          </p>
          <h1 id="zine-heading" className="font-script text-4xl sm:text-5xl text-[#1A1A1A] leading-none mt-1">
            Zine Digital
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-[#1A1A1A]/25 bg-white">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
              aria-label="Reduzir zoom do zine"
              className="p-2 hover:bg-[#F7F5F0] border-r border-[#1A1A1A]/15 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 font-mono-ui text-[11px] tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
              aria-label="Aumentar zoom do zine"
              className="p-2 hover:bg-[#F7F5F0] border-l border-[#1A1A1A]/15 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            data-testid="zine-sound-toggle"
            onClick={() => setSoundEnabled((s) => !s)}
            aria-label={soundEnabled ? 'Silenciar som de folha virando' : 'Ativar som de folha virando'}
            className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-mono-ui border border-[#1A1A1A]/25 bg-white hover:bg-[#F7F5F0] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#2071B8]" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Som do papel</span>
          </button>

          {/* Admin-only PDF & Sound upload controls (completely hidden for regular visitors) */}
          {isAdmin && (
            <>
              <label className="cursor-pointer flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-mono-ui border border-[#1A1A1A]/25 bg-white hover:bg-[#F7F5F0]">
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Som MP3/WAV</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  aria-label="Enviar áudio personalizado para virada de página"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCustomTurnSound(URL.createObjectURL(f));
                    e.target.value = '';
                  }}
                />
              </label>

              <label
                data-testid="upload-zine-pdf-btn"
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#F8CCE1] hover:bg-[#f5bdd8] text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]"
              >
                <span>{isLoadingPdf ? 'Processando PDF...' : '📄 Subir / Trocar PDF'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  aria-label="Subir ou trocar PDF do Zine"
                  onChange={(e) => {
                    handleAdminPdfUpload(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>

              {!isOfficialActive && (
                <button
                  type="button"
                  onClick={restoreOfficialPdf}
                  aria-label="Restaurar zine oficial"
                  className="flex items-center gap-1 px-2.5 py-2 text-[11px] font-mono-ui border border-[#1A1A1A]/30 bg-white hover:bg-[#E3CD32]/40 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Oficial</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia do zine'}
            className="p-2 border border-[#1A1A1A]/25 bg-white hover:bg-[#F7F5F0] cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {adminNotice && isAdmin && (
        <p data-testid="zine-upload-notice" className="mb-4 px-3 py-2 border border-[#2071B8]/40 bg-white font-mono-ui text-xs text-[#1A1A1A]">
          {adminNotice}
        </p>
      )}

      {/* Tactile Editorial Desk Stage (No Page Numbers) */}
      <div className="relative bg-[#E7E3D9] border border-[#1A1A1A]/20 p-3 sm:p-5 flex flex-col items-center justify-center overflow-hidden shadow-[0_14px_36px_-24px_rgba(26,26,26,0.12)]">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-mono-ui text-[11px] text-[#425266]">
            Segure e arraste qualquer canto da folha para dobrar e virar · ou clique para folhear
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="zine-prev-btn"
              onClick={() => pageFlipRef.current?.flipPrev('top')}
              disabled={!canGoPrev || isLoadingPdf}
              aria-label="Página anterior do zine"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono-ui border border-[#1A1A1A] bg-white disabled:opacity-35 hover:bg-[#E3CD32]/50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>
            <button
              type="button"
              data-testid="zine-next-btn"
              onClick={() => pageFlipRef.current?.flipNext('top')}
              disabled={!canGoNext || isLoadingPdf}
              aria-label="Próxima página do zine"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono-ui border border-[#1A1A1A] bg-white disabled:opacity-35 hover:bg-[#E3CD32]/50 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Soft-Paper Curl Stage */}
        <div
          data-testid="zine-book-stage"
          data-flip-state={currentFlipState}
          data-current-page-index={currentPageIndex}
          data-total-pages={totalPages}
          data-sound-triggers={soundTriggerCount}
          data-touch-triggers={touchTriggerCount}
          data-cover-centered={presentation.isClosedFrontCover ? 'true' : 'false'}
          data-translate-x={presentation.translateXPercent}
          className="w-full flex justify-center items-center py-2 overflow-hidden"
        >
          {isLoadingPdf ? (
            <div className="w-full max-w-[820px] h-[440px] sm:h-[540px] border border-[#1A1A1A]/20 bg-[#F7F5F0]/80 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#2071B8]" />
              <p className="font-mono-ui text-xs text-[#425266]">
                Preparando edição impressa em papel couche...
              </p>
            </div>
          ) : loadError ? (
            <div className="w-full max-w-[820px] h-[360px] border border-[#1A1A1A]/25 bg-white flex items-center justify-center p-6 text-center">
              <p className="font-mono-ui text-xs text-[#1A1A1A]">{loadError}</p>
            </div>
          ) : (
            <div
              onPointerDownCapture={() => {
                if (!isLoadingPdf && pageImages.length > 0) {
                  firePaperTouchSound();
                }
              }}
              style={{
                maxWidth: `${bookMaxWidthPx}px`,
                transform: `translateX(${presentation.translateXPercent}%)`,
                clipPath: presentation.clipPath,
                transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), max-width 200ms ease',
              }}
              className="w-full mx-auto relative will-change-transform"
            >
              {/* StPageFlip Canvas Mount */}
              <div
                ref={stageHostRef}
                data-testid="stpageflip-host"
                className="w-full"
              />

              {/* Subtle Top Satin Couche Specular Glare Overlay (does not block mouse corner drags) */}
              <div
                aria-hidden="true"
                data-testid="zine-couche-texture"
                className="absolute inset-0 pointer-events-none z-30 opacity-20 mix-blend-screen zine-couche-sheen"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
