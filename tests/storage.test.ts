import { describe, expect, it } from 'vitest';
import { dataUrlToBlob, isSavedSettings } from '../src/storage';

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

describe('local data URL decoding', () => {
  it('decodes a PNG without making a CSP-governed network request', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error('fetch must not be used'));
    try {
      const blob = await dataUrlToBlob('data:image/png;base64,iVBORw0KGgo=');
      expect(blob.type).toBe('image/png');
      expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
