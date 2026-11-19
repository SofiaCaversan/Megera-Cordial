import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FlipHorizontal2,
  Loader2,
  PenTool,
  RotateCcw,
  RotateCw,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  SALA_TERAPIA_ASSETS,
  SALA_TERAPIA_BACKGROUND,
  clampRoomPosition,
  clampRoomScale,
  getRoomItemLayerPosition,
  moveRoomItemLayerDown,
  moveRoomItemLayerUp,
  normalizeRoomRotation,
  toggleRoomItemFlip,
  type TherapyCatalogItem,
  type TherapyCropBox,
  type TherapyRoomItemInstance,
} from '../utils/therapyRoomLogic';
import { shouldHandleCanvasDeleteKey } from '../utils/keyboardShortcutLogic';

type LibraryFilter = 'all' | 'furniture' | 'architecture';

interface CroppedAssetImageProps {
  src: string;
  alt: string;
  cropBox?: TherapyCropBox;
  blendMode?: 'normal' | 'lighten';
  className?: string;
}

const CroppedAssetImage: React.FC<CroppedAssetImageProps> = ({
  src,
  alt,
  cropBox,
  blendMode = 'normal',
  className = '',
}) => {
  const mixStyle: React.CSSProperties = {
    mixBlendMode: blendMode,
  };

  if (!cropBox) {
    return (
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={mixStyle}
        className={`w-full h-full object-contain pointer-events-none select-none ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{
        aspectRatio: `${cropBox.w} / ${cropBox.h}`,
        ...mixStyle,
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        style={{
          position: 'absolute',
          maxWidth: 'none',
          width: `${(cropBox.canvasWidth / cropBox.w) * 100}%`,
          height: `${(cropBox.canvasHeight / cropBox.h) * 100}%`,
          left: `${-(cropBox.x / cropBox.w) * 100}%`,
          top: `${-(cropBox.y / cropBox.h) * 100}%`,
        }}
        className="pointer-events-none select-none"
      />
    </div>
  );
};

export const TherapyRoomSection: React.FC = () => {
  const [placedItems, setPlacedItems] = useState<TherapyRoomItemInstance[]>([]);
  const [aiLibraryItems, setAiLibraryItems] = useState<TherapyCatalogItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>('all');
  const [isRoomDragOver, setIsRoomDragOver] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // AI furniture generator state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const roomRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    instanceId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const resizeStateRef = useRef<{
    instanceId: string;
    startClientX: number;
    startClientY: number;
    origScale: number;
  } | null>(null);

  const fullLibrary = [...aiLibraryItems, ...SALA_TERAPIA_ASSETS];
  const filteredLibrary = fullLibrary.filter((item) =>
    libraryFilter === 'all' ? true : item.category === libraryFilter
  );

  const selectedItem = placedItems.find((it) => it.instanceId === selectedItemId) ?? null;
  const selectedLayerInfo = selectedItem
    ? getRoomItemLayerPosition(placedItems, selectedItem.instanceId)
    : { layer: 0, total: 0 };

  const placeCatalogItem = (
    catalogItem: TherapyCatalogItem,
    targetPos?: { x: number; y: number }
  ) => {
    const newId = `room-${catalogItem.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setPlacedItems((prev) => {
      const maxZ = prev.reduce((m, i) => Math.max(m, i.zIndex), 0);
      const offsetX = ((prev.length % 5) - 2) * 11;
      const offsetY = ((prev.length % 3) - 1) * 7;
      const pos = targetPos
        ? clampRoomPosition(targetPos.x, targetPos.y)
        : catalogItem.defaultPos
          ? clampRoomPosition(catalogItem.defaultPos.x, catalogItem.defaultPos.y)
          : clampRoomPosition(50 + offsetX, 64 + offsetY);

      return [
        ...prev,
        {
          instanceId: newId,
          catalogId: catalogItem.id,
          label: catalogItem.label,
          imageUrl: catalogItem.imageUrl,
          cropBox: catalogItem.cropBox,
          x: pos.x,
          y: pos.y,
          scale: catalogItem.defaultScale ?? 1,
          rotation: 0,
          flipped: false,
          zIndex: maxZ + 1,
          isAiGenerated: catalogItem.isAiGenerated,
          blendMode: catalogItem.blendMode ?? 'normal',
        },
      ];
    });
    setSelectedItemId(newId);
  };

  const handleRoomDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsRoomDragOver(false);
    const roomEl = roomRef.current;
    if (!roomEl) return;

    const libId = e.dataTransfer.getData('application/x-megera-therapy-item');
    if (!libId) return;

    const found = fullLibrary.find((entry) => entry.id === libId);
    if (!found) return;

    const rect = roomEl.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    placeCatalogItem(found, { x: xPct, y: yPct });
  };

  const handleItemPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    item: TherapyRoomItemInstance
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedItemId(item.instanceId);

    dragStateRef.current = {
      instanceId: item.instanceId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: item.x,
      origY: item.y,
    };
  };

  const handleItemPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const roomEl = roomRef.current;
    if (!drag || !roomEl) return;

    const rect = roomEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100;
    const clamped = clampRoomPosition(drag.origX + dxPct, drag.origY + dyPct);

    setPlacedItems((prev) =>
      prev.map((it) =>
        it.instanceId === drag.instanceId ? { ...it, x: clamped.x, y: clamped.y } : it
      )
    );
  };

  const handleItemPointerUp = () => {
    dragStateRef.current = null;
  };

  const handleResizePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    item: TherapyRoomItemInstance
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedItemId(item.instanceId);
    resizeStateRef.current = {
      instanceId: item.instanceId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origScale: item.scale,
    };
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rs = resizeStateRef.current;
    if (!rs) return;
    e.stopPropagation();
    const delta = (e.clientX - rs.startClientX + (e.clientY - rs.startClientY)) / 150;
    const nextScale = clampRoomScale(rs.origScale + delta);
    setPlacedItems((prev) =>
      prev.map((it) => (it.instanceId === rs.instanceId ? { ...it, scale: nextScale } : it))
    );
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    resizeStateRef.current = null;
  };

  const adjustSelected = (patch: Partial<TherapyRoomItemInstance>) => {
    if (!selectedItemId) return;
    setPlacedItems((prev) =>
      prev.map((it) => (it.instanceId === selectedItemId ? { ...it, ...patch } : it))
    );
  };

  useEffect(() => {
    if (!selectedItemId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!shouldHandleCanvasDeleteKey(e.key, e.target)) return;
      e.preventDefault();
      setPlacedItems((prev) => prev.filter((it) => it.instanceId !== selectedItemId));
      setSelectedItemId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedItemId]);

  const handleGenerateAiFurniture = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = aiPromptInput.trim();
    if (!trimmed) {
      setAiError('Digite qual objeto ou móvel deseja desenhar.');
      return;
    }

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/therapy-room/generate-furniture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectName: trimmed }),
      });

      const payload = (await response.json()) as {
        id?: string;
        label?: string;
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.imageUrl) {
        setAiError(payload.error || 'Não foi possível gerar o móvel com IA.');
        return;
      }

      const newCatalogItem: TherapyCatalogItem = {
        id: payload.id || `ai-${Date.now()}`,
        fileName: 'ai-generated.svg',
        label: payload.label || trimmed,
        category: 'furniture',
        imageUrl: payload.imageUrl,
        defaultScale: 1.15,
        isAiGenerated: true,
        blendMode: 'normal',
      };

      setAiLibraryItems((prev) => [newCatalogItem, ...prev]);
      placeCatalogItem(newCatalogItem, { x: 50, y: 56 });
      setAiPromptInput('');
      setIsAiDrawerOpen(false);
    } catch {
      setAiError('Erro de conexão ao chamar o gerador de móveis.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleExportPng = async () => {
    setExportStatus('Gerando PNG da Sala...');
    try {
      const width = 1771;
      const height = 1257;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      ctx.fillStyle = '#E3CD32';
      ctx.fillRect(0, 0, width, height);

      const bgImg = await loadImage(SALA_TERAPIA_BACKGROUND.imageUrl);
      ctx.drawImage(bgImg, 0, 0, width, height);

      const sorted = [...placedItems].sort((a, b) => a.zIndex - b.zIndex);
      for (const item of sorted) {
        const img = await loadImage(item.imageUrl);
        const px = (item.x / 100) * width;
        const py = (item.y / 100) * height;
        const baseBox = 240;

        const sx = item.cropBox ? item.cropBox.x : 0;
        const sy = item.cropBox ? item.cropBox.y : 0;
        const sw = item.cropBox ? item.cropBox.w : img.naturalWidth || 320;
        const sh = item.cropBox ? item.cropBox.h : img.naturalHeight || 320;

        const aspect = sw / sh || 1;
        const drawW = (aspect >= 1 ? baseBox : baseBox * aspect) * item.scale;
        const drawH = (aspect >= 1 ? baseBox / aspect : baseBox) * item.scale;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((item.rotation * Math.PI) / 180);
        if (item.flipped) {
          ctx.scale(-1, 1);
        }
        if (item.blendMode === 'lighten') {
          ctx.globalCompositeOperation = 'lighten';
        }
        ctx.drawImage(img, sx, sy, sw, sh, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'sala-terapia-megera-cordial.png';
      link.href = dataUrl;
      link.click();

      setExportStatus('Sala exportada em PNG com sucesso.');
      setTimeout(() => setExportStatus(null), 2600);
    } catch {
      setExportStatus('Não foi possível exportar a sala.');
    }
  };

  return (
    <section
      aria-labelledby="therapy-room-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-5"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#1A1A1A]/15 pb-4">
        <div>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[#2071B8]">
            Cenário Interativo · Colagem em Perspectiva
          </p>
          <h1 id="therapy-room-heading" className="font-script text-5xl text-[#1A1A1A] leading-none mt-1">
            Sala de Terapia
          </h1>
        </div>

        <p className="font-mono-ui text-[11px] text-[#5C5952] max-w-md lg:text-right">
          Combine móveis ilustrados à mão, janelas e objetos gerados por IA na perspectiva do consultório.
        </p>
      </div>

      {/* Editorial Instruction Strip */}
      <div
        data-testid="therapy-instruction-banner"
        className="border border-[#1A1A1A] bg-[#F8CCE1]/40 px-4 py-3 shadow-[3px_3px_0_#1A1A1A]"
      >
        <p className="font-vintage text-[15px] sm:text-[16px] leading-[1.58] text-[#1A1A1A]">
          Monte a sala de terapia da maneira que você imagina.
        </p>
      </div>

      {/* Toolbar */}
      <div className="border border-[#1A1A1A]/20 bg-white p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="ai-furniture-toggle-btn"
              onClick={() => {
                setIsAiDrawerOpen((prev) => !prev);
                setAiError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#E3CD32] hover:bg-[#edd946] text-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A] cursor-pointer transition-colors"
            >
              <PenTool className="w-3.5 h-3.5 text-[#2071B8]" />
              <span>+ Criar Móvel com IA</span>
            </button>

            <span className="font-mono-ui text-[10px] text-[#5C5952] hidden sm:inline">
              {placedItems.length} {placedItems.length === 1 ? 'peça na sala' : 'peças na sala'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="clear-room-btn"
              onClick={() => {
                setPlacedItems([]);
                setSelectedItemId(null);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A]/30 bg-white hover:bg-red-50 text-[#1A1A1A] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Sala</span>
            </button>

            <button
              type="button"
              data-testid="export-room-png-btn"
              onClick={handleExportPng}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#2071B8] hover:bg-[#195e9b] text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Sala (PNG)</span>
            </button>
          </div>
        </div>

        {/* Inline AI Furniture Generator Panel */}
        {isAiDrawerOpen && (
          <form
            data-testid="ai-furniture-drawer"
            onSubmit={handleGenerateAiFurniture}
            className="border-t border-[#1A1A1A]/15 pt-3 space-y-2"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                data-testid="ai-furniture-input"
                value={aiPromptInput}
                onChange={(e) => {
                  setAiPromptInput(e.target.value);
                  if (aiError) setAiError(null);
                }}
                placeholder='Digite o objeto (ex: "uma mesa de centro", "um gato dormindo", "um divã")'
                aria-label="Descreva o móvel ou objeto para criar com IA"
                disabled={isGeneratingAi}
                className="flex-1 px-3 py-2 text-xs font-vintage bg-[#F7F5F0] border border-[#1A1A1A]/30 text-[#1A1A1A] focus:outline-none focus:border-[#2071B8]"
              />
              <button
                type="submit"
                data-testid="ai-furniture-submit-btn"
                disabled={isGeneratingAi}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#2071B8] disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Desenhando móvel...</span>
                  </>
                ) : (
                  <span>Gerar Móvel</span>
                )}
              </button>
            </div>

            <p className="font-mono-ui text-[10px] text-[#5C5952]">
              Estilo automático do zine: traço em giz azul (#2071B8) com detalhes em rosa (#F8CCE1) em perspectiva.
            </p>

            {aiError && (
              <p
                data-testid="ai-furniture-error"
                className="font-mono-ui text-[11px] text-[#A84B70] bg-[#F8CCE1]/25 border border-[#A84B70]/40 px-2.5 py-1.5"
              >
                {aiError}
              </p>
            )}
          </form>
        )}
      </div>

      {exportStatus && (
        <p className="font-mono-ui text-xs text-[#2071B8]">{exportStatus}</p>
      )}

      {/* Main Workspace: Left = Perspective Room Stage, Right = Furniture Library */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Interactive Perspective Room Stage */}
        <div className="lg:col-span-8 space-y-2.5">
          <div
            ref={roomRef}
            data-testid="therapy-room-canvas"
            onClick={() => setSelectedItemId(null)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsRoomDragOver(true);
            }}
            onDragLeave={() => setIsRoomDragOver(false)}
            onDrop={handleRoomDrop}
            className={`relative w-full aspect-[3542/2514] bg-[#E3CD32] border-2 overflow-hidden select-none touch-none shadow-[0_24px_45px_-18px_rgba(0,0,0,0.3)] transition-all ${
              isRoomDragOver ? 'border-[#2071B8] ring-4 ring-[#F8CCE1]/80' : 'border-[#1A1A1A]'
            }`}
          >
            {/* Official Real Perspective Room Image */}
            <img
              src={SALA_TERAPIA_BACKGROUND.imageUrl}
              alt="Cenário oficial da Sala de Terapia em perspectiva"
              data-testid="therapy-room-bg-image"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />

            {/* Subtle Room Corner Status Tags */}
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <span className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/80 bg-[#F7F5F0]/80 px-2 py-0.5">
                Consultório · {placedItems.length} {placedItems.length === 1 ? 'móvel' : 'móveis'}
              </span>
              <span className="hidden sm:inline font-mono-ui text-[10px] text-[#1A1A1A]/75 bg-[#F7F5F0]/80 px-2 py-0.5">
                Clique para selecionar · Arraste para posicionar
              </span>
            </div>

            {placedItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none">
                <p className="font-vintage text-[14px] text-[#1A1A1A] bg-[#F7F5F0]/90 px-4 py-3 border border-[#1A1A1A]/30 max-w-md leading-[1.6]">
                  Escolha móveis, janelas e tapetes na biblioteca ao lado — ou crie objetos inéditos com o botão “+ Criar Móvel com IA”.
                </p>
              </div>
            )}

            {/* Placed Furniture Instances */}
            {placedItems.map((item) => {
              const isSelected = item.instanceId === selectedItemId;
              const aspectRatio = item.cropBox
                ? `${item.cropBox.w} / ${item.cropBox.h}`
                : '1 / 1';

              return (
                <div
                  key={item.instanceId}
                  data-testid={`room-item-${item.instanceId}`}
                  data-zindex={item.zIndex}
                  data-flipped={String(item.flipped)}
                  onPointerDown={(e) => handleItemPointerDown(e, item)}
                  onPointerMove={handleItemPointerMove}
                  onPointerUp={handleItemPointerUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(item.instanceId);
                  }}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    zIndex: item.zIndex,
                    width: '175px',
                    aspectRatio,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'outline-2 outline-dashed outline-[#2071B8] outline-offset-4 rounded-xs'
                      : 'hover:outline-1 hover:outline-[#1A1A1A]/40 hover:outline-offset-2'
                  }`}
                >
                  <div
                    className="w-full h-full relative"
                    style={{
                      transform: item.flipped ? 'scaleX(-1)' : 'none',
                    }}
                  >
                    <CroppedAssetImage
                      src={item.imageUrl}
                      alt={item.label}
                      cropBox={item.cropBox}
                      blendMode={item.blendMode}
                    />
                  </div>

                  {isSelected && (
                    <button
                      type="button"
                      data-testid="room-item-resize-handle"
                      aria-label={`Redimensionar ${item.label}`}
                      onPointerDown={(e) => handleResizePointerDown(e, item)}
                      onPointerMove={handleResizePointerMove}
                      onPointerUp={handleResizePointerUp}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-[#F8CCE1] border border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center cursor-nwse-resize shadow-sm text-[10px] font-mono-ui leading-none"
                      title="Arraste para redimensionar"
                    >
                      ↘
                    </button>
                  )}
                </div>
              );
            })}

          </div>

          {selectedItem ? (
            <div
              data-testid="room-floating-controls"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F7F5F0] border-2 border-[#1A1A1A] shadow-[3px_3px_0_#1A1A1A] px-2.5 py-2 flex flex-wrap items-center justify-between gap-1.5"
            >
              <span className="font-mono-ui text-[10px] font-semibold text-[#1A1A1A] px-1.5 border-r border-[#1A1A1A]/20 whitespace-nowrap">
                {selectedItem.label} · {selectedLayerInfo.layer}/{selectedLayerInfo.total}
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  data-testid="room-layer-up-btn"
                  onClick={() =>
                    setPlacedItems((prev) => moveRoomItemLayerUp(prev, selectedItem.instanceId))
                  }
                  disabled={selectedLayerInfo.layer >= selectedLayerInfo.total}
                  aria-label="Subir camada do móvel selecionado"
                  className="inline-flex items-center px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-[#E3CD32] hover:bg-[#edd946] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  ↑ Subir Camada
                </button>

                <button
                  type="button"
                  data-testid="room-layer-down-btn"
                  onClick={() =>
                    setPlacedItems((prev) => moveRoomItemLayerDown(prev, selectedItem.instanceId))
                  }
                  disabled={selectedLayerInfo.layer <= 1}
                  aria-label="Descer camada do móvel selecionado"
                  className="inline-flex items-center px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-white hover:bg-[#F8CCE1]/60 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  ↓ Descer Camada
                </button>

                <button
                  type="button"
                  data-testid="room-flip-btn"
                  onClick={() =>
                    setPlacedItems((prev) => toggleRoomItemFlip(prev, selectedItem.instanceId))
                  }
                  aria-pressed={selectedItem.flipped}
                  aria-label="Espelhar móvel horizontalmente"
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] whitespace-nowrap cursor-pointer transition-colors ${
                    selectedItem.flipped
                      ? 'bg-[#2071B8] text-white'
                      : 'bg-[#F8CCE1]/70 text-[#1A1A1A] hover:bg-[#F8CCE1]'
                  }`}
                >
                  <FlipHorizontal2 className="w-3 h-3" />
                  <span>Espelhar</span>
                </button>

                <div className="flex items-center border border-[#1A1A1A]/30 bg-white shrink-0">
                  <button
                    type="button"
                    data-testid="room-resize-down-btn"
                    onClick={() =>
                      adjustSelected({ scale: clampRoomScale(selectedItem.scale - 0.15) })
                    }
                    aria-label="Diminuir tamanho do móvel"
                    className="p-1 hover:bg-[#F7F5F0] border-r border-[#1A1A1A]/20 cursor-pointer"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 font-mono-ui text-[10px] tabular-nums">
                    {Math.round(selectedItem.scale * 100)}%
                  </span>
                  <button
                    type="button"
                    data-testid="room-resize-up-btn"
                    onClick={() =>
                      adjustSelected({ scale: clampRoomScale(selectedItem.scale + 0.15) })
                    }
                    aria-label="Aumentar tamanho do móvel"
                    className="p-1 hover:bg-[#F7F5F0] border-l border-[#1A1A1A]/20 cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center border border-[#1A1A1A]/30 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      adjustSelected({ rotation: normalizeRoomRotation(selectedItem.rotation - 10) })
                    }
                    aria-label="Inclinar móvel para a esquerda"
                    className="p-1 hover:bg-[#F7F5F0] border-r border-[#1A1A1A]/20 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      adjustSelected({ rotation: normalizeRoomRotation(selectedItem.rotation + 10) })
                    }
                    aria-label="Inclinar móvel para a direita"
                    className="p-1 hover:bg-[#F7F5F0] cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="room-remove-item-btn"
                  onClick={() => {
                    setPlacedItems((prev) =>
                      prev.filter((it) => it.instanceId !== selectedItem.instanceId)
                    );
                    setSelectedItemId(null);
                  }}
                  aria-label="Remover móvel selecionado da sala"
                  className="inline-flex items-center px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-red-700 whitespace-nowrap cursor-pointer"
                >
                  ✕ Remover
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 border border-[#1A1A1A]/20 bg-white">
              <span className="font-mono-ui text-[11px] text-[#5C5952]">
                Clique em qualquer móvel na sala para espelhar na perspectiva, redimensionar ou ajustar a camada.
              </span>
            </div>
          )}
        </div>

        {/* Right Sidebar: Exclusive Sala de Terapia Furniture Library */}
        <aside className="lg:col-span-4 border border-[#1A1A1A]/20 bg-white p-4 space-y-3.5">
          <div className="border-b border-[#1A1A1A]/15 pb-2.5 space-y-2">
            <div>
              <h2 className="font-mono-ui text-xs uppercase tracking-[0.14em] text-[#1A1A1A]">
                Biblioteca de Móveis ({fullLibrary.length})
              </h2>
              <p className="font-mono-ui text-[10px] text-[#5C5952] mt-0.5">
                Acervo exclusivo da Sala de Terapia · Clique ou arraste
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F7F5F0] p-1 border border-[#1A1A1A]/15">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'furniture', label: 'Móveis' },
                  { id: 'architecture', label: 'Janelas & Tapete' },
                ] as const
              ).map((tab) => {
                const active = libraryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setLibraryFilter(tab.id)}
                    className={`flex-1 py-1 px-2 text-[10px] font-mono-ui whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-[#5C5952] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            data-testid="therapy-furniture-library"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1 card-back-scroll"
          >
            {filteredLibrary.map((entry) => (
              <button
                key={entry.id}
                type="button"
                draggable
                data-testid={`therapy-lib-item-${entry.id}`}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-megera-therapy-item', entry.id);
                }}
                onClick={() => placeCatalogItem(entry)}
                aria-label={`Adicionar ${entry.label} à Sala de Terapia`}
                className={`group p-2 border bg-[#F7F5F0]/80 hover:border-[#1A1A1A] hover:bg-[#E3CD32]/30 transition-colors flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing ${
                  entry.isAiGenerated ? 'border-[#A84B70]' : 'border-[#1A1A1A]/15'
                }`}
              >
                <div className="w-full h-24 flex items-center justify-center overflow-hidden bg-[#E3CD32]/55 p-1.5 border border-[#1A1A1A]/10">
                  <div
                    className="max-w-full max-h-full flex items-center justify-center"
                    style={{
                      width: entry.cropBox && entry.cropBox.w >= entry.cropBox.h ? '88px' : undefined,
                      height: !entry.cropBox || entry.cropBox.h > entry.cropBox.w ? '80px' : undefined,
                    }}
                  >
                    <CroppedAssetImage
                      src={entry.imageUrl}
                      alt={entry.label}
                      cropBox={entry.cropBox}
                      blendMode={entry.blendMode}
                    />
                  </div>
                </div>
                <span className="font-mono-ui text-[10px] leading-tight truncate w-full text-center text-[#1A1A1A]">
                  {entry.label}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
};
