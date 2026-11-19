export function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function clampSeekRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(1, Math.max(0, ratio));
}

export function calculateSeekTime(clientX: number, rectLeft: number, rectWidth: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || rectWidth <= 0) {
    return 0;
  }
  const ratio = clampSeekRatio((clientX - rectLeft) / rectWidth);
  return ratio * duration;
}

export function parseDurationLabel(label: string): number {
  // Parses formats like "10'36\"" or "10:36"
  const match = label.match(/(\d+)\s*[':]\s*(\d+)/);
  if (!match) return 0;
  const mins = parseInt(match[1], 10);
  const secs = parseInt(match[2], 10);
  return mins * 60 + secs;
}
