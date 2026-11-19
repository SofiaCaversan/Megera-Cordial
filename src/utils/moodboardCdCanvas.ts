export type CdActNum = 1 | 2 | 3;

export interface CdPaletteSpec {
  actNumber: CdActNum;
  actTitle: 'ATO 1' | 'ATO 2' | 'ATO 3';
  actCode: '01' | '02' | '03';
  centerColor: string;
  midColor: string;
  edgeColor: string;
  rimDark: string;
  textColor: string;
  labelBg: string;
  badgeText: string;
}

const CD_PALETTES: Record<CdActNum, CdPaletteSpec> = {
  1: {
    actNumber: 1,
    actTitle: 'ATO 1',
    actCode: '01',
    centerColor: '#FDE5F0',
    midColor: '#F8CCE1',
    edgeColor: '#E19EBE',
    rimDark: '#C06E96',
    textColor: '#1A1A1A',
    labelBg: 'rgba(255, 255, 255, 0.72)',
    badgeText: 'ATO 1',
  },
  2: {
    actNumber: 2,
    actTitle: 'ATO 2',
    actCode: '02',
    centerColor: '#7AB5EA',
    midColor: '#2071B8',
    edgeColor: '#15538C',
    rimDark: '#0B3259',
    textColor: '#1A1A1A',
    labelBg: 'rgba(255, 255, 255, 0.82)',
    badgeText: 'ATO 2',
  },
  3: {
    actNumber: 3,
    actTitle: 'ATO 3',
    actCode: '03',
    centerColor: '#F6EA7C',
    midColor: '#E3CD32',
    edgeColor: '#BFA918',
    rimDark: '#8E7B0B',
    textColor: '#1A1A1A',
    labelBg: 'rgba(255, 255, 255, 0.76)',
    badgeText: 'ATO 3',
  },
};

export function getCdPaletteSpec(act: 1 | 2 | 3): CdPaletteSpec {
  return CD_PALETTES[act];
}

