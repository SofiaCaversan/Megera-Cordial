import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Sparkles, Quote } from 'lucide-react';
import { CHARACTERS, type CharacterProfile } from '../data/projectData';
import type { CharacterId } from '../utils/moodboardLogic';
import {
  FLIP_BUTTON_LABEL,
  formatArchivalBadge,
  getCardBackTheme,
  getCardFaceRotation,
} from '../utils/characterCardLogic';

interface SingleCharacterCardProps {
  character: CharacterProfile;
  customPhotoUrl?: string;
  onUploadPhoto: (id: CharacterId, file: File) => void;
  onSelectForMoodboard: (id: CharacterId) => void;
}

const VictorianLaceTrim: React.FC<{ color: string; position: 'top' | 'bottom' }> = ({
  color,
  position,
}) => (
  <svg
    viewBox="0 0 300 14"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={`pointer-events-none w-full h-3 opacity-55 shrink-0 ${
      position === 'bottom' ? 'rotate-180' : ''
    }`}
  >
    <defs>
      <pattern
        id={`lace-${position}-${color.replace('#', '')}`}
        width="20"
        height="14"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M0 2 Q5 12 10 2 Q15 12 20 2"
          fill="none"
          stroke={color}
          strokeWidth="1"
        />
        <circle cx="5" cy="6.2" r="1.1" fill={color} fillOpacity="0.65" />
        <circle cx="15" cy="6.2" r="1.1" fill={color} fillOpacity="0.65" />
        <circle cx="10" cy="2" r="0.9" fill={color} />
      </pattern>
    </defs>
    <rect width="300" height="14" fill={`url(#lace-${position}-${color.replace('#', '')})`} />
  </svg>
);

