import React from 'react';
import { getDiscSpinPlayState } from '../utils/cdCaseLogic';

interface BaroqueDiscProps {
  actNumber: 1 | 2 | 3;
  actCode: '01' | '02' | '03';
  tint: 'pink' | 'blue' | 'gold';
  size?: number;
  spinning?: boolean;
  glareX?: number; // 0..100
  glareY?: number; // 0..100
  isInteractive?: boolean;
  holographicBoost?: boolean;
}

const TINT_CONFIG = {
  pink: {
    baseColor: '#F8CCE1',
    baseGradient:
      'radial-gradient(circle at 35% 30%, #FDE5F0 0%, #F8CCE1 48%, #E19EBE 84%, #C06E96 100%)',
    metallicHighlight: 'rgba(255, 255, 255, 0.72)',
    stippleStroke: 'rgba(130, 52, 92, 0.45)',
    textColor: '#1A1A1A',
    label: "ATO 1 · 10'36\"",
  },
  blue: {
    baseColor: '#2071B8',
    baseGradient:
      'radial-gradient(circle at 35% 30%, #7AB5EA 0%, #2071B8 50%, #15538C 84%, #0B3259 100%)',
    metallicHighlight: 'rgba(218, 238, 255, 0.75)',
    stippleStroke: 'rgba(255, 255, 255, 0.45)',
    textColor: '#FFFFFF',
    label: "ATO 2 · 12'03\"",
  },
  gold: {
    baseColor: '#E3CD32',
    baseGradient:
      'radial-gradient(circle at 35% 30%, #F6EA7C 0%, #E3CD32 50%, #BFA918 84%, #8E7B0B 100%)',
    metallicHighlight: 'rgba(255, 252, 224, 0.78)',
    stippleStroke: 'rgba(92, 78, 6, 0.45)',
    textColor: '#1A1A1A',
    label: "ATO 3 · 12'23\"",
  },
};

export const BaroqueDisc: React.FC<BaroqueDiscProps> = ({
  actNumber,
  actCode,
  tint,
  size = 240,
  spinning = false,
  glareX = 50,
  glareY = 40,
  isInteractive = false,
  holographicBoost = false,
}) => {
  const cfg = TINT_CONFIG[tint];
  const spinPlayState = getDiscSpinPlayState(spinning);

  return (
    <div
      data-spin-state={spinPlayState}
      className="relative rounded-full select-none overflow-hidden shadow-[0_18px_38px_-12px_rgba(0,0,0,0.45)] border border-white/65 animate-cd-spin"
      style={{
        width: size,
        height: size,
        background: cfg.baseGradient,
        animationPlayState: spinPlayState,
      }}
    >
      {/* Lace Floral & Stipple Metallic Texture from download (15).jpg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none opacity-85 mix-blend-multiply"
        style={{
          backgroundImage: `url('/assets/aistudio/download__15__ac4ada36.jpg')`,
          backgroundSize: '135% 135%',
          backgroundPosition: `${actNumber * 28}% ${actNumber * 22}%`,
          filter: 'contrast(1.35) brightness(1.04)',
        }}
      />

      {/* Second Metallic Silver Foil Highlight Pass from download (15).jpg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none opacity-65 mix-blend-screen"
        style={{
          backgroundImage: `url('/assets/aistudio/download__15__ac4ada36.jpg')`,
          backgroundSize: '135% 135%',
          backgroundPosition: `${actNumber * 28}% ${actNumber * 22}%`,
          filter: 'invert(1) contrast(1.45) brightness(0.95)',
        }}
      />

      {/* Iridescent Metallic CD Prism Sheen */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-full mix-blend-color-dodge pointer-events-none ${
          holographicBoost ? 'opacity-70' : 'opacity-45'
        }`}
        style={{
          background:
            'conic-gradient(from 40deg, rgba(255,255,255,0.75), rgba(248,204,225,0.55), rgba(32,113,184,0.48), rgba(227,205,50,0.58), rgba(140,225,255,0.48), rgba(255,255,255,0.82), rgba(248,204,225,0.55))',
        }}
      />

      {/* Halftone Stippled Ring & Relief Rim SVG */}
      <svg
        viewBox="0 0 240 240"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`rim-${actNumber}`} cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="transparent" />
            <stop offset="96%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="119" fill={`url(#rim-${actNumber})`} />
        <circle
          cx="120"
          cy="120"
          r="112"
          fill="none"
          stroke={cfg.metallicHighlight}
          strokeWidth="1.2"
          strokeDasharray="1.5 3.5"
        />
        <circle
          cx="120"
          cy="120"
          r="98"
          fill="none"
          stroke={cfg.stippleStroke}
          strokeWidth="0.9"
          strokeDasharray="1 5"
        />
        <circle
          cx="120"
          cy="120"
          r="46"
          fill="none"
          stroke={cfg.metallicHighlight}
          strokeWidth="1.4"
        />
      </svg>

      {/* Dynamic Specular Foil Light Reflection on Tilt */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${
            isInteractive ? 0.78 : 0.42
          }) 0%, rgba(255,255,255,0.2) 30%, transparent 64%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Inner Clear Acrylic Ring & Spindle Hole */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center border border-white/80 bg-white/38 backdrop-blur-[2px] shadow-inner"
        style={{ width: size * 0.34, height: size * 0.34 }}
      >
        <div
          className="rounded-full border border-black/35 bg-[#F7F5F0]/90 flex items-center justify-center shadow-inner"
          style={{ width: size * 0.145, height: size * 0.145 }}
        />
      </div>

      {/* Micro Galix Mono engraved label on disc */}
      {size >= 140 && (
        <div className="absolute inset-x-0 bottom-[21%] text-center pointer-events-none">
          <span
            className="font-galix text-[9px] uppercase px-1.5 py-0.5 bg-white/55 text-[#1A1A1A] border border-black/15"
          >
            {cfg.label}
          </span>
        </div>
      )}

      {/* Galix Mono Act Number (01 / 02 / 03) near top */}
      {size >= 110 && (
        <div className="absolute inset-x-0 top-[13%] text-center pointer-events-none">
          <span
            className="font-galix text-lg leading-none px-1.5 py-0.5 bg-white/65 text-[#1A1A1A] border border-black/15"
          >
            {actCode}
          </span>
        </div>
      )}
    </div>
  );
};
