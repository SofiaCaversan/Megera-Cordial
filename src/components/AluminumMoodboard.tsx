import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Trash2,
  Download,
  Upload,
  Disc3,
  LayoutGrid,
  Play,
  Plus,
} from 'lucide-react';
import {
  CHARACTERS,
  INITIAL_BOARD_PRESETS,
  UNIFIED_MOODBOARD_LIBRARY,
  type ActTrack,
} from '../data/projectData';
import {
  arrangeItemsKnolling,
  clampBoardPosition,
  clampScale,
  getItemLayerPosition,
  moveItemLayerDown,
  moveItemLayerUp,
  normalizeRotation,
  type CharacterId,
  type MoodboardItemInstance,
  type MoodboardLibraryItem,
} from '../utils/moodboardLogic';
import { shouldHandleCanvasDeleteKey } from '../utils/keyboardShortcutLogic';
import { renderMetallicCdToOffscreenCanvas } from '../utils/moodboardCdCanvas';
import { BaroqueDisc } from './BaroqueDisc';

interface AluminumMoodboardProps {
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  tracks: ActTrack[];
  activeTrackIndex: number;
  isPlaying: boolean;
  onPlayActFromBoard: (actIndex: number) => void;
}

export const AluminumMoodboard: React.FC<AluminumMoodboardProps> = ({
  selectedCharacter,
  onSelectCharacter,
  tracks,
  activeTrackIndex,
  isPlaying,
  onPlayActFromBoard,
}) => {
  const [boards, setBoards] = useState<Record<CharacterId, MoodboardItemInstance[]>>(INITIAL_BOARD_PRESETS);
  const [customLibraryItems, setCustomLibraryItems] = useState<MoodboardLibraryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [cdActChoice, setCdActChoice] = useState<1 | 2 | 3>(1);
  const [isPlateDragOver, setIsPlateDragOver] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
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

  const activeItems = boards[selectedCharacter];
  const selectedItem = activeItems.find((it) => it.instanceId === selectedItemId) ?? null;
  const selectedLayerInfo = selectedItem
    ? getItemLayerPosition(activeItems, selectedItem.instanceId)
    : { layer: 0, total: 0 };
  const characterObj = CHARACTERS.find((c) => c.id === selectedCharacter) ?? CHARACTERS[0];

  // Unified PNG library available identically to all characters (user uploads + all numbered PNGs)
  const unifiedLibrary = [...customLibraryItems, ...UNIFIED_MOODBOARD_LIBRARY];

  const updateActiveBoard = (updater: (prev: MoodboardItemInstance[]) => MoodboardItemInstance[]) => {
    setBoards((prev) => ({
      ...prev,
      [selectedCharacter]: updater(prev[selectedCharacter]),
    }));
  };

  const placeImageOnBoard = (
    catalogId: string,
    label: string,
    imageUrl: string,
    targetPos?: { x: number; y: number }
  ) => {
    const newId = `inst-${catalogId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    updateActiveBoard((prev) => {
      const maxZ = prev.reduce((m, i) => Math.max(m, i.zIndex), 0);
      const offset = (prev.length % 6) * 4.5 - 8;
      const pos = targetPos
        ? clampBoardPosition(targetPos.x, targetPos.y)
        : clampBoardPosition(50 + offset, 48 + (prev.length % 4) * 4 - 4);

      return [
        ...prev,
        {
          instanceId: newId,
          catalogId,
          label,
          kind: 'upload',
          customImageUrl: imageUrl,
          x: pos.x,
          y: pos.y,
          rotation: 0,
          scale: 1,
          zIndex: maxZ + 1,
        },
      ];
    });
    setSelectedItemId(newId);
  };

  const handleOwnImageUpload = (file: File, targetPos?: { x: number; y: number }) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const label = file.name.replace(/\.[^.]+$/, '').slice(0, 22) || 'Imagem Própria';
    const customId = `own-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    setCustomLibraryItems((prev) => [
      { id: customId, label, imageUrl: url, isUserUpload: true },
      ...prev,
    ]);
    placeImageOnBoard(customId, label, url, targetPos);
  };

  const addCdToBoard = (actNum: 1 | 2 | 3 = cdActChoice, targetPos?: { x: number; y: number }) => {
    const track = tracks[actNum - 1];
    const newId = `cd-${actNum}-${Date.now()}`;
    const maxZ = activeItems.reduce((m, i) => Math.max(m, i.zIndex), 0);
    const pos = targetPos
      ? clampBoardPosition(targetPos.x, targetPos.y)
      : { x: 50, y: 50 };

    updateActiveBoard((prev) => [
      ...prev,
      {
        instanceId: newId,
        catalogId: `cd-act-${actNum}`,
        label: `CD ${track.actCode} (${track.actLabel})`,
        kind: 'cd',
        cdActNumber: actNum,
        x: pos.x,
        y: pos.y,
        rotation: -4,
        scale: 1.05,
        zIndex: maxZ + 1,
      },
    ]);
    setSelectedItemId(newId);
  };

  const handlePlateDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsPlateDragOver(false);
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const rect = boardEl.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // 1. Check if a CD from the drawer was dropped
    const cdActRaw = e.dataTransfer.getData('application/x-megera-cd');
    if (cdActRaw === '1' || cdActRaw === '2' || cdActRaw === '3') {
      addCdToBoard(Number(cdActRaw) as 1 | 2 | 3, { x: xPct, y: yPct });
      return;
    }

    // 2. Check if a unified library PNG item was dropped
    const libId = e.dataTransfer.getData('application/x-megera-library');
    if (libId) {
      const found = unifiedLibrary.find((entry) => entry.id === libId);
      if (found) {
        placeImageOnBoard(found.id, found.label, found.imageUrl, { x: xPct, y: yPct });
      }
      return;
    }

    // 3. Check if local PNG/image files were dropped from the desktop
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      files.forEach((f, idx) => {
        handleOwnImageUpload(f, { x: xPct + idx * 4, y: yPct + idx * 4 });
      });
    }
  };

  const handleItemPointerDown = (e: React.PointerEvent<HTMLDivElement>, item: MoodboardItemInstance) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    // Select item while preserving its current layer (zIndex)
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
    const boardEl = boardRef.current;
    if (!drag || !boardEl) return;

    const rect = boardEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100;
    const clamped = clampBoardPosition(drag.origX + dxPct, drag.origY + dyPct);

    updateActiveBoard((prev) =>
      prev.map((it) =>
        it.instanceId === drag.instanceId ? { ...it, x: clamped.x, y: clamped.y } : it
      )
    );
  };

  const handleItemPointerUp = () => {
    dragStateRef.current = null;
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLButtonElement>, item: MoodboardItemInstance) => {
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
    const delta = (e.clientX - rs.startClientX + (e.clientY - rs.startClientY)) / 160;
    const nextScale = clampScale(rs.origScale + delta);
    updateActiveBoard((prev) =>
      prev.map((it) => (it.instanceId === rs.instanceId ? { ...it, scale: nextScale } : it))
    );
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    resizeStateRef.current = null;
  };

  const adjustSelected = (patch: Partial<MoodboardItemInstance>) => {
    if (!selectedItemId) return;
    updateActiveBoard((prev) =>
      prev.map((it) => (it.instanceId === selectedItemId ? { ...it, ...patch } : it))
    );
  };

  const handleLayerUp = () => {
    if (!selectedItemId) return;
    updateActiveBoard((prev) => moveItemLayerUp(prev, selectedItemId));
  };

  const handleLayerDown = () => {
    if (!selectedItemId) return;
    updateActiveBoard((prev) => moveItemLayerDown(prev, selectedItemId));
  };

  const removeSelected = () => {
    if (!selectedItemId) return;
    updateActiveBoard((prev) => prev.filter((it) => it.instanceId !== selectedItemId));
    setSelectedItemId(null);
  };

  useEffect(() => {
    if (!selectedItemId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!shouldHandleCanvasDeleteKey(e.key, e.target)) return;
      e.preventDefault();
      setBoards((prev) => ({
        ...prev,
        [selectedCharacter]: prev[selectedCharacter].filter(
          (it) => it.instanceId !== selectedItemId
        ),
      }));
      setSelectedItemId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedItemId, selectedCharacter]);

  const handleKnolling = () => {
    updateActiveBoard((prev) => arrangeItemsKnolling(prev));
  };

  const handleClearBoard = () => {
    updateActiveBoard(() => []);
    setSelectedItemId(null);
  };

  const handleExportPng = async () => {
    setExportStatus('Gerando PNG...');
    try {
      const width = 1400;
      const height = 980;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      // Base brushed aluminum plate background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#B5BBC1');
      grad.addColorStop(0.28, '#E6E9EC');
      grad.addColorStop(0.54, '#B9BFC5');
      grad.addColorStop(0.78, '#EDF0F3');
      grad.addColorStop(1, '#AEB4BA');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Brushed horizontal grain lines
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 4 corner rivets
      const rivetOffsets = [
        [36, 36],
        [width - 36, 36],
        [36, height - 36],
        [width - 36, height - 36],
      ];
      for (const [rx, ry] of rivetOffsets) {
        ctx.beginPath();
        ctx.arc(rx, ry, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#F7F5F0';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#6D7379';
        ctx.stroke();
      }

      // Header stamp
      ctx.fillStyle = 'rgba(26,26,26,0.72)';
      ctx.font = '300 18px monospace';
      ctx.fillText(`MEGERA CORDIAL · MOODBOARD DE ${characterObj.name.toUpperCase()}`, 72, 44);

      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const sortedItems = [...activeItems].sort((a, b) => a.zIndex - b.zIndex);

      let cdLaceTexture: HTMLImageElement | null = null;
      if (sortedItems.some((it) => it.kind === 'cd')) {
        try {
          cdLaceTexture = await loadImage('/assets/aistudio/download__15__ac4ada36.jpg');
        } catch {
          cdLaceTexture = null;
        }
      }

      for (const item of sortedItems) {
        const px = (item.x / 100) * width;
        const py = (item.y / 100) * height;
        const baseSize = item.kind === 'cd' ? 190 : 175;
        const drawSize = baseSize * item.scale;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.shadowColor = 'rgba(0,0,0,0.34)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 6;
        ctx.shadowOffsetY = 10;

        if (item.kind === 'upload' && item.customImageUrl) {
          const img = await loadImage(item.customImageUrl);
          const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1;
          const drawW = aspect >= 1 ? drawSize : drawSize * aspect;
          const drawH = aspect >= 1 ? drawSize / aspect : drawSize;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else if (item.kind === 'cd') {
          const act = (item.cdActNumber ?? 1) as 1 | 2 | 3;
          const cdCanvas = renderMetallicCdToOffscreenCanvas(drawSize, act, cdLaceTexture);
          ctx.drawImage(cdCanvas, -cdCanvas.width / 2, -cdCanvas.height / 2);
        }
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `moodboard-megera-cordial-${selectedCharacter}.png`;
      link.href = dataUrl;
      link.click();
      setExportStatus('PNG exportado com sucesso.');
      setTimeout(() => setExportStatus(null), 2600);
    } catch {
      setExportStatus('Não foi possível exportar o PNG.');
    }
  };

  return (
    <div className="space-y-4 pt-6 border-t border-[#1A1A1A]/15">
      {/* Header + Character Selector */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[#2071B8]">
            Parte II · Placa Magnética de Alumínio Escovado
          </p>
          <h2 className="font-script text-4xl text-[#1A1A1A] leading-none mt-1">
            Moodboard Tátil &amp; Knolling
          </h2>
        </div>

        {/* Character Switcher */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Selecionar personagem do moodboard">
          {CHARACTERS.map((ch) => {
            const active = ch.id === selectedCharacter;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  onSelectCharacter(ch.id);
                  setSelectedItemId(null);
                }}
                aria-pressed={active}
                className={`px-3 py-1.5 text-xs font-mono-ui border transition-colors ${
                  active
                    ? 'bg-[#1A1A1A] text-[#F7F5F0] border-[#1A1A1A]'
                    : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/25 hover:bg-[#F7F5F0]'
                }`}
              >
                {ch.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editorial Instruction Strip */}
      <div
        data-testid="moodboard-instruction-banner"
        className="border border-[#1A1A1A] bg-[#F8CCE1]/40 px-4 py-3 shadow-[3px_3px_0_#1A1A1A]"
      >
        <p className="font-vintage text-[14.5px] sm:text-[15.5px] leading-[1.58] text-[#1A1A1A]">
          Leia o perfil dos personagens, faça seu moodboard da maneira com a qual você enxerga eles, baixe sua colagem e depois suba as fotos nos cards.
        </p>
      </div>

      {/* Board Elements & Actions Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 border border-[#1A1A1A]/20 bg-white">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-[#1A1A1A]/25 bg-[#F7F5F0]">
            <select
              value={cdActChoice}
              onChange={(e) => setCdActChoice(Number(e.target.value) as 1 | 2 | 3)}
              aria-label="Escolher ato do CD para colocar no moodboard"
              className="px-2 py-1.5 text-[11px] font-galix bg-transparent border-r border-[#1A1A1A]/20 focus:outline-none"
            >
              <option value={1}>CD 01 · ATO 1</option>
              <option value={2}>CD 02 · ATO 2</option>
              <option value={3}>CD 03 · ATO 3</option>
            </select>
            <button
              type="button"
              onClick={() => addCdToBoard(cdActChoice)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono-ui hover:bg-[#F8CCE1]/60"
            >
              <Disc3 className="w-3.5 h-3.5 text-[#2071B8]" />
              <span>Colocar CD</span>
            </button>
          </div>

          <label
            data-testid="upload-own-image-btn"
            className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#F8CCE1] hover:bg-[#f5bdd8] text-[#1A1A1A] transition-colors shadow-[2px_2px_0_#1A1A1A]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Subir Imagem Própria</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Subir imagem própria para o moodboard"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach((f) => handleOwnImageUpload(f));
                e.target.value = '';
              }}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleKnolling}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#E3CD32] text-[#1A1A1A] hover:bg-[#edd946]"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Organizar estilo Knolling</span>
          </button>

          <button
            type="button"
            onClick={handleClearBoard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A]/30 bg-white hover:bg-red-50 text-[#1A1A1A]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Board</span>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-ui border border-[#1A1A1A] bg-[#2071B8] text-white hover:bg-[#195e9b]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Moodboard (PNG)</span>
          </button>
        </div>
      </div>

      {exportStatus && (
        <p className="font-mono-ui text-xs text-[#2071B8]">{exportStatus}</p>
      )}

      {/* Workspace Grid: Left/Main = Brushed Aluminum Plate, Right = Unified PNG Library + Project CDs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Aluminum Plate Surface */}
        <div className="lg:col-span-8 space-y-2.5">
          <div
            ref={boardRef}
            onClick={() => setSelectedItemId(null)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsPlateDragOver(true);
            }}
            onDragLeave={() => setIsPlateDragOver(false)}
            onDrop={handlePlateDrop}
            data-testid="aluminum-moodboard-canvas"
            className={`relative w-full aspect-[16/11] min-h-[420px] brushed-aluminum border-2 shadow-[0_24px_45px_-18px_rgba(0,0,0,0.35)] overflow-hidden select-none touch-none transition-all ${
              isPlateDragOver ? 'border-[#2071B8] ring-4 ring-[#F8CCE1]/70' : 'border-[#7E858C]'
            }`}
            style={{
              backgroundImage: `url('/assets/aistudio/65b1a9fb-6da2-499a-80e1-cca4d36edf70_165a4d36.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* 4 Corner Physical Rivets */}
            {[
              'top-3 left-3',
              'top-3 right-3',
              'bottom-3 left-3',
              'bottom-3 right-3',
            ].map((pos) => (
              <span
                key={pos}
                aria-hidden="true"
                className={`absolute ${pos} w-3.5 h-3.5 rounded-full bg-[#F7F5F0] border-2 border-[#6D7379] shadow-inner pointer-events-none z-10`}
              />
            ))}

            {/* Subtle Stamped Character Header on Plate */}
            <div className="absolute bottom-3 left-10 right-10 flex items-center justify-between pointer-events-none z-10">
              <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/75 bg-white/70 px-2 py-0.5 backdrop-blur-xs">
                Arquivo Tátil · {characterObj.name} ({activeItems.length} itens)
              </span>
              <span className="hidden sm:inline font-mono-ui text-[10px] text-[#1A1A1A]/70 bg-white/70 px-2 py-0.5">
                Clique para selecionar · Arraste para posicionar
              </span>
            </div>

            {activeItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center pointer-events-none">
                <p className="font-vintage text-[13.5px] text-[#1A1A1A]/85 bg-white/88 px-4 py-3 border border-[#1A1A1A]/25 max-w-md leading-[1.62]">
                  Chapa de alumínio pronta para {characterObj.name}. Clique ou arraste qualquer recorte PNG da biblioteca ao lado — ou use “+ Subir Imagem Própria”.
                </p>
              </div>
            )}

            {/* Placed Cutout Items & CDs */}
            {activeItems.map((item) => {
              const isSelected = item.instanceId === selectedItemId;
              const cdTrack =
                item.kind === 'cd' ? tracks[(item.cdActNumber ?? 1) - 1] : null;
              const isCdPlaying =
                item.kind === 'cd' &&
                isPlaying &&
                activeTrackIndex === (item.cdActNumber ?? 1) - 1;

              return (
                <div
                  key={item.instanceId}
                  data-testid={`board-item-${item.instanceId}`}
                  data-zindex={item.zIndex}
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
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing group ${
                    isSelected
                      ? 'outline-2 outline-dashed outline-[#2071B8] outline-offset-4 rounded-xs'
                      : 'hover:outline-1 hover:outline-[#1A1A1A]/35 hover:outline-offset-2'
                  }`}
                >
                  <div className="drop-shadow-[5px_9px_10px_rgba(0,0,0,0.38)] relative">
                    {item.kind === 'upload' && item.customImageUrl && (
                      <img
                        src={item.customImageUrl}
                        alt={item.label}
                        draggable={false}
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain pointer-events-none"
                      />
                    )}

                    {item.kind === 'cd' && cdTrack && (
                      <div className="relative">
                        <BaroqueDisc
                          actNumber={cdTrack.actNumber}
                          actCode={cdTrack.actCode}
                          tint={cdTrack.discTint}
                          size={122}
                          spinning={isCdPlaying}
                        />
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayActFromBoard(cdTrack.actNumber - 1);
                          }}
                          aria-label={`Ouvir ${cdTrack.title} direto do moodboard`}
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 text-[9px] font-galix uppercase bg-[#1A1A1A] text-white border border-white/60 hover:bg-[#2071B8]"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Ouvir</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tactile Corner Resize Handle on Selected Element */}
                  {isSelected && (
                    <button
                      type="button"
                      data-testid="board-item-resize-handle"
                      aria-label={`Redimensionar ${item.label}`}
                      onPointerDown={(e) => handleResizePointerDown(e, item)}
                      onPointerMove={handleResizePointerMove}
                      onPointerUp={handleResizePointerUp}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-[#E3CD32] border border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center cursor-nwse-resize shadow-sm text-[10px] font-mono-ui leading-none"
                      title="Arraste para redimensionar"
                    >
                      ↘
                    </button>
                  )}
                </div>
              );
            })}

            {/* Floating Layer & Transform Control Bar when an Item is Selected */}
            {selectedItem && (
              <div
                data-testid="moodboard-floating-controls"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] w-max max-w-[92%] bg-[#F7F5F0]/96 backdrop-blur-xs border-2 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A] px-2.5 py-1.5 flex flex-wrap lg:flex-nowrap items-center justify-center gap-1.5"
              >
                <span className="font-mono-ui text-[10px] font-semibold text-[#1A1A1A] px-1.5 border-r border-[#1A1A1A]/20 whitespace-nowrap">
                  {selectedItem.label} · Camada {selectedLayerInfo.layer}/{selectedLayerInfo.total}
                </span>

                <button
                  type="button"
                  data-testid="layer-up-btn"
                  onClick={handleLayerUp}
                  disabled={selectedLayerInfo.layer >= selectedLayerInfo.total}
                  aria-label="Subir camada do item selecionado"
                  className="inline-flex items-center px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-[#E3CD32] hover:bg-[#edd946] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  <span>↑ Subir Camada</span>
                </button>

                <button
                  type="button"
                  data-testid="layer-down-btn"
                  onClick={handleLayerDown}
                  disabled={selectedLayerInfo.layer <= 1}
                  aria-label="Descer camada do item selecionado"
                  className="inline-flex items-center px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-white hover:bg-[#F8CCE1]/60 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                >
                  <span>↓ Descer Camada</span>
                </button>

                <div className="flex items-center border border-[#1A1A1A]/30 bg-white shrink-0">
                  <button
                    type="button"
                    data-testid="resize-down-btn"
                    onClick={() => adjustSelected({ scale: clampScale(selectedItem.scale - 0.15) })}
                    aria-label="Diminuir tamanho do item"
                    className="p-1 hover:bg-[#F7F5F0] border-r border-[#1A1A1A]/20 cursor-pointer"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                  <span className="px-1.5 font-mono-ui text-[10px] tabular-nums">
                    {Math.round(selectedItem.scale * 100)}%
                  </span>
                  <button
                    type="button"
                    data-testid="resize-up-btn"
                    onClick={() => adjustSelected({ scale: clampScale(selectedItem.scale + 0.15) })}
                    aria-label="Aumentar tamanho do item"
                    className="p-1 hover:bg-[#F7F5F0] border-l border-[#1A1A1A]/20 cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center border border-[#1A1A1A]/30 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustSelected({ rotation: normalizeRotation(selectedItem.rotation - 15) })}
                    aria-label="Girar item para a esquerda"
                    className="p-1 hover:bg-[#F7F5F0] border-r border-[#1A1A1A]/20 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustSelected({ rotation: normalizeRotation(selectedItem.rotation + 15) })}
                    aria-label="Girar item para a direita"
                    className="p-1 hover:bg-[#F7F5F0] cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="remove-item-btn"
                  onClick={removeSelected}
                  aria-label="Remover item selecionado do moodboard"
                  className="inline-flex items-center px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-red-700 whitespace-nowrap cursor-pointer"
                >
                  <span>✕ Remover</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Info Strip */}
          <div className="px-3 py-2 border border-[#1A1A1A]/20 bg-white flex flex-wrap items-center justify-between gap-2">
            {selectedItem ? (
              <span className="font-mono-ui text-[11px] text-[#1A1A1A]">
                Selecionado: <strong>{selectedItem.label}</strong> · Camada {selectedLayerInfo.layer} de {selectedLayerInfo.total} · {selectedItem.rotation}° · {Math.round(selectedItem.scale * 100)}%
              </span>
            ) : (
              <span className="font-mono-ui text-[11px] text-[#5C5952]">
                Clique em qualquer elemento na placa para abrir a barra flutuante de camadas, redimensionar ou remover.
              </span>
            )}
          </div>
        </div>

        {/* Right Sidebar: Unified PNG Library (All Characters) + Own Upload Slot + Project CDs */}
        <aside className="lg:col-span-4 border border-[#1A1A1A]/20 bg-white p-4 space-y-3.5">
          <div className="border-b border-[#1A1A1A]/15 pb-2.5 flex items-start justify-between gap-2">
            <div>
              <h3 className="font-mono-ui text-xs uppercase tracking-[0.14em] text-[#1A1A1A]">
                Biblioteca Unificada ({unifiedLibrary.length} PNGs)
              </h3>
              <p className="font-mono-ui text-[10px] text-[#5C5952] mt-0.5">
                Todos os recortes disponíveis para qualquer personagem · Clique ou arraste
              </p>
            </div>
          </div>

          {/* Dedicated "+ Subir Imagem Própria" Slot inside Elements Bar */}
          <label
            data-testid="sidebar-own-upload-slot"
            className="cursor-pointer w-full py-2 px-3 border border-dashed border-[#2071B8] bg-[#F8CCE1]/30 hover:bg-[#F8CCE1]/60 transition-colors flex items-center justify-center gap-2 text-center"
          >
            <Upload className="w-3.5 h-3.5 text-[#2071B8]" />
            <span className="font-mono-ui text-[11px] font-medium text-[#1A1A1A]">
              + Subir Imagem Própria
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Enviar imagem própria do computador para a colagem"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach((f) => handleOwnImageUpload(f));
                e.target.value = '';
              }}
            />
          </label>

          {/* Unified Scrollable Grid of All PNGs (1..45 + CD line art + user uploads) */}
          <div
            data-testid="unified-png-gallery"
            className="grid grid-cols-3 gap-2 max-h-[360px] overflow-y-auto pr-1 card-back-scroll"
          >
            {unifiedLibrary.map((entry) => (
              <button
                key={entry.id}
                type="button"
                draggable
                data-testid={`library-item-${entry.id}`}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-megera-library', entry.id);
                }}
                onClick={() => placeImageOnBoard(entry.id, entry.label, entry.imageUrl)}
                aria-label={`Adicionar ${entry.label} ao moodboard de ${characterObj.name}`}
                className={`group p-1.5 border bg-[#F7F5F0]/80 hover:border-[#1A1A1A] hover:bg-[#F8CCE1]/35 transition-colors flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing ${
                  entry.isUserUpload ? 'border-[#2071B8]' : 'border-[#1A1A1A]/15'
                }`}
              >
                <div className="w-full aspect-square flex items-center justify-center overflow-hidden bg-white/75 p-1">
                  <img
                    src={entry.imageUrl}
                    alt={entry.label}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="font-mono-ui text-[9px] leading-tight truncate w-full text-center text-[#1A1A1A]">
                  {entry.label}
                </span>
              </button>
            ))}
          </div>

          {/* Draggable / Clickable Project CDs */}
          <div className="pt-3 border-t border-[#1A1A1A]/15 space-y-2">
            <div>
              <h4 className="font-mono-ui text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]">
                CDs do Projeto
              </h4>
              <p className="font-mono-ui text-[10px] text-[#5C5952]">
                Arraste para a chapa de alumínio ou clique
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {tracks.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-megera-cd', String(tr.actNumber));
                  }}
                  onClick={() => addCdToBoard(tr.actNumber)}
                  aria-label={`Arrastar ou adicionar CD ${tr.actCode} ao moodboard`}
                  className="p-2 border border-[#1A1A1A]/20 bg-[#F7F5F0]/75 hover:border-[#1A1A1A] hover:bg-[#F8CCE1]/30 transition-colors flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing"
                >
                  <BaroqueDisc
                    actNumber={tr.actNumber}
                    actCode={tr.actCode}
                    tint={tr.discTint}
                    size={46}
                  />
                  <span className="font-galix text-[10px] text-[#1A1A1A]">
                    CD {tr.actCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