const SingleCharacterCard: React.FC<SingleCharacterCardProps> = ({
  character,
  customPhotoUrl,
  onUploadPhoto,
  onSelectForMoodboard,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 35 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFlipped) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - ny) * 16,
      ry: (nx - 0.5) * 16,
      gx: Math.round(nx * 100),
      gy: Math.round(ny * 100),
    });
  };

  const resetTilt = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 35 });
  };

  const rotation = getCardFaceRotation(isFlipped, tilt.rx, tilt.ry);
  const backTheme = getCardBackTheme(character.id);

  return (
    <div
      className="perspective-1400 w-full max-w-[314px] mx-auto"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <motion.div
        animate={rotation}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="preserve-3d relative w-full h-[436px]"
      >
        {/* FRONT OF CARD */}
        <div
          data-testid={`card-front-${character.id}`}
          aria-hidden={isFlipped}
          className={`backface-hidden absolute inset-0 rounded-xl border-2 border-[#1A1A1A] overflow-hidden flex flex-col justify-between p-3.5 transition-shadow ${
            isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
          style={{
            backgroundColor: character.primaryColor,
            color: character.textOnPrimary,
            boxShadow: `0 22px 42px -14px rgba(0,0,0,0.42), inset 0 0 0 2px rgba(255,255,255,0.62), inset ${(tilt.gx - 50) * 0.25}px ${(tilt.gy - 50) * 0.25}px 22px rgba(255,255,255,0.45)`,
          }}
        >
          {/* Layer 1: Laminated Reflective Border Bevel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[3px] rounded-[9px] border border-white/70"
            style={{
              background: `linear-gradient(${115 + (tilt.gx - 50) * 1.4}deg, rgba(255,255,255,0.42) 0%, transparent 32%, transparent 68%, rgba(255,255,255,0.38) 100%)`,
              mixBlendMode: 'overlay',
            }}
          />

          {/* Layer 2: Prismatic Holographic Foil Sweep (color-dodge) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-65 mix-blend-color-dodge"
            style={{
              backgroundImage: `linear-gradient(${125 + (tilt.gx - 50) * 1.2}deg, transparent 10%, rgba(248,204,225,0.75) 28%, rgba(32,113,184,0.7) 46%, rgba(227,205,50,0.85) 62%, rgba(255,255,255,0.85) 76%, transparent 90%)`,
              backgroundPosition: `${tilt.gx}% ${tilt.gy}%`,
              backgroundSize: '180% 180%',
            }}
          />

          {/* Layer 3: Intense Diagonal Mirror Glint Strip (overlay) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
            style={{
              background: `linear-gradient(${105 + (tilt.gy - 50) * 0.8}deg, transparent ${Math.max(0, tilt.gx - 28)}%, rgba(255,255,255,0.95) ${tilt.gx}%, transparent ${Math.min(100, tilt.gx + 28)}%)`,
            }}
          />

          {/* Layer 4: Specular Hotspot Tracking Pointer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen"
            style={{
              background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.28) 22%, transparent 56%)`,
            }}
          />

          {/* Top Header */}
          <div className="relative z-10 flex items-start justify-between gap-2 border-b pb-1.5" style={{ borderColor: `${character.textOnPrimary}26` }}>
            <div>
              <p className="font-galix text-[8.5px] uppercase opacity-85">
                {character.cardNumber}
              </p>
              <h3 className="font-script text-[32px] leading-none mt-0.5">{character.name}</h3>
            </div>
            <Sparkles className="w-3.5 h-3.5 opacity-90 shrink-0 mt-1" />
          </div>

          {/* Portrait Slot + Clean Upload Action */}
          <div className="relative z-10 my-2 flex-1 min-h-0 rounded border border-[#1A1A1A]/30 bg-black/10 overflow-hidden group">
            {customPhotoUrl ? (
              <>
                <img
                  src={customPhotoUrl}
                  alt={`Retrato de ${character.name}`}
                  className="w-full h-full object-cover"
                />
                <label className="cursor-pointer absolute top-1.5 right-1.5 flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-mono-ui bg-[#F7F5F0]/95 text-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#E3CD32] transition-colors shadow-sm">
                  <Upload className="w-3 h-3" />
                  <span>Trocar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={`Enviar fotografia para ${character.name}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadPhoto(character.id, file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </>
            ) : (
              <label className="cursor-pointer w-full h-full flex items-center justify-center p-4 text-center hover:bg-black/5 transition-colors">
                <span
                  className="font-mono-ui text-[10.5px] uppercase tracking-[0.12em] px-3 py-2 border border-dashed transition-colors"
                  style={{ borderColor: `${character.textOnPrimary}55` }}
                >
                  Suba sua imagem aqui
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label={`Enviar fotografia para ${character.name}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadPhoto(character.id, file);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>

          {/* Archetype & Inline Traits (Zero-Pill discipline) */}
          <div className="relative z-10 space-y-1.5 shrink-0">
            <div>
              <p className="font-editorial italic text-base leading-tight">
                “{character.archetype}”
              </p>
              <p className="font-mono-ui text-[9.5px] opacity-80 mt-0.5 leading-tight">
                {character.traits.join(' · ')}
              </p>
            </div>

            <div className="pt-1.5 border-t flex items-center justify-between gap-2" style={{ borderColor: `${character.textOnPrimary}26` }}>
              <span className="font-mono-ui text-[10px] truncate opacity-85">
                Voz: {character.voiceActor}
              </span>
              <button
                type="button"
                data-testid={`flip-front-${character.id}`}
                onClick={() => setIsFlipped(true)}
                aria-label={`Virar ficha de ${character.name} para ver biografia e monólogo`}
                className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-galix uppercase bg-[#1A1A1A] text-[#F7F5F0] border border-white/40 hover:bg-[#2071B8] transition-colors cursor-pointer"
              >
                <span>{FLIP_BUTTON_LABEL}</span>
              </button>
            </div>
          </div>
        </div>

        {/* BACK OF CARD (180deg rotated, Megera Cordial Color Identity + Printed Cardstock Texture + Victorian Lace) */}
        <div
          data-testid={`card-back-${character.id}`}
          aria-hidden={!isFlipped}
          style={{
            transform: 'rotateY(180deg)',
            backgroundColor: backTheme.surfaceBg,
            color: backTheme.surfaceInk,
          }}
          className={`backface-hidden zine-cardstock-surface absolute inset-0 rounded-xl border-2 border-[#1A1A1A] p-3.5 flex flex-col justify-between overflow-hidden ${
            isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* Subtle Inner Zine Frame + Victorian Lace Corner Notches */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-2 rounded-lg border border-dashed"
            style={{ borderColor: backTheme.ruleColor }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-1"
          >
            <VictorianLaceTrim color={backTheme.laceColor} position="top" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 bottom-1"
          >
            <VictorianLaceTrim color={backTheme.laceColor} position="bottom" />
          </div>

          {/* Header: Technical Metadata + SloopScript Character Name + Integrated Flip Button */}
          <div
            className="relative z-10 mt-1.5 border-b pb-1.5 flex items-start justify-between gap-2 px-1 shrink-0"
            style={{ borderColor: backTheme.ruleColor }}
          >
            <div className="min-w-0">
              <p
                className="font-vintage text-[9.5px] uppercase tracking-[0.05em] leading-tight whitespace-nowrap"
                style={{ color: backTheme.kickerInk }}
              >
                Ficha · {formatArchivalBadge(character.name, character.age)}
              </p>
              <h3
                className="font-script text-[30px] leading-none mt-0.5"
                style={{ color: backTheme.surfaceInk }}
              >
                {character.name}
              </h3>
            </div>
            <button
              type="button"
              data-testid={`flip-back-${character.id}`}
              onClick={() => setIsFlipped(false)}
              aria-label={`Virar ficha de ${character.name} de volta para a frente`}
              style={{
                backgroundColor: backTheme.flipBtnBg,
                color: backTheme.flipBtnInk,
                borderColor: backTheme.flipBtnBorder,
              }}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-vintage uppercase tracking-[0.04em] border hover:brightness-105 transition-all cursor-pointer shadow-[2px_2px_0_#1A1A1A]"
            >
              <span>{FLIP_BUTTON_LABEL}</span>
            </button>
          </div>

          {/* Fine Zine Body & Color-Blocked Excerpt (scrolls discreetly only if ever needed) */}
          <div
            data-testid={`card-back-body-${character.id}`}
            className="relative z-10 flex-1 min-h-0 overflow-y-auto card-back-scroll px-1 py-1.5 flex flex-col"
          >
            <div className="my-auto space-y-2">
              <p className="font-vintage text-[12px] leading-[1.38]">
                {character.psychology}
              </p>

              {/* Fine Divider Line with Zine Diamond */}
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="flex-1 h-px" style={{ backgroundColor: backTheme.ruleColor }} />
                <span
                  className="w-1.5 h-1.5 rotate-45 border"
                  style={{ borderColor: backTheme.laceColor }}
                />
                <span className="flex-1 h-px" style={{ backgroundColor: backTheme.ruleColor }} />
              </div>

              {/* High-Contrast Color-Blocked Zine Excerpt */}
              <blockquote
                className="p-2 border rounded-sm"
                style={{
                  backgroundColor: backTheme.quoteBlockBg,
                  color: backTheme.quoteBlockInk,
                  borderColor: backTheme.quoteBlockBorder,
                }}
              >
                <div
                  className="flex items-start gap-1.5 text-[9px] font-vintage uppercase tracking-[0.03em] leading-tight mb-0.5"
                  style={{ color: backTheme.quoteContextInk }}
                >
                  <Quote className="w-2.5 h-2.5 shrink-0 mt-0.5" />
                  <span>{character.monologueContext}</span>
                </div>
                <p className="font-vintage text-[11.5px] leading-[1.35]">
                  {character.monologue}
                </p>
              </blockquote>

              <p
                className="font-vintage text-[9.5px] uppercase tracking-[0.03em] leading-tight opacity-95"
                style={{ color: backTheme.kickerInk }}
              >
                Motivos: {character.keyMotifs.join(' · ')}
              </p>
            </div>
          </div>

          {/* Footer: Voice Credit + Moodboard Action in Identity Palette */}
          <div
            className="relative z-10 mb-1.5 pt-1.5 px-1 border-t flex items-center justify-between gap-2 shrink-0"
            style={{ borderColor: backTheme.ruleColor }}
          >
            <span className="font-vintage text-[10.5px] leading-tight opacity-95 truncate">
              Voz: {character.voiceActor}
            </span>
            <button
              type="button"
              onClick={() => onSelectForMoodboard(character.id)}
              style={{
                backgroundColor: backTheme.moodboardBtnBg,
                color: backTheme.moodboardBtnInk,
              }}
              className="shrink-0 whitespace-nowrap px-2 py-0.5 text-[9.5px] font-vintage uppercase tracking-[0.04em] border border-[#1A1A1A] hover:brightness-110 transition-all cursor-pointer"
            >
              Moodboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface CharacterCardsProps {
  selectedCharacter: CharacterId;
  onSelectForMoodboard: (id: CharacterId) => void;
}

export const CharacterCards: React.FC<CharacterCardsProps> = ({
  onSelectForMoodboard,
}) => {
  const [customPhotos, setCustomPhotos] = useState<Partial<Record<CharacterId, string>>>({});

  const handleUploadPhoto = (id: CharacterId, file: File) => {
    const url = URL.createObjectURL(file);
    setCustomPhotos((prev) => ({ ...prev, [id]: url }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.2em] text-[#2071B8]">
            CARDS COLECIONÁVEIS
          </p>
          <h2 className="font-script text-4xl text-[#1A1A1A] leading-none mt-1">
            Protagonistas em Três Atos
          </h2>
        </div>
        <p className="font-vintage text-[13.5px] leading-[1.62] text-[#5C5952]">
          Passe o cursor para o efeito foil ou clique em “{FLIP_BUTTON_LABEL}” para ler a ficha biográfica.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {CHARACTERS.map((char) => (
          <SingleCharacterCard
            key={char.id}
            character={char}
            customPhotoUrl={customPhotos[char.id]}
            onUploadPhoto={handleUploadPhoto}
            onSelectForMoodboard={onSelectForMoodboard}
          />
        ))}
      </div>
    </div>
  );
};
