import type { Box } from './geometry';

export type EffectName = 'orbit' | 'rays' | 'confetti';

const colors = { ink: '#17233B', cobalt: '#2453D4', coral: '#B83A3A', acid: '#C7E84B', paper: '#FFF8E8' };

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string, stroke = colors.ink, line = 0) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (line) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, fill: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 ? size * 0.42 : size;
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = colors.ink; ctx.lineWidth = Math.max(2, size * 0.08); ctx.stroke(); ctx.restore();
}

export function drawEffect(ctx: CanvasRenderingContext2D, width: number, height: number, face: Box, effect: EffectName, time = 0, frozen = false) {
  const cx = face.x + face.width / 2;
  const cy = face.y + face.height / 2;
  const unit = Math.min(width, height) / 100;
  const phase = frozen ? 0 : time * 0.00035;
  ctx.save();
  ctx.lineCap = 'round';

  if (effect === 'orbit') {
    ctx.strokeStyle = colors.ink; ctx.lineWidth = 0.7 * unit;
    ctx.beginPath(); ctx.ellipse(cx, cy, face.width * 0.88, face.height * 0.68, -0.22, 0, Math.PI * 2); ctx.stroke();
    const points = [
      [cx + Math.cos(phase) * face.width * 0.88, cy + Math.sin(phase) * face.height * 0.68, colors.acid, 4.6],
      [cx + Math.cos(phase + 2.1) * face.width * 0.88, cy + Math.sin(phase + 2.1) * face.height * 0.68, colors.coral, 6.2],
      [cx + Math.cos(phase + 4.2) * face.width * 0.88, cy + Math.sin(phase + 4.2) * face.height * 0.68, colors.cobalt, 4.1]
    ] as const;
    points.forEach(([x, y, color, radius]) => circle(ctx, x, y, radius * unit, color, colors.ink, 0.6 * unit));
    for (const side of [-1, 1]) {
      ctx.fillStyle = side < 0 ? colors.coral : colors.acid;
      ctx.fillRect(cx + side * face.width * 0.62 - 3 * unit, cy - face.height * 0.58, 6 * unit, 18 * unit);
    }
  } else if (effect === 'rays') {
    ctx.strokeStyle = colors.acid; ctx.lineWidth = 2.1 * unit;
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2 + phase * 0.18;
      const inner = Math.max(face.width, face.height) * 0.72;
      const outer = inner + (i % 3 === 0 ? 16 : 10) * unit;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner); ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer); ctx.stroke();
    }
    circle(ctx, cx - face.width * 0.25, cy - face.height * 0.05, 4.5 * unit, colors.cobalt, colors.paper, 1 * unit);
    circle(ctx, cx + face.width * 0.25, cy - face.height * 0.05, 4.5 * unit, colors.cobalt, colors.paper, 1 * unit);
  } else {
    const seeds = [[12,18,1],[84,15,2],[10,45,3],[88,43,4],[17,73,5],[78,69,6],[48,11,7],[55,76,8],[31,63,9],[70,35,10]];
    seeds.forEach(([px, py, seed], index) => {
      const bob = frozen ? 0 : Math.sin(phase * 3 + seed) * 1.2 * unit;
      const x = (px / 100) * width; const y = (py / 100) * height + bob;
      if (index % 3 === 0) star(ctx, x, y, 4.8 * unit, seed + phase, index % 2 ? colors.coral : colors.acid);
      else if (index % 3 === 1) circle(ctx, x, y, 3.8 * unit, index % 2 ? colors.cobalt : colors.coral, colors.ink, 0.6 * unit);
      else { ctx.save(); ctx.translate(x,y); ctx.rotate(seed + phase); ctx.fillStyle = colors.acid; ctx.fillRect(-4 * unit,-1.6 * unit,8 * unit,3.2 * unit); ctx.restore(); }
    });
  }
  ctx.restore();
}

export function drawPostcardFrame(ctx: CanvasRenderingContext2D, width: number, height: number, caption: string) {
  const unit = Math.min(width, height) / 100;
  ctx.save();
  ctx.strokeStyle = colors.paper; ctx.lineWidth = 2.2 * unit; ctx.strokeRect(3.4 * unit, 3.4 * unit, width - 6.8 * unit, height - 6.8 * unit);
  ctx.fillStyle = 'rgba(23,35,59,.90)'; ctx.fillRect(0, height - 15 * unit, width, 15 * unit);
  ctx.font = `700 ${Math.max(18, 4.2 * unit)}px Georgia, serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = colors.paper;
  ctx.fillText(caption || 'A little hello ✦', 5 * unit, height - 7.5 * unit, width - 24 * unit);
  ctx.font = `700 ${Math.max(12, 1.7 * unit)}px system-ui, sans-serif`; ctx.textAlign = 'right';
  ctx.fillStyle = colors.acid; ctx.fillText('POSTCARD FX', width - 5 * unit, height - 7.5 * unit);
  ctx.restore();
}
