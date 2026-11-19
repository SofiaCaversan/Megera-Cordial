export type ActNumber = 1 | 2 | 3;

export interface CdCoverArtwork {
  actNumber: ActNumber;
  imageUrl: string;
  alt: string;
  objectPosition: string;
}

export const INITIAL_CD_CASE_OPEN = false;

export const CD_COVER_ARTWORKS: Record<ActNumber, CdCoverArtwork> = {
  1: {
    actNumber: 1,
    imageUrl: '/assets/aistudio/capa-cd/IMG_1562.PNG',
    alt: 'Ilustração da poltrona azul na tampa acrílica do CD 01',
    objectPosition: '62% 52%',
  },
  2: {
    actNumber: 2,
    imageUrl: '/assets/aistudio/capa-cd/IMG_1558.PNG',
    alt: 'Ilustração do relógio vitoriano azul na tampa acrílica do CD 02',
    objectPosition: '50% 50%',
  },
  3: {
    actNumber: 3,
    imageUrl: '/assets/aistudio/capa-cd/IMG_1557.PNG',
    alt: 'Ilustração do recamier azul na tampa acrílica do CD 03',
    objectPosition: '50% 52%',
  },
};

export function getCoverArtForAct(actNumber: ActNumber): CdCoverArtwork {
  return CD_COVER_ARTWORKS[actNumber];
}

export function getLidTransformState(isOpen: boolean): {
  rotateY: number;
  z: number;
  opacity: number;
  buttonLabel: string;
} {
  return isOpen
    ? {
        rotateY: -116,
        z: 10,
        opacity: 0.72,
        buttonLabel: 'Fechar Capa',
      }
    : {
        rotateY: 0,
        z: 10,
        opacity: 1,
        buttonLabel: 'Abrir Capa',
      };
}

export function nextShelfSelection(
  currentInspectedIndex: number,
  clickedIndex: number,
  currentOpened: boolean
): { inspectedIndex: number; caseOpened: boolean } {
  if (currentInspectedIndex === clickedIndex) {
    return {
      inspectedIndex: clickedIndex,
      caseOpened: !currentOpened,
    };
  }
  return {
    inspectedIndex: clickedIndex,
    caseOpened: false,
  };
}

export function getDiscSpinPlayState(isSpinning: boolean): 'running' | 'paused' {
  return isSpinning ? 'running' : 'paused';
}

export function normalizeAngle360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Returns true when the 3D jewel case is rotated past 90° and below 270°,
 * exposing its transparent acrylic back side with the act synopsis.
 */
export function isBackSideVisible(rotateY: number): boolean {
  const norm = normalizeAngle360(rotateY);
  return norm > 90 && norm < 270;
}

export function computeDragRotation(params: {
  startX: number;
  currentX: number;
  startY: number;
  currentY: number;
  startRotateY: number;
  startRotateX: number;
}): { rotateY: number; rotateX: number } {
  const dx = params.currentX - params.startX;
  const dy = params.currentY - params.startY;
  const rotateY = params.startRotateY + dx * 0.75;
  const rotateX = Math.max(-24, Math.min(24, params.startRotateX - dy * 0.25));
  return { rotateY, rotateX };
}

/**
 * Computes the nearest smooth 180° target angle:
 * - From front (<=90° or >=270°) -> snaps cleanly to the nearest 180° back orientation.
 * - From back (90°..270°) -> snaps cleanly to the nearest 0° / 360° front orientation.
 */
export function computeFlip180Target(currentRotateY: number): {
  targetRotateY: number;
  showingBack: boolean;
} {
  const showingBackNow = isBackSideVisible(currentRotateY);
  if (!showingBackNow) {
    const target = Math.round((currentRotateY - 180) / 360) * 360 + 180;
    return { targetRotateY: target, showingBack: true };
  }
  const norm = normalizeAngle360(currentRotateY);
  const base = Math.floor(currentRotateY / 360) * 360;
  const target = norm <= 180 ? base : base + 360;
  return { targetRotateY: target, showingBack: false };
}

