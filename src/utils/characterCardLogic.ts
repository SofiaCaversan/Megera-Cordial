import type { CharacterId } from './moodboardLogic';

export const FLIP_BUTTON_LABEL = '↻ Virar Ficha';

export function formatArchivalBadge(name: string, age: number): string {
  return `${name.toUpperCase()} (${age})`;
}

export function getCardFaceRotation(isFlipped: boolean, tiltRx: number, tiltRy: number): {
  rotateY: number;
  rotateX: number;
} {
  return {
    rotateY: isFlipped ? 180 : tiltRy,
    rotateX: isFlipped ? 0 : tiltRx,
  };
}

export interface CardBackTheme {
  surfaceBg: string;
  surfaceInk: string;
  kickerInk: string;
  ruleColor: string;
  laceColor: string;
  quoteBlockBg: string;
  quoteBlockInk: string;
  quoteContextInk: string;
  quoteBlockBorder: string;
  flipBtnBg: string;
  flipBtnInk: string;
  flipBtnBorder: string;
  moodboardBtnBg: string;
  moodboardBtnInk: string;
}

const CARD_BACK_THEMES: Record<CharacterId, CardBackTheme> = {
  ines: {
    surfaceBg: '#F8CCE1',
    surfaceInk: '#1A1A1A',
    kickerInk: '#174E82',
    ruleColor: 'rgba(26, 26, 26, 0.32)',
    laceColor: '#2071B8',
    quoteBlockBg: '#2071B8',
    quoteBlockInk: '#FFFFFF',
    quoteContextInk: '#E3CD32',
    quoteBlockBorder: '#1A1A1A',
    flipBtnBg: '#E3CD32',
    flipBtnInk: '#1A1A1A',
    flipBtnBorder: '#1A1A1A',
    moodboardBtnBg: '#1A1A1A',
    moodboardBtnInk: '#F8CCE1',
  },
  sara: {
    surfaceBg: '#2071B8',
    surfaceInk: '#FFFFFF',
    kickerInk: '#F8CCE1',
    ruleColor: 'rgba(255, 255, 255, 0.36)',
    laceColor: '#E3CD32',
    quoteBlockBg: '#F8CCE1',
    quoteBlockInk: '#1A1A1A',
    quoteContextInk: '#2071B8',
    quoteBlockBorder: '#1A1A1A',
    flipBtnBg: '#E3CD32',
    flipBtnInk: '#1A1A1A',
    flipBtnBorder: '#1A1A1A',
    moodboardBtnBg: '#F8CCE1',
    moodboardBtnInk: '#1A1A1A',
  },
  margarida: {
    surfaceBg: '#A84B70',
    surfaceInk: '#FFFFFF',
    kickerInk: '#F8CCE1',
    ruleColor: 'rgba(248, 204, 225, 0.42)',
    laceColor: '#F8CCE1',
    quoteBlockBg: '#F8CCE1',
    quoteBlockInk: '#1A1A1A',
    quoteContextInk: '#7A2D4D',
    quoteBlockBorder: '#1A1A1A',
    flipBtnBg: '#E3CD32',
    flipBtnInk: '#1A1A1A',
    flipBtnBorder: '#1A1A1A',
    moodboardBtnBg: '#C86D92',
    moodboardBtnInk: '#FFFFFF',
  },
  daniel: {
    surfaceBg: '#E3CD32',
    surfaceInk: '#1A1A1A',
    kickerInk: '#174E82',
    ruleColor: 'rgba(26, 26, 26, 0.32)',
    laceColor: '#2071B8',
    quoteBlockBg: '#2071B8',
    quoteBlockInk: '#FFFFFF',
    quoteContextInk: '#F8CCE1',
    quoteBlockBorder: '#1A1A1A',
    flipBtnBg: '#F8CCE1',
    flipBtnInk: '#1A1A1A',
    flipBtnBorder: '#1A1A1A',
    moodboardBtnBg: '#1A1A1A',
    moodboardBtnInk: '#E3CD32',
  },
};

export function getCardBackTheme(characterId: CharacterId): CardBackTheme {
  return CARD_BACK_THEMES[characterId];
}
