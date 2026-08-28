import { describe, expect, it } from 'vitest';
import { isSavedSettings } from '../src/storage';

const valid = { effect: 'orbit', timer: 3, mirror: true, frozen: false, caption: 'A bright hello' };

describe('saved preferences validation', () => {
  it('accepts only the exact persisted preference shape', () => {
    expect(isSavedSettings(valid)).toBe(true);
    expect(isSavedSettings({ ...valid, effect: 'unknown' })).toBe(false);
    expect(isSavedSettings({ ...valid, timer: 7 })).toBe(false);
    expect(isSavedSettings({ ...valid, mirror: 'true' })).toBe(false);
    expect(isSavedSettings({ ...valid, frozen: null })).toBe(false);
    expect(isSavedSettings({ ...valid, caption: 'x'.repeat(43) })).toBe(false);
    expect(isSavedSettings({ ...valid, unexpected: 'field' })).toBe(false);
    expect(isSavedSettings({ product: 'postcard-fx', version: 1, settings: 'corrupt' })).toBe(false);
  });
});
