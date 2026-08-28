import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('static deployment response policy', () => {
  it('ships enforcing privacy and immutable versioned-asset headers', async () => {
    const source = await readFile(resolve(process.cwd(), 'public/staticwebapp.config.json'), 'utf8');
    const config = JSON.parse(source) as { globalHeaders: Record<string, string>; routes: Array<{ route: string; headers?: Record<string, string> }> };
    expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Permissions-Policy']).toContain('camera=(self), microphone=()');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
    expect(config.routes).toContainEqual({ route: '/assets/*', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' } });
  });
});
