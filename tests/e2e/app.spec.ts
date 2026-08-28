import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('keyboard preview path creates and retains a portrait PNG', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/');
  await expect(page).toHaveTitle(/Postcard FX/);
  await expect(page.locator('h1')).toHaveCount(1);

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeVisible();

  await page.locator('#preview-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#capture-button')).toBeEnabled();
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#caption-input').fill('Hello from right here');
  await page.locator('[data-effect="confetti"]').focus();
  await page.keyboard.press('Enter');
  await page.locator('#capture-button').focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#download-link')).toBeFocused();
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalWidth', 1200);
  expect(consoleErrors).toEqual([]);
});

test('main and legal pages have no serious accessibility violations', async ({ page }) => {
  for (const path of ['/', '/privacy/', '/terms/']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const important = results.violations.filter((issue) => issue.impact === 'serious' || issue.impact === 'critical');
    expect(important, `${path}: ${important.map((item) => `${item.id}: ${item.help}`).join(', ')}`).toEqual([]);
  }
});

test('installed shell reopens offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('geometry');
  await page.locator('#preview-button').click();
  await expect(page.locator('#capture-button')).toBeEnabled();
  await context.setOffline(false);
});

test('malformed backup never persists invalid preferences and startup recovers old bad data', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  const existingSettings = { effect: 'rays', timer: 10, mirror: false, frozen: true, caption: 'Keep this postcard setting' };
  await page.evaluate((settings) => localStorage.setItem('postcard-fx-settings', JSON.stringify(settings)), existingSettings);

  await page.locator('#import-data').setInputFiles({
    name: 'corrupt-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ product: 'postcard-fx', version: 1, settings: 'corrupt' }))
  });
  await expect(page.locator('#toast-text')).toHaveText('That file is not a valid Postcard FX backup.');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('postcard-fx-settings'))).toBe(JSON.stringify(existingSettings));

  // A legacy/manual bad local value must be cleared before app setup can break.
  await page.evaluate(() => localStorage.setItem('postcard-fx-settings', JSON.stringify({ caption: null })));
  await page.reload();
  await expect(page.locator('#camera-status')).toContainText('Saved preferences were invalid and have been reset');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('postcard-fx-settings'))).toBeNull();
  await page.locator('#preview-button').click();
  await expect(page.locator('#capture-button')).toBeEnabled();
  expect(pageErrors).toEqual([]);
});

test('the visible import backup control shows focus when its file input is tabbed to', async ({ page }) => {
  await page.goto('/');
  await page.locator('#import-data').focus();
  await expect(page.locator('#import-data')).toBeFocused();
  await expect(page.locator('.import-label')).toHaveCSS('outline-width', '3px');
  await expect(page.locator('.import-label')).toHaveCSS('outline-style', 'solid');
});
