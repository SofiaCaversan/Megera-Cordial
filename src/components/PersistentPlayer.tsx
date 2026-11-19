import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ArrowUpRight } from 'lucide-react';
import type { ActTrack } from '../data/projectData';
import { formatPlaybackTime, calculateSeekTime } from '../utils/formatTime';
import { BaroqueDisc } from './BaroqueDisc';

interface PersistentPlayerProps {
  track: ActTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (vol: number) => void;
  onOpenPlayerTab: () => void;
}

export const PersistentPlayer: React.FC<PersistentPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onOpenPlayerTab,
}) => {
  const effectiveDuration = duration > 0 ? duration : track.durationSeconds;
  const progressPct = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const target = calculateSeekTime(e.clientX, rect.left, rect.width, effectiveDuration);
    onSeek(target);
  };

  return (
    <aside
      aria-label="Player persistente de áudio"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[#2071B8]/40 wmp-shell"
    >
      {/* Top thin seek bar */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Progresso da faixa"
        aria-valuemin={0}
        aria-valuemax={Math.round(effectiveDuration)}
        aria-valuenow={Math.round(currentTime)}
        onClick={handleBarClick}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(Math.min(effectiveDuration, currentTime + 10));
          if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 10));
        }}
        className="w-full h-1.5 bg-[#1A1A1A]/15 cursor-pointer relative group"
      >
        <div
          className="h-full bg-[#2071B8] transition-[width] duration-150"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-11 sm:h-13 flex items-center justify-between gap-3">
        {/* Track Info + Mini Spinning Disc */}
        <button
          type="button"
          onClick={onOpenPlayerTab}
          className="flex items-center gap-2.5 min-w-0 text-left group"
          aria-label={`Abrir player principal para ${track.title}`}
        >
          <div className="shrink-0">
            <BaroqueDisc
              actNumber={track.actNumber}
              actCode={track.actCode}
              tint={track.discTint}
              size={34}
              spinning={isPlaying}
            />
          </div>
          <div className="min-w-0">
            <p className="font-galix text-xs font-medium text-[#1A1A1A] truncate group-hover:text-[#2071B8] transition-colors">
              {track.title}
            </p>
            <p className="font-mono-ui text-[10px] text-[#425266] truncate hidden sm:block">
              {track.oneLiner}
            </p>
          </div>
        </button>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Ato anterior"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full wmp-gloss-btn border border-[#2071B8]/40 flex items-center justify-center text-[#1A1A1A]"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pausar reprodução' : 'Iniciar reprodução'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full wmp-play-orb border border-white/60 flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Próximo ato"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full wmp-gloss-btn border border-[#2071B8]/40 flex items-center justify-center text-[#1A1A1A]"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Time & Volume */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono-ui text-[11px] tabular-nums text-[#1A1A1A]">
            {formatPlaybackTime(currentTime)} <span className="opacity-50">/ {formatPlaybackTime(effectiveDuration)}</span>
          </span>

          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
              className="p-1 text-[#1A1A1A]/80 hover:text-[#2071B8]"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume do player persistente"
              className="w-16 accent-[#2071B8] cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={onOpenPlayerTab}
            aria-label="Expandir reprodutor"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono-ui uppercase tracking-wider border border-[#2071B8]/40 bg-white/75 text-[#1A1A1A] hover:bg-white"
          >
            <span>Player</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </aside>
  );
};
