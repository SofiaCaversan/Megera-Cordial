import React from 'react';
import { Disc3, BookOpen, Users, Info, Play, Pause, Armchair } from 'lucide-react';

export type AppTab = 'player' | 'zine' | 'characters' | 'therapy' | 'about';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isPlaying: boolean;
  activeActCode: string;
  onTogglePlay: () => void;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'player', label: 'Faixas & Player', shortLabel: 'Player', icon: Disc3 },
  { id: 'zine', label: 'Zine Digital', shortLabel: 'Zine', icon: BookOpen },
  { id: 'characters', label: 'Personagens & Moodboard', shortLabel: 'Moodboard', icon: Users },
  { id: 'therapy', label: 'Sala de Terapia', shortLabel: 'Terapia', icon: Armchair },
  { id: 'about', label: 'Sobre o Projeto', shortLabel: 'Sobre', icon: Info },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isPlaying,
  activeActCode,
  onTogglePlay,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1A1A1A]/15 bg-[#F7F5F0]/92 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-11 sm:h-14 flex items-center justify-between gap-2">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('player')}
          className="flex items-baseline gap-2 text-left shrink-0 focus:outline-none group"
          aria-label="Ir para o início — Megera Cordial"
        >
          <span className="font-script text-2xl sm:text-3xl leading-none text-[#1A1A1A] group-hover:text-[#2071B8] transition-colors">
            Megera Cordial
          </span>
          <span className="hidden lg:inline font-mono-ui text-[10px] tracking-[0.18em] uppercase text-[#5C5952]">
            Áudio &amp; Zine
          </span>
        </button>

        {/* Desktop Primary Tabs */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-1.5 text-xs font-mono-ui tracking-wide whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors border ${
                  active
                    ? 'bg-[#1A1A1A] text-[#F7F5F0] border-[#1A1A1A]'
                    : 'bg-transparent text-[#1A1A1A]/80 border-transparent hover:border-[#1A1A1A]/25 hover:bg-white/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Single Quiet Utility Action */}
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? `Pausar ${activeActCode}` : `Ouvir ${activeActCode}`}
          className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-galix uppercase border border-[#1A1A1A] bg-[#E3CD32] text-[#1A1A1A] hover:bg-[#edd946] active:translate-y-px transition-all shadow-[2px_2px_0_#1A1A1A]"
        >
          {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          <span>{isPlaying ? `Pausar ${activeActCode}` : `Ouvir ${activeActCode}`}</span>
        </button>
      </div>

      {/* Mobile Compact 5-Tab Bar */}
      <nav
        aria-label="Navegação principal móvel"
        className="md:hidden grid grid-cols-5 border-t border-[#1A1A1A]/10 bg-[#F7F5F0]"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`py-1.5 px-1 flex items-center justify-center gap-1 text-[11px] font-mono-ui whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#1A1A1A] text-[#F7F5F0]'
                  : 'text-[#1A1A1A]/75 hover:bg-white/50'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
