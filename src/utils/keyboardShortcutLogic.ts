export interface ShortcutTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  closest?: (selector: string) => unknown;
}

const EDITABLE_TAG_NAMES = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function isEditableEventTarget(target: ShortcutTargetLike | EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const candidate = target as ShortcutTargetLike;
  const tag = typeof candidate.tagName === 'string' ? candidate.tagName.toUpperCase() : '';
  if (EDITABLE_TAG_NAMES.has(tag)) return true;
  if (candidate.isContentEditable) return true;
  if (typeof candidate.closest === 'function') {
    if (candidate.closest('[contenteditable="true"]') || candidate.closest('[contenteditable=""]')) {
      return true;
    }
  }
  return false;
}

export function shouldHandleCanvasDeleteKey(
  key: string,
  target: ShortcutTargetLike | EventTarget | null
): boolean {
  if (key !== 'Delete' && key !== 'Backspace') return false;
  return !isEditableEventTarget(target);
}
