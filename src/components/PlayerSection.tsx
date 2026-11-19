import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Settings,
  Upload,
  RotateCcw,
  Disc3,
  Move3d,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import type { ActTrack } from '../data/projectData';
import { formatPlaybackTime } from '../utils/formatTime';
import {
  INITIAL_CD_CASE_OPEN,
  computeDragRotation,
  computeFlip180Target,
  getCoverArtForAct,
  getLidTransformState,
  isBackSideVisible,
  nextShelfSelection,
  normalizeAngle360,
} from '../utils/cdCaseLogic';
import { playCdCaseSound } from '../utils/audioEngine';
import { BaroqueDisc } from './BaroqueDisc';

interface PlayerSectionProps {
  tracks: ActTrack[];
  activeTrackIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  analyser: AnalyserNode | null;
  onSelectTrack: (index: number, autoPlay?: boolean) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onUploadTrackAudio: (index: number, file: File) => void;
  onResetTrackAudio: (index: number) => void;
  onNavigateTab: (tab: 'zine' | 'characters' | 'about') => void;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({
  tracks,
  activeTrackIndex,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  analyser,
  onSelectTrack,
  onTogglePlay,
  onStop,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onUploadTrackAudio,
  onResetTrackAudio,
  onNavigateTab,
}) => {
  const activeTrack = tracks[activeTrackIndex];
  const effectiveDuration = duration > 0 ? duration : activeTrack.durationSeconds;

  const [inspectedIndex, setInspectedIndex] = useState<number>(activeTrackIndex);
  const [caseOpened, setCaseOpened] = useState<boolean>(INITIAL_CD_CASE_OPEN);
  const [cdSoundStats, setCdSoundStats] = useState<{ count: number; lastAction: 'open' | 'close' | null }>({
    count: 0,
    lastAction: null,
  });
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: -3, y: 6 });
  const [hoverTilt, setHoverTilt] = useState<{ rx: number; ry: number; gx: number; gy: number }>({
    rx: 0,
    ry: 0,
    gx: 35,
    gy: 30,
  });
  const [isDraggingCase, setIsDraggingCase] = useState<boolean>(false);
  const [showGearPanel, setShowGearPanel] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startRotX: number;
    startRotY: number;
    didDrag: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startRotX: -3,
    startRotY: 6,
    didDrag: false,
  });
  const suppressClickRef = useRef<boolean>(false);

  const inspectedTrack = tracks[inspectedIndex];
  const inspectedCover = getCoverArtForAct(inspectedTrack.actNumber);
  const lidTransform = getLidTransformState(caseOpened);
  const showingBack = isBackSideVisible(rotation.y);

  const applyCdCaseState = (nextOpen: boolean) => {
    setCaseOpened(nextOpen);
    const action: 'open' | 'close' = nextOpen ? 'open' : 'close';
    playCdCaseSound(action);
    setCdSoundStats((prev) => ({ count: prev.count + 1, lastAction: action }));
  };

  const toggleCdCase = () => {
    if (showingBack) return;
    applyCdCaseState(!caseOpened);
  };

  const handleFlip180 = () => {
    const { targetRotateY, showingBack: nextBack } = computeFlip180Target(rotation.y);
    if (nextBack && caseOpened) {
      applyCdCaseState(false);
    }
    setRotation({ x: -3, y: targetRotateY });
  };

  const activeDragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setInspectedIndex(activeTrackIndex);
  }, [activeTrackIndex]);

  useEffect(() => {
    return () => {
      activeDragCleanupRef.current?.();
    };
  }, []);

  // Real-time Web Audio API spectrum & waveform canvas visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const freqData = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(64);
    let phase = 0;

    const renderFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle WMP ambient backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0C1726');
      bgGrad.addColorStop(1, '#162942');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      let hasLiveAudioSignal = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(freqData);
        for (let i = 0; i < freqData.length; i++) {
          if (freqData[i] > 2) {
            hasLiveAudioSignal = true;
            break;
          }
        }
      }

      const barCount = 36;
      const barWidth = (width - 24) / barCount;
      phase += isPlaying ? 0.08 : 0.015;

      for (let i = 0; i < barCount; i++) {
        let magnitude = 0.08;
        if (hasLiveAudioSignal) {
          const sample = freqData[Math.min(freqData.length - 1, Math.floor((i / barCount) * (freqData.length * 0.75)))];
          magnitude = Math.max(0.08, sample / 255);
        } else if (isPlaying) {
          magnitude =
            0.22 +
            0.35 * Math.abs(Math.sin(phase + i * 0.34)) +
            0.2 * Math.abs(Math.cos(phase * 0.7 - i * 0.18));
        } else {
          magnitude = 0.07 + 0.05 * Math.abs(Math.sin(phase + i * 0.25));
        }

        const barH = Math.max(4, magnitude * (height - 26));
        const x = 12 + i * barWidth;
        const y = height - 10 - barH;

        const barGrad = ctx.createLinearGradient(0, y, 0, height - 10);
        if (activeTrack.discTint === 'pink') {
          barGrad.addColorStop(0, '#F8CCE1');
          barGrad.addColorStop(0.55, '#E3CD32');
          barGrad.addColorStop(1, '#2071B8');
        } else if (activeTrack.discTint === 'gold') {
          barGrad.addColorStop(0, '#FFF5B8');
          barGrad.addColorStop(0.55, '#E3CD32');
          barGrad.addColorStop(1, '#2071B8');
        } else {
          barGrad.addColorStop(0, '#A5D4FA');
          barGrad.addColorStop(0.55, '#2071B8');
          barGrad.addColorStop(1, '#F8CCE1');
        }

        ctx.fillStyle = barGrad;
        ctx.fillRect(x, y, Math.max(2, barWidth - 3), barH);
      }

      // Thin oscilloscope line across middle
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(248, 204, 225, 0.55)';
      ctx.lineWidth = 1.25;
      for (let x = 0; x <= width; x += 6) {
        const amp = isPlaying ? 8 : 2;
        const y = height * 0.36 + Math.sin(phase * 1.4 + x * 0.04) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [analyser, isPlaying, activeTrack.discTint]);

  const handleDiscPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    activeDragCleanupRef.current?.();
    suppressClickRef.current = false;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startRotX: rotation.x,
      startRotY: rotation.y,
      didDrag: false,
    };
    setIsDraggingCase(true);

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current.active) return;
      const dist = Math.hypot(
        ev.clientX - dragRef.current.startX,
        ev.clientY - dragRef.current.startY
      );
      if (dist > 5) {
        dragRef.current.didDrag = true;
        suppressClickRef.current = true;
      }
      const next = computeDragRotation({
        startX: dragRef.current.startX,
        currentX: ev.clientX,
        startY: dragRef.current.startY,
        currentY: ev.clientY,
        startRotateY: dragRef.current.startRotY,
        startRotateX: dragRef.current.startRotX,
      });
      setRotation({ x: next.rotateX, y: next.rotateY });
      setHoverTilt((prev) => ({
        ...prev,
        gx: Math.round(normalizeAngle360(next.rotateY) % 100),
      }));
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      activeDragCleanupRef.current = null;
    };

    const onUp = () => {
      dragRef.current.active = false;
      setIsDraggingCase(false);
      cleanup();
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 60);
    };

    activeDragCleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleDiscPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setHoverTilt({
      rx: (0.5 - ny) * 12,
      ry: (nx - 0.5) * 14,
      gx: Math.round(nx * 100),
      gy: Math.round(ny * 100),
    });
  };

  const resetDiscTilt = () => {
    if (dragRef.current.active) return;
    setHoverTilt({ rx: 0, ry: 0, gx: 35, gy: 30 });
  };

  const handleSelectShelfDisc = (idx: number) => {
    const next = nextShelfSelection(inspectedIndex, idx, caseOpened);
    setInspectedIndex(next.inspectedIndex);
    if (next.caseOpened !== caseOpened) {
      applyCdCaseState(next.caseOpened);
    } else {
      setCaseOpened(next.caseOpened);
    }
  };

  return (
    <section aria-labelledby="player-heading" className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24">
      {/* Editorial Intro Header */}
      <div className="border-b border-[#1A1A1A]/15 pb-4 mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.22em] text-[#2071B8]">
            ÁUDIO-FICÇÃO
          </p>
          <h1 id="player-heading" className="font-script text-5xl sm:text-6xl text-[#1A1A1A] leading-[0.95] mt-1">
            Megera Cordial
          </h1>
        </div>
        <div className="max-w-md flex flex-col sm:items-end gap-2">
          <p className="font-vintage text-[13.5px] text-[#425266] leading-[1.62] sm:text-right">
            Escolha um CD na estante acrílica para inspecionar o disco em 3D ou reproduzir os atos enquanto folheia o zine.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono-ui">
            <button
              type="button"
              onClick={() => onNavigateTab('zine')}
              className="underline underline-offset-4 decoration-[#2071B8] hover:text-[#2071B8]"
            >
              Abrir Zine
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('characters')}
              className="underline underline-offset-4 decoration-[#1A1A1A]/40 hover:text-[#2071B8]"
            >
              Cards &amp; Moodboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column Tactile Workspace: Left = WMP Player, Right = Acrylic CD Shelf + 3D Jewel Case */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 cols): Windows Media Player Pink Acrylic Reinterpretation */}
        <div className="xl:col-span-7">
          <div className="wmp-shell rounded-xl border border-[#2071B8]/45 overflow-hidden">
            {/* WMP Pink Acrylic Title Bar */}
            <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#2071B8]/35 bg-gradient-to-b from-[#FFF2F8]/95 via-[#F8CCE1]/90 to-[#E8AECB]/85">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-[#2071B8] border border-[#E3CD32] text-white flex items-center justify-center shrink-0">
                  <Disc3 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                </span>
                <span className="font-galix text-xs font-medium text-[#1A1A1A] truncate">
                  Megera Media Player · {activeTrack.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGearPanel((prev) => !prev)}
                aria-expanded={showGearPanel}
                aria-label="Configurar ou enviar arquivos de áudio"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono-ui border transition-colors ${
                  showGearPanel
                    ? 'bg-[#2071B8] text-white border-[#1A1A1A]'
                    : 'wmp-gloss-btn border-[#2071B8]/45 text-[#1A1A1A]'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#2071B8]" />
                <span className="hidden sm:inline">Áudios (.mp3/.wav)</span>
              </button>
            </div>

            {/* Optional Audio Upload / Settings Drawer */}
            <AnimatePresence initial={false}>
              {showGearPanel && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden border-b border-[#2071B8]/30 bg-[#F7F5F0]"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-mono-ui text-xs font-semibold text-[#1A1A1A]">
                        Gerenciar faixas de áudio originais ou customizadas
                      </p>
                      <span className="font-mono-ui text-[10px] text-[#5C5952]">
                        Aceita MP3, WAV, OGG
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {tracks.map((tr, idx) => (
                        <div
                          key={tr.id}
                          className="p-2.5 border border-[#1A1A1A]/15 bg-white flex flex-col justify-between gap-2"
                        >
                          <div>
                            <p className="font-galix text-[11px] font-medium text-[#1A1A1A]">
                              CD {tr.actCode} · {tr.actLabel}
                            </p>
                            <p className="font-mono-ui text-[10px] text-[#5C5952] truncate">
                              {tr.audioUrl.startsWith('blob:') ? 'Arquivo local carregado' : 'Master original carregado'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-mono-ui border border-[#1A1A1A] bg-[#F8CCE1]/60 hover:bg-[#F8CCE1] transition-colors">
                              <Upload className="w-3 h-3" />
                              <span>Substituir</span>
                              <input
                                type="file"
                                accept="audio/*"
                                className="sr-only"
                                aria-label={`Enviar áudio para ${tr.title}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) onUploadTrackAudio(idx, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            {tr.audioUrl.startsWith('blob:') && (
                              <button
                                type="button"
                                onClick={() => onResetTrackAudio(idx)}
                                aria-label={`Restaurar áudio original de ${tr.title}`}
                                className="p-1 border border-[#1A1A1A]/25 hover:bg-[#1A1A1A]/10"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WMP Acoustic Stage: Spinning CD + Real-Time Web Audio Canvas */}
            <div className="p-4 sm:p-5 bg-[#121926] relative border-b border-[#2071B8]/40">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Spinning CD Bay */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center py-2">
                  <div
                    data-testid="main-player-disc"
                    className="p-3 rounded-full bg-gradient-to-b from-[#F8CCE1]/25 to-white/5 border border-[#F8CCE1]/35 shadow-inner"
                  >
                    <BaroqueDisc
                      actNumber={activeTrack.actNumber}
                      actCode={activeTrack.actCode}
                      tint={activeTrack.discTint}
                      size={168}
                      spinning={isPlaying}
                      holographicBoost
                    />
                  </div>
                </div>

                {/* Live Spectrum Canvas + Act Meta */}
                <div className="sm:col-span-7 flex flex-col gap-3">
                  <div className="rounded-lg border border-[#F8CCE1]/25 overflow-hidden bg-[#09121E]">
                    <canvas
                      ref={canvasRef}
                      width={420}
                      height={128}
                      data-testid="wmp-visualizer-canvas"
                      className="w-full h-28 block"
                    />
                  </div>
                  <div className="text-white space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-galix text-[10px] uppercase"
                        style={{ color: activeTrack.accentColor }}
                      >
                        {activeTrack.actLabel} · {activeTrack.durationLabel}
                      </span>
                      <span className="font-mono-ui text-[11px] tabular-nums text-white/80">
                        {formatPlaybackTime(currentTime)} / {formatPlaybackTime(effectiveDuration)}
                      </span>
                    </div>
                    <h2 className="font-editorial text-2xl italic text-white leading-tight">
                      {activeTrack.title}
                    </h2>
                    <p
                      data-testid="player-stage-oneliner"
                      className="font-vintage text-[12.5px] text-white/85 leading-[1.55]"
                    >
                      {activeTrack.oneLiner}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WMP Pink Glossy Seek Bar & Metallic Transport Controls */}
            <div className="px-4 sm:px-6 py-4 space-y-3 bg-gradient-to-b from-[#FBE3EE] via-[#F8CCE1] to-[#EDAFCD]">
              {/* Draggable Seek Bar */}
              <div className="flex items-center gap-3">
                <span className="font-mono-ui text-[11px] tabular-nums text-[#1A1A1A] w-11">
                  {formatPlaybackTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={effectiveDuration || 1}
                  step={0.5}
                  value={Math.min(currentTime, effectiveDuration || 1)}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  aria-label="Barra de progresso do áudio"
                  className="flex-1 accent-[#2071B8] cursor-pointer h-2"
                />
                <span className="font-mono-ui text-[11px] tabular-nums text-[#425266] w-11 text-right">
                  {formatPlaybackTime(effectiveDuration)}
                </span>
              </div>

              {/* Transport Buttons + Volume */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrev}
                    aria-label="Voltar para ato anterior"
                    className="w-9 h-9 rounded-full wmp-gloss-btn border border-[#2071B8]/45 flex items-center justify-center text-[#1A1A1A]"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? 'Pausar faixa atual' : 'Reproduzir faixa atual'}
                    className="w-12 h-12 rounded-full wmp-play-orb border-2 border-white/80 flex items-center justify-center text-white active:scale-95 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onStop}
                    aria-label="Parar reprodução"
                    className="w-9 h-9 rounded-full wmp-gloss-btn border border-[#2071B8]/45 flex items-center justify-center text-[#1A1A1A]"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={onNext}
                    aria-label="Avançar para próximo ato"
                    className="w-9 h-9 rounded-full wmp-gloss-btn border border-[#2071B8]/45 flex items-center justify-center text-[#1A1A1A]"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 bg-[#FFF4F9]/75 border border-[#2071B8]/40 px-2.5 py-1.5 rounded-full">
                  <button
                    type="button"
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Ativar áudio' : 'Silenciar áudio'}
                    className="text-[#2071B8] hover:text-[#1A1A1A]"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    aria-label="Controle de volume"
                    className="w-24 accent-[#2071B8] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Tracklist Strip */}
            <div className="divide-y divide-[#1A1A1A]/10 bg-[#FDF7FA]">
              {tracks.map((tr, idx) => {
                const isActive = idx === activeTrackIndex;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => onSelectTrack(idx, true)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 transition-colors ${
                      isActive ? 'bg-[#E3CD32]/35' : 'hover:bg-[#F8CCE1]/28'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 shrink-0 border border-[#1A1A1A]"
                        style={{ backgroundColor: tr.accentColor }}
                      />
                      <div className="min-w-0">
                        <p className="font-galix text-xs font-medium text-[#1A1A1A] truncate">
                          {tr.title}
                        </p>
                        <p className="font-mono-ui text-[11px] text-[#5C5952] truncate">
                          {tr.castFeatured.join(' · ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-galix text-xs tabular-nums text-[#1A1A1A]">
                        {tr.durationLabel}
                      </span>
                      <span className="font-galix text-[10px] uppercase text-[#2071B8]">
                        {isActive && isPlaying ? 'Tocando' : 'Ouvir'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): 3D Interactive Jewel Case Inspector */}
        <div className="xl:col-span-5" id="jewel-case-inspector">
          <div className="border border-[#1A1A1A]/15 bg-white/85 p-4 sm:p-5 relative shadow-[0_18px_36px_-22px_rgba(26,26,26,0.22)]">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-galix text-[10px] uppercase text-[#5C5952]">
                  Edição Física em Acrílico · {inspectedTrack.actLabel}
                </p>
                <h3 className="font-editorial text-xl sm:text-2xl font-medium text-[#1A1A1A] leading-tight">
                  {inspectedTrack.title}
                </h3>
              </div>
              <button
                type="button"
                data-testid="toggle-cd-case-btn"
                aria-expanded={caseOpened}
                onClick={() => {
                  if (showingBack) {
                    setRotation({ x: -3, y: Math.round(rotation.y / 360) * 360 });
                    applyCdCaseState(true);
                  } else {
                    toggleCdCase();
                  }
                }}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-ui font-medium border transition-colors cursor-pointer ${
                  caseOpened
                    ? 'bg-[#F8CCE1] text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#f4b8d5]'
                    : 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#F8CCE1]/55'
                }`}
              >
                {caseOpened ? (
                  <PanelLeftClose className="w-3.5 h-3.5 text-[#2071B8]" />
                ) : (
                  <PanelLeftOpen className="w-3.5 h-3.5 text-[#2071B8]" />
                )}
                <span>{lidTransform.buttonLabel}</span>
              </button>
            </div>

            <div
              onPointerDown={handleDiscPointerDown}
              onPointerMove={handleDiscPointerMove}
              onPointerLeave={resetDiscTilt}
              onClick={() => {
                if (suppressClickRef.current) return;
                if (caseOpened && !showingBack) toggleCdCase();
              }}
              data-testid="disc-3d-stage"
              data-cd-sound-count={cdSoundStats.count}
              data-cd-sound-action={cdSoundStats.lastAction ?? ''}
              data-rotate-y={Math.round(normalizeAngle360(rotation.y))}
              data-showing-back={showingBack ? 'true' : 'false'}
              style={{ touchAction: 'none' }}
              className={`perspective-1400 flex items-center justify-center py-6 overflow-visible select-none ${
                isDraggingCase ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <motion.div
                animate={{
                  rotateX: isDraggingCase ? rotation.x : rotation.x + hoverTilt.rx,
                  rotateY: isDraggingCase ? rotation.y : rotation.y + hoverTilt.ry,
                  x: caseOpened && !showingBack ? 46 : 0,
                }}
                transition={
                  isDraggingCase
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 165, damping: 22 }
                }
                className="preserve-3d relative w-[250px] h-[226px] sm:w-[278px] sm:h-[252px]"
              >
                {/* FRONT TRAY & DISC (hidden when rotated past 90°..270° via backface-visibility: hidden) */}
                <button
                  type="button"
                  data-testid="cd-case-tray"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (suppressClickRef.current || showingBack) return;
                    toggleCdCase();
                  }}
                  aria-label={caseOpened ? 'Fechar caixa acrílica do CD' : 'Abrir caixa acrílica do CD'}
                  className="absolute inset-0 w-full h-full p-0 rounded-sm border border-[#1A1A1A]/30 shadow-[0_24px_42px_-16px_rgba(16,32,54,0.38)] flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2071B8]"
                  style={{
                    transform: 'translateZ(0px)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    pointerEvents: showingBack ? 'none' : 'auto',
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(235,241,247,0.88) 52%, rgba(212,223,235,0.92) 100%)',
                  }}
                >
                  {/* Acrylic spine strip — text positioned cleanly between top & bottom hinge pins */}
                  <div className="absolute inset-y-0 left-0 w-5 border-r border-black/15 bg-gradient-to-r from-black/10 via-white/35 to-transparent z-10 pointer-events-none">
                    <div
                      data-testid="cd-spine-text-channel"
                      className="absolute inset-x-0 top-7 bottom-7 flex flex-col justify-between items-center overflow-hidden"
                    >
                      <span
                        data-testid="cd-spine-act"
                        style={{ writingMode: 'vertical-rl' }}
                        className="font-galix text-[7px] leading-none tracking-[0.07em] rotate-180 whitespace-nowrap text-[#2071B8]"
                      >
                        {inspectedTrack.actLabel}
                      </span>
                      <span
                        data-testid="cd-spine-title"
                        style={{ writingMode: 'vertical-rl' }}
                        className="font-galix text-[7px] leading-none tracking-[0.05em] rotate-180 whitespace-nowrap text-[#1A1A1A]/85"
                      >
                        MEGERA CORDIAL
                      </span>
                    </div>
                  </div>

                  {/* Molded tray circular well & corner clips */}
                  <div
                    aria-hidden="true"
                    className="absolute right-2 top-2 w-2.5 h-2.5 border-t-2 border-r-2 border-white/90 shadow-sm pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute right-2 bottom-2 w-2.5 h-2.5 border-b-2 border-r-2 border-white/90 shadow-sm pointer-events-none"
                  />

                  {/* Raised 3D Disc */}
                  <div className="pl-3.5 relative z-0 pointer-events-none">
                    <BaroqueDisc
                      actNumber={inspectedTrack.actNumber}
                      actCode={inspectedTrack.actCode}
                      tint={inspectedTrack.discTint}
                      size={196}
                      spinning={isPlaying && activeTrackIndex === inspectedIndex}
                      glareX={hoverTilt.gx}
                      glareY={hoverTilt.gy}
                      isInteractive
                      holographicBoost
                    />
                  </div>
                </button>

                {/* FRONT HINGED CLEAR ACRYLIC LID */}
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (suppressClickRef.current || showingBack) return;
                    toggleCdCase();
                  }}
                  aria-label={caseOpened ? 'Fechar capa acrílica do CD' : 'Abrir capa acrílica do CD'}
                  data-testid="cd-acrylic-lid"
                  data-case-open={caseOpened ? 'true' : 'false'}
                  animate={{
                    rotateY: lidTransform.rotateY,
                    z: lidTransform.z,
                    opacity: lidTransform.opacity,
                  }}
                  transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                  style={{
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: caseOpened ? 'visible' : 'hidden',
                    WebkitBackfaceVisibility: caseOpened ? 'visible' : 'hidden',
                    pointerEvents: showingBack ? 'none' : 'auto',
                    zIndex: 30,
                  }}
                  className="absolute inset-0 w-full h-full p-0 text-left rounded-sm border border-white/95 shadow-[0_14px_28px_-10px_rgba(12,30,58,0.34),inset_0_0_0_1px_rgba(32,113,184,0.18)] overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2071B8]"
                >
                  {/* Frosted/Clear Acrylic Base Film so the spinning CD stays visible behind the lid */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none backdrop-blur-[1.2px]"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.14) 45%, rgba(248,204,225,0.18) 78%, rgba(255,255,255,0.38) 100%)',
                    }}
                  />

                  {/* Left Acrylic Hinge Strip & Top/Bottom Molded Pins */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-5 border-r border-white/75 bg-gradient-to-r from-white/30 via-white/10 to-transparent pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-1 top-2 w-2.5 h-3 rounded-xs bg-white/85 border border-black/15 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-1 bottom-2 w-2.5 h-3 rounded-xs bg-white/85 border border-black/15 pointer-events-none"
                  />

                  {/* Right Outer Acrylic Thumb Grip Notch */}
                  <div
                    aria-hidden="true"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-l-sm bg-white/70 border-y border-l border-[#1A1A1A]/15 pointer-events-none"
                  />

                  {/* Per-CD Transparent Blue Line Artwork Engraved/Printed on the Clear Acrylic */}
                  <div className="absolute inset-y-2 left-5 right-2 flex items-center justify-center pointer-events-none">
                    <img
                      src={inspectedCover.imageUrl}
                      alt={inspectedCover.alt}
                      data-testid="cd-cover-artwork"
                      className="w-full h-full object-contain select-none"
                      style={{
                        objectPosition: inspectedCover.objectPosition,
                        filter:
                          'drop-shadow(0 0 1.4px rgba(255,255,255,0.92)) drop-shadow(0 2px 4px rgba(14,38,74,0.28))',
                      }}
                    />
                  </div>

                  {/* Subtle Top-Right Micro Stamp & Bottom-Left Title on the Clear Acrylic */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-2.5 pl-7 pointer-events-none">
                    <div className="flex items-center justify-end">
                      <span className="font-galix text-[9px] uppercase px-1.5 py-0.5 bg-white/75 text-[#1A1A1A] border border-[#2071B8]/25 shadow-xs">
                        CD {inspectedTrack.actCode} · {inspectedTrack.actLabel}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="font-script text-2xl leading-none text-[#2071B8] drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                        Megera Cordial
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Plastic Specular Reflection (mix-blend-mode: screen) */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none mix-blend-screen"
                    style={{
                      background: `radial-gradient(circle at ${hoverTilt.gx}% ${hoverTilt.gy}%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 28%, transparent 58%), linear-gradient(122deg, rgba(255,255,255,0.38) 0%, transparent 32%, transparent 62%, rgba(255,255,255,0.28) 100%)`,
                    }}
                  />
                </motion.button>

                {/* BACK FACE (visible between 90° and 270°): Translucent Acrylic + Editorial Synopsis in Ficha Técnica Style */}
                <div
                  data-testid="cd-case-back"
                  style={{
                    transform: 'rotateY(180deg) translateZ(4px)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    pointerEvents: showingBack ? 'auto' : 'none',
                    zIndex: showingBack ? 40 : 1,
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(238,244,250,0.88) 52%, rgba(248,204,225,0.22) 86%, rgba(255,255,255,0.92) 100%)',
                  }}
                  className="absolute inset-0 w-full h-full rounded-sm border border-white/95 shadow-[0_24px_42px_-16px_rgba(16,32,54,0.38),inset_0_0_0_1px_rgba(32,113,184,0.18)] overflow-hidden"
                >
                  {/* Faint translucent CD silhouette visible through back acrylic */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center pr-5 pointer-events-none opacity-25"
                  >
                    <div className="w-40 h-40 rounded-full border border-[#2071B8]/30 bg-radial from-white/60 via-[#F8CCE1]/20 to-transparent flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full border border-[#1A1A1A]/20 bg-white/70" />
                    </div>
                  </div>

                  {/* Mirrored Right Molded Acrylic Spine Strip & Pins on the Back Side */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 right-0 w-4 border-l border-black/15 bg-gradient-to-l from-black/10 via-white/35 to-transparent pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute right-0.5 top-2 w-2.5 h-3 rounded-xs bg-white/80 border border-black/15 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute right-0.5 bottom-2 w-2.5 h-3 rounded-xs bg-white/80 border border-black/15 pointer-events-none"
                  />

                  {/* Plastic Corner Clips */}
                  <div
                    aria-hidden="true"
                    className="absolute left-2 top-2 w-2.5 h-2.5 border-t-2 border-l-2 border-white/95 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute left-2 bottom-2 w-2.5 h-2.5 border-b-2 border-l-2 border-white/95 pointer-events-none"
                  />

                  {/* Editorial Ficha Técnica Style Synopsis Content */}
                  <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-3.5 pr-7 sm:pr-7 text-left">
                    <div className="border-b border-[#1A1A1A]/15 pb-1.5 flex items-baseline justify-between gap-2 shrink-0">
                      <h4 className="font-script text-[25px] sm:text-[27px] text-[#1A1A1A] leading-none">
                        Sinopse
                      </h4>
                      <span className="font-vintage text-[9.5px] text-[#2071B8] shrink-0 whitespace-nowrap">
                        CD {inspectedTrack.actCode} · {inspectedTrack.actLabel}
                      </span>
                    </div>

                    <dl className="flex-1 divide-y divide-[#1A1A1A]/15 flex flex-col justify-start overflow-y-auto card-back-scroll">
                      <div className="py-1">
                        <dt className="font-vintage text-[9px] text-[#2071B8] leading-tight">
                          Título do Ato
                        </dt>
                        <dd className="font-vintage text-[10.5px] sm:text-[11px] text-[#1A1A1A] leading-snug">
                          {inspectedTrack.title}
                        </dd>
                      </div>

                      <div className="py-1 flex-1">
                        <dt className="font-vintage text-[9px] text-[#2071B8] leading-tight">
                          Sinopse
                        </dt>
                        <dd
                          data-testid="cd-back-synopsis"
                          className="font-vintage text-[9.2px] sm:text-[9.5px] leading-[1.25] text-[#1A1A1A] mt-0.5"
                        >
                          {inspectedTrack.synopsis}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Subtle Specular Plastic Reflection */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none mix-blend-screen"
                    style={{
                      background:
                        'linear-gradient(125deg, rgba(255,255,255,0.48) 0%, transparent 32%, transparent 64%, rgba(255,255,255,0.3) 100%)',
                    }}
                  />
                </div>
              </motion.div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#1A1A1A]/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono-ui text-[#5C5952]">
                  {inspectedTrack.themes.map((t, i) => (
                    <span key={t}>
                      {i > 0 ? '· ' : ''}
                      {t}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  data-testid="cd-flip-180-btn"
                  aria-pressed={showingBack}
                  onClick={handleFlip180}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono-ui border border-[#2071B8]/40 bg-[#F7F5F0] hover:bg-[#F8CCE1]/55 text-[#1A1A1A] transition-colors cursor-pointer shrink-0"
                >
                  <span>{showingBack ? '↻ Girar 180° / Ver Capa' : '↻ Girar 180° / Ver Sinopse'}</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono-ui text-[#2071B8]">
                  <Move3d className="w-3.5 h-3.5" />
                  <span>Arraste livremente 360° ou clique na capa para abrir</span>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTrack(inspectedIndex, true)}
                  className="px-3.5 py-1.5 text-[11px] font-galix uppercase bg-[#2071B8] text-white border border-[#1A1A1A] hover:bg-[#195e9b]"
                >
                  Reproduzir {inspectedTrack.actLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH ACRYLIC DISPLAY SHELF: Large Holographic CD Jewel Cases + Cover Art */}
      <div className="mt-10" data-testid="acrylic-shelf">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="font-mono-ui text-xs sm:text-sm uppercase tracking-[0.18em] text-[#1A1A1A]">
            Estante Acrílica · Coleção Completa
          </h2>
          <span className="font-mono-ui text-[11px] text-[#5C5952]">
            Clique em uma caixinha para inspecionar em 3D ou reproduzir o ato
          </span>
        </div>

        <div className="relative pt-6 pb-7 px-4 sm:px-8 rounded-2xl acrylic-surface border border-white/90 shadow-[0_26px_48px_-20px_rgba(32,113,184,0.3)]">
          {/* 3 Large Holographic Jewel Cases */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
            {tracks.map((tr, idx) => {
              const selected = idx === inspectedIndex;
              const playingThis = idx === activeTrackIndex && isPlaying;
              const cover = getCoverArtForAct(tr.actNumber);

              return (
                <motion.button
                  key={tr.id}
                  type="button"
                  data-testid={`shelf-disc-card-${tr.actCode}`}
                  onClick={() => handleSelectShelfDisc(idx)}
                  whileHover={{ y: -12, scale: 1.02 }}
                  animate={{
                    y: selected ? -10 : 0,
                    scale: selected ? 1.02 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  aria-label={`Inspecionar CD ${tr.actCode}: ${tr.title}`}
                  className={`group relative aspect-[1.06/1] w-full rounded-sm border text-left overflow-hidden transition-shadow ${
                    selected
                      ? 'border-[#1A1A1A] shadow-[0_24px_38px_-14px_rgba(16,32,54,0.45)] ring-2 ring-[#2071B8]'
                      : 'border-white/95 shadow-[0_18px_32px_-14px_rgba(16,32,54,0.28)] hover:shadow-[0_24px_40px_-14px_rgba(32,113,184,0.36)]'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.92) 0%, ${tr.accentColor}48 45%, rgba(226,236,246,0.9) 100%)`,
                  }}
                >
                  {/* Molded Left Translucent Jewel Case Spine */}
                  <div className="absolute inset-y-0 left-0 w-6 bg-white/70 border-r border-black/15 z-20">
                    <div className="absolute inset-x-0 top-5 bottom-5 flex flex-col items-center justify-between overflow-hidden">
                      <span
                        style={{ writingMode: 'vertical-rl' }}
                        className="font-galix text-[7.5px] leading-none tracking-[0.06em] rotate-180 whitespace-nowrap text-[#2071B8]"
                      >
                        CD {tr.actCode}
                      </span>
                      <span
                        style={{ writingMode: 'vertical-rl' }}
                        className="font-galix text-[7.5px] leading-none tracking-[0.05em] rotate-180 whitespace-nowrap text-[#1A1A1A]/85"
                      >
                        MEGERA CORDIAL
                      </span>
                    </div>
                  </div>

                  {/* Molded Acrylic Corner Clips */}
                  <div
                    aria-hidden="true"
                    className="absolute right-2.5 top-2.5 w-3 h-3 border-t-2 border-r-2 border-white/95 z-20 pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute right-2.5 bottom-2.5 w-3 h-3 border-b-2 border-r-2 border-white/95 z-20 pointer-events-none"
                  />

                  {/* Large Holographic BaroqueDisc inside the Case */}
                  <div className="absolute inset-0 pl-6 flex items-center justify-center z-0 pointer-events-none">
                    <div className="relative group-hover:scale-[1.03] transition-transform duration-300">
                      <BaroqueDisc
                        actNumber={tr.actNumber}
                        actCode={tr.actCode}
                        tint={tr.discTint}
                        size={196}
                        spinning={playingThis}
                        holographicBoost
                      />
                    </div>
                  </div>

                  {/* Iridescent Holographic Foil & Rainbow Prism Layer */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 left-6 z-10 pointer-events-none opacity-65 group-hover:opacity-90 transition-opacity duration-300 mix-blend-color-dodge"
                    style={{
                      background:
                        'conic-gradient(from 130deg at 52% 48%, rgba(248,204,225,0.55), rgba(142,216,255,0.52), rgba(227,205,50,0.52), rgba(255,255,255,0.7), rgba(32,113,184,0.45), rgba(248,204,225,0.55))',
                    }}
                  />

                  {/* Translucent Acrylic Front Cover Film */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 left-6 z-10 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0.08) 48%, rgba(255,255,255,0.3) 100%)',
                    }}
                  />

                  {/* Per-CD Cover Illustration (IMG_1562 / IMG_1558 / IMG_1557) */}
                  <div className="absolute inset-y-3 left-7 right-3 z-20 flex items-center justify-center pointer-events-none">
                    <img
                      src={cover.imageUrl}
                      alt={cover.alt}
                      data-testid={`shelf-cover-artwork-${tr.actCode}`}
                      className="w-full h-full object-contain select-none"
                      style={{
                        objectPosition: cover.objectPosition,
                        filter:
                          'drop-shadow(0 0 1.8px rgba(255,255,255,0.95)) drop-shadow(0 3px 6px rgba(14,38,74,0.28))',
                      }}
                    />
                  </div>

                  {/* Acrylic Specular Diagonal Glare */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-20 pointer-events-none mix-blend-screen"
                    style={{
                      background:
                        'linear-gradient(118deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 28%, transparent 52%, rgba(255,255,255,0.32) 100%)',
                    }}
                  />

                  {/* Crisp Top & Bottom Jewel-Case Metadata Labels */}
                  <div className="relative z-30 h-full p-3.5 pl-8 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-galix text-[10px] uppercase text-[#1A1A1A] bg-white/85 px-2 py-0.5 border border-[#1A1A1A]/15 shadow-xs">
                        CD {tr.actCode} · {tr.actLabel}
                      </span>
                      {playingThis ? (
                        <span className="font-galix text-[9px] uppercase text-[#1A1A1A] bg-[#E3CD32] px-2 py-0.5 border border-[#1A1A1A]/20">
                          Tocando
                        </span>
                      ) : selected ? (
                        <span className="font-galix text-[9px] uppercase text-white bg-[#2071B8] px-2 py-0.5">
                          Selecionado
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <span className="font-script text-2xl sm:text-[26px] leading-none text-[#2071B8] drop-shadow-[0_1px_0_rgba(255,255,255,0.95)]">
                        Megera Cordial
                      </span>
                      <span className="font-galix text-[10px] tabular-nums px-1.5 py-0.5 bg-white/85 text-[#1A1A1A] border border-[#1A1A1A]/15">
                        {tr.durationLabel}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Front Clear Acrylic Shelf Lip */}
          <div
            aria-hidden="true"
            className="mt-5 h-5 rounded-b-xl border-t border-white/95 bg-gradient-to-b from-white/80 via-[#F8CCE1]/45 to-white/85 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_12px_22px_-8px_rgba(32,113,184,0.26)]"
          />
        </div>
      </div>
    </section>
  );
};
