export type TherapyAssetCategory = 'furniture' | 'architecture';

export interface TherapyCropBox {
  x: number;
  y: number;
  w: number;
  h: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface TherapyCatalogItem {
  id: string;
  fileName: string;
  label: string;
  category: TherapyAssetCategory;
  imageUrl: string;
  cropBox?: TherapyCropBox;
  defaultScale?: number;
  defaultPos?: { x: number; y: number };
  isAiGenerated?: boolean;
  blendMode?: 'normal' | 'lighten';
}

export interface TherapyRoomItemInstance {
  instanceId: string;
  catalogId: string;
  label: string;
  imageUrl: string;
  cropBox?: TherapyCropBox;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  scale: number; // 0.35..2.6
  rotation: number; // -180..180
  flipped: boolean; // horizontal mirror scaleX(-1)
  zIndex: number;
  isAiGenerated?: boolean;
  blendMode?: 'normal' | 'lighten';
}

export interface AiSvgStrokeSpec {
  d: string;
  role: 'primary_blue' | 'secondary_blue' | 'pink_accent' | 'pink_fill';
  strokeWidth?: number;
}

export interface AiFurnitureSvgSpec {
  label: string;
  paths: AiSvgStrokeSpec[];
}

export const SALA_TERAPIA_BACKGROUND = {
  imageUrl: '/assets/aistudio/sala-terapia/sala-fundo.png.png.png',
  width: 3542,
  height: 2514,
} as const;

export const SALA_TERAPIA_ASSETS: TherapyCatalogItem[] = [
  {
    id: 'sala-img-1555',
    fileName: 'IMG_1555.png',
    label: 'Estante em Arco',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1555.png',
    cropBox: { x: 1150, y: 50, w: 1540, h: 2370, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.25,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1556',
    fileName: 'IMG_1556.png',
    label: 'Almofadas',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1556.png',
    cropBox: { x: 490, y: 390, w: 2560, h: 1640, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 0.72,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1557',
    fileName: 'IMG_1557.png',
    label: 'Divã Clássico',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1557.png',
    cropBox: { x: 480, y: 250, w: 2570, h: 2210, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.35,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1558',
    fileName: 'IMG_1558.png',
    label: 'Relógio Romano',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1558.png',
    cropBox: { x: 630, y: 140, w: 2260, h: 2260, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 0.75,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1560',
    fileName: 'IMG_1560.png',
    label: 'Luminária de Chão',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1560.png',
    cropBox: { x: 370, y: 60, w: 1550, h: 2320, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.25,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1561',
    fileName: 'IMG_1561.png',
    label: 'Aparador Listrado',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1561.png',
    cropBox: { x: 580, y: 420, w: 2420, h: 1790, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.15,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1562',
    fileName: 'IMG_1562.png',
    label: 'Poltrona Tubular',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1562.png',
    cropBox: { x: 960, y: 310, w: 2530, h: 2060, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.05,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1563',
    fileName: 'IMG_1563.png',
    label: 'Poltrona Capitonê',
    category: 'furniture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1563.png',
    cropBox: { x: 80, y: 380, w: 2400, h: 2020, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.05,
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1565',
    fileName: 'IMG_1565.png',
    label: 'Janela Esquerda',
    category: 'architecture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1565.png',
    cropBox: { x: 40, y: 800, w: 830, h: 950, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.05,
    defaultPos: { x: 13, y: 49 },
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1566',
    fileName: 'IMG_1566.png',
    label: 'Janela Central',
    category: 'architecture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1566.png',
    cropBox: { x: 1120, y: 990, w: 970, h: 530, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.05,
    defaultPos: { x: 49, y: 44 },
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1567',
    fileName: 'IMG_1567.png',
    label: 'Janela Direita',
    category: 'architecture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1567.png',
    cropBox: { x: 2340, y: 760, w: 870, h: 960, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.05,
    defaultPos: { x: 86, y: 49 },
    blendMode: 'normal',
  },
  {
    id: 'sala-img-1568',
    fileName: 'IMG_1568.png',
    label: 'Tapete Rosa',
    category: 'architecture',
    imageUrl: '/assets/aistudio/sala-terapia/IMG_1568.png',
    cropBox: { x: 680, y: 1780, w: 1870, h: 540, canvasWidth: 3508, canvasHeight: 2480 },
    defaultScale: 1.75,
    defaultPos: { x: 50, y: 81 },
    blendMode: 'normal',
  },
];

export function clampRoomPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(94, Math.max(6, y)),
  };
}

export function clampRoomScale(scale: number): number {
  return Math.min(2.6, Math.max(0.35, Number(scale.toFixed(2))));
}

export function normalizeRoomRotation(deg: number): number {
  const normalized = ((deg + 180) % 360 + 360) % 360 - 180;
  return Math.round(normalized);
}

export function toggleRoomItemFlip(
  items: TherapyRoomItemInstance[],
  instanceId: string
): TherapyRoomItemInstance[] {
  return items.map((item) =>
    item.instanceId === instanceId ? { ...item, flipped: !item.flipped } : item
  );
}

export function moveRoomItemLayerUp(
  items: TherapyRoomItemInstance[],
  instanceId: string
): TherapyRoomItemInstance[] {
  const ordered = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const idx = ordered.findIndex((i) => i.instanceId === instanceId);
  if (idx === -1 || idx === ordered.length - 1) return items;

  const swapped = [...ordered];
  const current = swapped[idx];
  swapped[idx] = swapped[idx + 1];
  swapped[idx + 1] = current;

  const zMap = new Map<string, number>();
  swapped.forEach((it, orderIdx) => zMap.set(it.instanceId, orderIdx + 1));

  return items.map((it) => ({
    ...it,
    zIndex: zMap.get(it.instanceId) ?? it.zIndex,
  }));
}

export function moveRoomItemLayerDown(
  items: TherapyRoomItemInstance[],
  instanceId: string
): TherapyRoomItemInstance[] {
  const ordered = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const idx = ordered.findIndex((i) => i.instanceId === instanceId);
  if (idx <= 0) return items;

  const swapped = [...ordered];
  const current = swapped[idx];
  swapped[idx] = swapped[idx - 1];
  swapped[idx - 1] = current;

  const zMap = new Map<string, number>();
  swapped.forEach((it, orderIdx) => zMap.set(it.instanceId, orderIdx + 1));

  return items.map((it) => ({
    ...it,
    zIndex: zMap.get(it.instanceId) ?? it.zIndex,
  }));
}

export function getRoomItemLayerPosition(
  items: TherapyRoomItemInstance[],
  instanceId: string
): { layer: number; total: number } {
  const ordered = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const idx = ordered.findIndex((i) => i.instanceId === instanceId);
  return {
    layer: idx === -1 ? 0 : idx + 1,
    total: ordered.length,
  };
}

export function buildFixedAiFurniturePrompt(objectName: string): string {
  const cleaned = objectName.trim() || 'poltrona vintage';
  return `Minimalist hand-drawn sketchy line art illustration of ${cleaned} in perspective, drawn with rough blue crayon/pastel lines (#2071B8) and subtle dusty pink accents (#F8CCE1) isolated on a pure solid pitch-black (#000000) background, no shading, no floor, vintage editorial zine style.`;
}

function sanitizeSvgPathD(d: string): string {
  return d.replace(/[^MmLlHhVvCcSsQqTtAaZz0-9.,\s-]/g, '').trim();
}

export function buildCrayonFurnitureSvg(
  spec: AiFurnitureSvgSpec,
  options?: { includeBlackBg?: boolean }
): string {
  const includeBlackBg = options?.includeBlackBg ?? false;
  const safePaths = (spec.paths || [])
    .map((p) => ({
      d: sanitizeSvgPathD(p.d || ''),
      role: p.role,
      strokeWidth: Math.min(8, Math.max(1.8, Number(p.strokeWidth) || 3.4)),
    }))
    .filter((p) => p.d.length >= 4);

  const fallbackPath: AiSvgStrokeSpec[] =
    safePaths.length > 0
      ? safePaths
      : [
          {
            d: 'M72 225 L72 145 L248 145 L248 225 M92 145 L108 98 L224 98 L232 145 M86 225 L86 254 M234 225 L234 254',
            role: 'primary_blue',
            strokeWidth: 4,
          },
          {
            d: 'M102 126 Q160 116 218 126',
            role: 'pink_accent',
            strokeWidth: 4.5,
          },
        ];

  const renderedElements = fallbackPath
    .map((p) => {
      if (p.role === 'pink_fill') {
        return `<path d="${p.d}" fill="#F8CCE1" fill-opacity="0.72" stroke="#2071B8" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
      }
      if (p.role === 'pink_accent') {
        return `<path d="${p.d}" fill="none" stroke="#F8CCE1" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
      }
      if (p.role === 'secondary_blue') {
        return `<path d="${p.d}" fill="none" stroke="#2071B8" stroke-opacity="0.82" stroke-width="${Math.max(1.8, (p.strokeWidth ?? 3) * 0.72)}" stroke-linecap="round" stroke-linejoin="round" />`;
      }
      return `<path d="${p.d}" fill="none" stroke="#2071B8" stroke-width="${p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join('\n    ');

  const bgRect = includeBlackBg
    ? '<rect width="320" height="320" fill="#000000" />'
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <filter id="crayon-chalk" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="3" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
  ${bgRect}
  <g filter="url(#crayon-chalk)">
    ${renderedElements}
  </g>
</svg>`;
}

export function svgMarkupToDataUrl(svgMarkup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}
