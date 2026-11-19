/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { INITIAL_TRACKS, type ActTrack } from './data/projectData';
import { createAudioAnalyser } from './utils/audioEngine';
import { Navbar, type AppTab } from './components/Navbar';
import { PersistentPlayer } from './components/PersistentPlayer';
import { PlayerSection } from './components/PlayerSection';
import { ZineViewer } from './components/ZineViewer';
import { CharacterCards } from './components/CharacterCards';
import { AluminumMoodboard } from './components/AluminumMoodboard';
import { Lock, Unlock } from 'lucide-react';
import type { CharacterId } from './utils/moodboardLogic';
import { AboutSection } from './components/AboutSection';
import { TherapyRoomSection } from './components/TherapyRoomSection';
import {
  resolveInitialAdminMode,
  setAdminSession,
  verifyAdminPassword,
} from './utils/adminAuthLogic';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('player');
  const [tracks, setTracks] = useState<ActTrack[]>(INITIAL_TRACKS);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0].durationSeconds);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>('ines');
  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? resolveInitialAdminMode(window.location.search, window.sessionStorage)
      : false
  );
  const [showAdminPrompt, setShowAdminPrompt] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserInitializedRef = useRef<boolean>(false);
  const moodboardAnchorRef = useRef<HTMLDivElement | null>(null);

  const activeTrack = tracks[activeTrackIndex];

  // Create and wire persistent HTMLAudioElement once
  useEffect(() => {
    const audio = new Audio(INITIAL_TRACKS[0].audioUrl);
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setActiveTrackIndex((prev) => {
        const next = (prev + 1) % tracks.length;
        return next;
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync track source when activeTrack changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentSrc = audio.getAttribute('data-track-url');
    if (currentSrc !== activeTrack.audioUrl) {
      audio.src = activeTrack.audioUrl;
      audio.setAttribute('data-track-url', activeTrack.audioUrl);
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(activeTrack.durationSeconds);

      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }
  }, [activeTrack.audioUrl, activeTrack.durationSeconds, isPlaying]);

  // Sync volume & mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const ensureAnalyser = () => {
    const audio = audioRef.current;
    if (!audio || analyserInitializedRef.current) return;
    const result = createAudioAnalyser(audio);
    if (result) {
      setAnalyser(result.analyser);
      analyserInitializedRef.current = true;
    }
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      ensureAnalyser();
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Fallback visual playback state if headless browser restricts audio device
        setIsPlaying(true);
      }
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSelectTrack = async (index: number, autoPlay = true) => {
    const targetTrack = tracks[index];
    if (!targetTrack) return;

    setActiveTrackIndex(index);
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.getAttribute('data-track-url') !== targetTrack.audioUrl) {
      audio.src = targetTrack.audioUrl;
      audio.setAttribute('data-track-url', targetTrack.audioUrl);
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(targetTrack.durationSeconds);
    }

    if (autoPlay) {
      ensureAnalyser();
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(true);
      }
    }
  };

  const handlePrev = () => {
    const nextIdx = (activeTrackIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(nextIdx, isPlaying);
  };

  const handleNext = () => {
    const nextIdx = (activeTrackIndex + 1) % tracks.length;
    handleSelectTrack(nextIdx, isPlaying);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    setCurrentTime(time);
    if (audio && Number.isFinite(time)) {
      audio.currentTime = time;
    }
  };

  const handleUploadTrackAudio = (index: number, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setTracks((prev) =>
      prev.map((tr, i) => (i === index ? { ...tr, audioUrl: objectUrl } : tr))
    );
    if (index === activeTrackIndex) {
      setIsPlaying(false);
    }
  };

  const handleResetTrackAudio = (index: number) => {
    setTracks((prev) =>
      prev.map((tr, i) =>
        i === index ? { ...tr, audioUrl: INITIAL_TRACKS[index].audioUrl } : tr
      )
    );
  };

  const handleSelectCharacterForMoodboard = (id: CharacterId) => {
    setSelectedCharacter(id);
    moodboardAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen flex flex-col text-[#1A1A1A]">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isPlaying={isPlaying}
        activeActCode={activeTrack.actLabel}
        onTogglePlay={handleTogglePlay}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'player' && (
            <motion.div
              key="tab-player"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PlayerSection
                tracks={tracks}
                activeTrackIndex={activeTrackIndex}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                analyser={analyser}
                onSelectTrack={handleSelectTrack}
                onTogglePlay={handleTogglePlay}
                onStop={handleStop}
                onPrev={handlePrev}
                onNext={handleNext}
                onSeek={handleSeek}
                onVolumeChange={(v) => {
                  setVolume(v);
                  if (v > 0 && isMuted) setIsMuted(false);
                }}
                onToggleMute={() => setIsMuted((m) => !m)}
                onUploadTrackAudio={handleUploadTrackAudio}
                onResetTrackAudio={handleResetTrackAudio}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </motion.div>
          )}

          {activeTab === 'zine' && (
            <motion.div
              key="tab-zine"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ZineViewer isAdmin={isAdmin} />
            </motion.div>
          )}

          {activeTab === 'characters' && (
            <motion.div
              key="tab-characters"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-10"
            >
              <CharacterCards
                selectedCharacter={selectedCharacter}
                onSelectForMoodboard={handleSelectCharacterForMoodboard}
              />
              <div ref={moodboardAnchorRef}>
                <AluminumMoodboard
                  selectedCharacter={selectedCharacter}
                  onSelectCharacter={setSelectedCharacter}
                  tracks={tracks}
                  activeTrackIndex={activeTrackIndex}
                  isPlaying={isPlaying}
                  onPlayActFromBoard={(idx) => handleSelectTrack(idx, true)}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'therapy' && (
            <motion.div
              key="tab-therapy"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TherapyRoomSection />
            </motion.div>
          )}

          {activeTab === 'about' && (
            <motion.div
              key="tab-about"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AboutSection isAdmin={isAdmin} onNavigateTab={(tab) => setActiveTab(tab)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discreet Editorial Footer with Admin Mode Padlock */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-24">
          <div className="border-t border-[#1A1A1A]/10 pt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.18em] text-[#5C5952]/75">
              Megera Cordial · Áudio-Ficção &amp; Zine · Faculdade Cásper Líbero
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin ? (
                <>
                  <span
                    data-testid="admin-active-badge"
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono-ui uppercase tracking-wider bg-[#E3CD32]/40 text-[#1A1A1A] border border-[#1A1A1A]/20"
                  >
                    <Unlock className="w-3 h-3 text-[#2071B8]" />
                    Modo Admin ativo
                  </span>
                  <button
                    type="button"
                    data-testid="admin-lock-btn"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        setAdminSession(false, window.sessionStorage);
                      }
                      setIsAdmin(false);
                      setShowAdminPrompt(false);
                      setAdminPasswordInput('');
                      setAdminError(null);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono-ui text-[#5C5952] hover:text-[#1A1A1A] border border-[#1A1A1A]/15 bg-white/70 hover:bg-white transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    Bloquear Edição
                  </button>
                </>
              ) : (
                <>
                  {showAdminPrompt && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (verifyAdminPassword(adminPasswordInput)) {
                          if (typeof window !== 'undefined') {
                            setAdminSession(true, window.sessionStorage);
                          }
                          setIsAdmin(true);
                          setShowAdminPrompt(false);
                          setAdminPasswordInput('');
                          setAdminError(null);
                        } else {
                          setAdminError('Senha incorreta');
                        }
                      }}
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      <input
                        type="password"
                        data-testid="admin-password-input"
                        value={adminPasswordInput}
                        onChange={(e) => {
                          setAdminPasswordInput(e.target.value);
                          if (adminError) setAdminError(null);
                        }}
                        placeholder="Senha admin"
                        aria-label="Senha do modo administrador"
                        className="px-2.5 py-1 text-[11px] font-mono-ui bg-white border border-[#1A1A1A]/25 text-[#1A1A1A] w-32 focus:outline-none focus:border-[#2071B8]"
                      />
                      <button
                        type="submit"
                        data-testid="admin-unlock-submit"
                        className="px-2.5 py-1 text-[10px] font-mono-ui uppercase tracking-wider bg-[#1A1A1A] text-white hover:bg-[#2071B8] transition-colors"
                      >
                        Desbloquear
                      </button>
                      {adminError && (
                        <span
                          data-testid="admin-password-error"
                          className="text-[10px] font-mono-ui text-[#A84B70]"
                        >
                          {adminError}
                        </span>
                      )}
                    </form>
                  )}
                  <button
                    type="button"
                    data-testid="admin-lock-btn"
                    aria-label="Modo Administrador"
                    title="Modo Administrador"
                    onClick={() => {
                      setShowAdminPrompt((prev) => !prev);
                      setAdminError(null);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-mono-ui text-[#5C5952]/70 hover:text-[#1A1A1A] transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span className="sr-only sm:not-sr-only">Admin</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>
      </main>

      <PersistentPlayer
        track={activeTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={handleSeek}
        onToggleMute={() => setIsMuted((m) => !m)}
        onVolumeChange={(v) => {
          setVolume(v);
          if (v > 0 && isMuted) setIsMuted(false);
        }}
        onOpenPlayerTab={() => setActiveTab('player')}
      />
    </div>
  );
}
