export type CharacterId = 'ines' | 'sara' | 'margarida' | 'daniel';

export interface MoodboardItemInstance {
  instanceId: string;
  catalogId: string;
  label: string;
  kind: 'svg' | 'upload' | 'cd';
  x: number; // percentage 0..100 relative to board center
  y: number; // percentage 0..100 relative to board center
  rotation: number; // degrees
  scale: number; // 0.55..1.85
  zIndex: number;
  cdActNumber?: 1 | 2 | 3;
  customImageUrl?: string;
}

export function clampBoardPosition(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(90, Math.max(10, y)),
  };
}

export function clampScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(1.85, Math.max(0.55, Number(scale.toFixed(2))));
}

export function normalizeRotation(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let normalized = ((deg + 180) % 360 + 360) % 360 - 180;
  return Math.round(normalized);
}

/**
 * Arranges all items on the aluminum plate in a crisp knolling grid
 * (aligned at 0° or 90° angles with disciplined spacing).
 */
export function arrangeItemsKnolling(items: MoodboardItemInstance[]): MoodboardItemInstance[] {
  if (items.length === 0) return [];
  const count = items.length;
  const cols = count <= 2 ? count : count <= 6 ? 3 : 4;
  const rows = Math.ceil(count / cols);

  const marginX = 18;
  const marginY = 21;
  const spanX = 100 - marginX * 2;
  const spanY = 100 - marginY * 2;

  return items.map((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = cols === 1 ? 50 : marginX + (col / (cols - 1)) * spanX;
    const y = rows === 1 ? 50 : marginY + (row / (rows - 1)) * spanY;
    return {
      ...item,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      rotation: 0,
      scale: 0.95,
      zIndex: idx + 1,
    };
  });
}

export function bringItemToFront(items: MoodboardItemInstance[], instanceId: string): MoodboardItemInstance[] {
  const maxZ = items.reduce((acc, item) => Math.max(acc, item.zIndex), 0);
  return items.map((item) =>
    item.instanceId === instanceId ? { ...item, zIndex: maxZ + 1 } : item
  );
}

function normalizeLayers(sortedAscending: MoodboardItemInstance[]): MoodboardItemInstance[] {
  const zById = new Map<string, number>();
  sortedAscending.forEach((item, idx) => {
    zById.set(item.instanceId, idx + 1);
  });
  return sortedAscending.map((item) => ({
    ...item,
    zIndex: zById.get(item.instanceId) ?? item.zIndex,
  }));
}

export function moveItemLayerUp(items: MoodboardItemInstance[], instanceId: string): MoodboardItemInstance[] {
  if (items.length <= 1) return items;
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const idx = sorted.findIndex((it) => it.instanceId === instanceId);
  if (idx === -1 || idx === sorted.length - 1) return normalizeLayers(sorted);
  const next = [...sorted];
  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  const reindexed = normalizeLayers(next);
  const zMap = new Map(reindexed.map((it) => [it.instanceId, it.zIndex]));
  return items.map((it) => ({ ...it, zIndex: zMap.get(it.instanceId) ?? it.zIndex }));
}

export function moveItemLayerDown(items: MoodboardItemInstance[], instanceId: string): MoodboardItemInstance[] {
  if (items.length <= 1) return items;
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const idx = sorted.findIndex((it) => it.instanceId === instanceId);
  if (idx <= 0) return normalizeLayers(sorted);
  const next = [...sorted];
  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  const reindexed = normalizeLayers(next);
  const zMap = new Map(reindexed.map((it) => [it.instanceId, it.zIndex]));
  return items.map((it) => ({ ...it, zIndex: zMap.get(it.instanceId) ?? it.zIndex }));
}

export function getItemLayerPosition(
  items: MoodboardItemInstance[],
  instanceId: string
): { layer: number; total: number } {
  const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);
  const idx = sorted.findIndex((it) => it.instanceId === instanceId);
  return {
    layer: idx === -1 ? 0 : idx + 1,
    total: items.length,
  };
}

export interface MoodboardLibraryItem {
  id: string;
  label: string;
  imageUrl: string;
  isUserUpload?: boolean;
}

export function buildUnifiedMoodboardLibrary(
  numberedPngCount = 63,
  numberedJpgCount = 2
): MoodboardLibraryItem[] {
  const items: MoodboardLibraryItem[] = [];
  for (let i = 1; i <= numberedPngCount; i++) {
    const code = String(i).padStart(2, '0');
    items.push({
      id: `mb-item-${i}`,
      label: `Recorte ${code}`,
      imageUrl: encodeURI(`/assets/aistudio/moodboard/item (${i}).png`),
    });
  }
  for (let j = 1; j <= numberedJpgCount; j++) {
    const code = String(j).padStart(2, '0');
    items.push({
      id: `mb-jpg-${j}`,
      label: `Arquivo ${code}`,
      imageUrl: encodeURI(`/assets/aistudio/moodboard/item (${j}).jpg`),
    });
  }
  return items;
}