export function renderMetallicCdToOffscreenCanvas(
  drawSize: number,
  act: 1 | 2 | 3,
  laceTexture?: HTMLImageElement | null
): HTMLCanvasElement {
  const pad = 6;
  const side = Math.ceil(drawSize + pad * 2);
  const off = document.createElement('canvas');
  off.width = side;
  off.height = side;
  const ctx = off.getContext('2d');
  if (!ctx) return off;

  const cx = side / 2;
  const cy = side / 2;
  const radius = drawSize / 2;
  const spec = getCdPaletteSpec(act);

  // 1. Base tinted disc gradient (matches BaroqueDisc radial gradient)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const baseGrad = ctx.createRadialGradient(
    cx - radius * 0.25,
    cy - radius * 0.3,
    radius * 0.08,
    cx,
    cy,
    radius
  );
  baseGrad.addColorStop(0, spec.centerColor);
  baseGrad.addColorStop(0.48, spec.midColor);
  baseGrad.addColorStop(0.84, spec.edgeColor);
  baseGrad.addColorStop(1, spec.rimDark);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, side, side);

  // Optional subtle lace/stipple foil texture from download (15).jpg if loaded
  if (laceTexture && laceTexture.complete && laceTexture.naturalWidth > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(laceTexture, cx - radius, cy - radius, drawSize, drawSize);
    ctx.restore();
  }

  // 2. Iridescent conic prism sheen + triangular rainbow reflection wedges
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.62;
  if (typeof ctx.createConicGradient === 'function') {
    const conic = ctx.createConicGradient(0.7, cx, cy);
    conic.addColorStop(0.0, 'rgba(255, 255, 255, 0.72)');
    conic.addColorStop(0.16, 'rgba(248, 204, 225, 0.52)');
    conic.addColorStop(0.32, 'rgba(32, 113, 184, 0.45)');
    conic.addColorStop(0.48, 'rgba(227, 205, 50, 0.56)');
    conic.addColorStop(0.64, 'rgba(140, 225, 255, 0.50)');
    conic.addColorStop(0.82, 'rgba(255, 255, 255, 0.80)');
    conic.addColorStop(1.0, 'rgba(255, 255, 255, 0.72)');
    ctx.fillStyle = conic;
    ctx.fillRect(0, 0, side, side);
  }
  ctx.restore();

  // Cross-diagonal iridescent light wedges (CD optical diffraction)
  const prismWedges: Array<{ a1: number; a2: number; color: string }> = [
    { a1: -0.95, a2: -0.52, color: 'rgba(255, 255, 255, 0.42)' },
    { a1: -0.52, a2: -0.25, color: 'rgba(165, 220, 255, 0.34)' },
    { a1: 2.15, a2: 2.58, color: 'rgba(255, 255, 255, 0.42)' },
    { a1: 2.58, a2: 2.86, color: 'rgba(248, 204, 225, 0.36)' },
    { a1: 0.42, a2: 0.72, color: 'rgba(227, 205, 50, 0.28)' },
  ];
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  for (const w of prismWedges) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, w.a1, w.a2);
    ctx.closePath();
    ctx.fillStyle = w.color;
    ctx.fill();
  }
  ctx.restore();

  // Diagonal metallic specular sweep
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const sweep = ctx.createLinearGradient(
    cx - radius,
    cy - radius * 0.8,
    cx + radius,
    cy + radius * 0.8
  );
  sweep.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sweep.addColorStop(0.36, 'rgba(255, 255, 255, 0.10)');
  sweep.addColorStop(0.5, 'rgba(255, 255, 255, 0.38)');
  sweep.addColorStop(0.64, 'rgba(255, 255, 255, 0.08)');
  sweep.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, side, side);
  ctx.restore();

  // 3. Radial inner hub silver/translucent ring & outer specular rim highlight
  const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.76, cx, cy, radius);
  rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  rimGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.32)');
  rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, side, side);

  // Subtle concentric stipple/track rings
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.48)';
  ctx.lineWidth = Math.max(1, drawSize * 0.006);
  ctx.setLineDash([2, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([1.5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Translucent silver inner acrylic clamping ring around the center hole
  const hubRadius = radius * 0.34;
  const hubGrad = ctx.createRadialGradient(cx, cy, radius * 0.14, cx, cy, hubRadius);
  hubGrad.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
  hubGrad.addColorStop(0.65, 'rgba(235, 241, 248, 0.44)');
  hubGrad.addColorStop(1, 'rgba(255, 255, 255, 0.22)');
  ctx.beginPath();
  ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
  ctx.fillStyle = hubGrad;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.stroke();

  // 4. Crisp top typography (Act Code at top, ATO X badge at bottom) above sheen
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  // Top code badge (01 / 02 / 03)
  const topFontSize = Math.max(12, Math.round(drawSize * 0.095));
  ctx.font = `500 ${topFontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const codeText = spec.actCode;
  const codeW = ctx.measureText(codeText).width + topFontSize * 0.7;
  const codeH = topFontSize * 1.35;
  const codeY = cy - radius * 0.56;
  ctx.fillStyle = spec.labelBg;
  ctx.fillRect(cx - codeW / 2, codeY - codeH / 2, codeW, codeH);
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - codeW / 2, codeY - codeH / 2, codeW, codeH);
  ctx.fillStyle = spec.textColor;
  ctx.fillText(codeText, cx, codeY + 0.5);

  // Bottom act label badge (ATO 1 / ATO 2 / ATO 3)
  const labelFontSize = Math.max(10, Math.round(drawSize * 0.072));
  ctx.font = `600 ${labelFontSize}px monospace`;
  const actText = spec.badgeText;
  const actW = ctx.measureText(actText).width + labelFontSize * 1.1;
  const actH = labelFontSize * 1.5;
  const actY = cy + radius * 0.56;
  ctx.fillStyle = spec.labelBg;
  ctx.fillRect(cx - actW / 2, actY - actH / 2, actW, actH);
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.22)';
  ctx.strokeRect(cx - actW / 2, actY - actH / 2, actW, actH);
  ctx.fillStyle = spec.textColor;
  ctx.fillText(actText, cx, actY + 0.5);

  ctx.restore(); // end outer circular clip

  // Outer rim stroke
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.85)';
  ctx.stroke();

  // 5. True transparent (cut-out) center spindle hole + crisp inner edge ring
  const holeRadius = radius * 0.145;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.45)';
  ctx.stroke();

  return off;
}
