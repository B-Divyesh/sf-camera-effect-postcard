import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the sample route, metadata, navigation, and designed 404 work as public pages', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.locator('#demo-banner')).toBeVisible();
  await expect(page).toHaveTitle('Demo — Postcard FX');

  await page.goto('/');
  const headers = (await page.goto('/'))?.headers() ?? {};
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['permissions-policy']).toContain('camera=(self), microphone=()');
  expect(headers['x-frame-options']).toBe('DENY');
  const assetCache = await page.evaluate(async () => {
    const script = globalThis.document.querySelector<HTMLScriptElement>('script[type="module"]');
    const response = await fetch(script!.src);
    return response.headers.get('cache-control');
  });
  expect(assetCache).toBe('public, max-age=31536000, immutable');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.png$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const social = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/social-preview.png';
    await image.decode();
    return { width: image.naturalWidth, height: image.naturalHeight };
  });
  expect(social).toEqual({ width: 1200, height: 630 });

  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveURL(/\/privacy\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy for your camera postcards');

  const response = await page.goto('/not-a-postcard-page');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Postcard FX');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  await expect(page.getByRole('link', { name: 'Open the postcard maker' })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((issue) => issue.impact === 'serious' || issue.impact === 'critical')).toEqual([]);
});
