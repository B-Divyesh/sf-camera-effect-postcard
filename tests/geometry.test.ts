import { describe, expect, it } from 'vitest';
import { coverCrop, mapFaceBox } from '../src/geometry';

describe('orientation-safe capture geometry', () => {
  it('crops landscape camera frames without squashing', () => {
    expect(coverCrop(1920, 1080, 1200, 1500)).toEqual({ sx: 528, sy: 0, sw: 864, sh: 1080 });
  });

  it('crops tall preview art from top and bottom', () => {
    expect(coverCrop(768, 1152, 1200, 1500)).toEqual({ sx: 0, sy: 96, sw: 768, sh: 960 });
  });

  it('maps and mirrors a detected face into the crop', () => {
    const mapped = mapFaceBox({ x: 700, y: 200, width: 300, height: 360 }, { sx: 528, sy: 0, sw: 864, sh: 1080 }, 1200, 1500, true);
    expect(mapped.x).toBeCloseTo(544.44, 1);
    expect(mapped.y).toBeCloseTo(277.78, 1);
    expect(mapped.width).toBeCloseTo(416.67, 1);
    expect(mapped.height).toBe(500);
  });
});
