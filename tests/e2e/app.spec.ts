import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('an exported image-bearing backup restores under the production response policy', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toContain("connect-src 'self'");
  await page.locator('#preview-button').click();
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#caption-input').fill('Round-trip this postcard');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-data').click();
  const backup = await downloadPromise;
  const backupPath = await backup.path();
  expect(backupPath).not.toBeNull();

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#delete-button').click();
  await expect(page.locator('#result')).toBeHidden();
  await page.locator('#import-data').setInputFiles(backupPath!);

  await expect(page.locator('#toast-text')).toHaveText('Local backup imported.');
  await expect(page.locator('#result')).toBeVisible();
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalWidth', 1200);
  await page.reload();
  await expect(page.locator('#restore-button')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reduced motion freezes animated canvas marks while ordinary motion remains live', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#preview-button').click();
  await page.waitForTimeout(200);
  const reducedA = await page.locator('#effects-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.waitForTimeout(700);
  const reducedB = await page.locator('#effects-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  expect(reducedB).toBe(reducedA);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const movingA = await page.locator('#effects-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.waitForTimeout(700);
  const movingB = await page.locator('#effects-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  expect(movingB).not.toBe(movingA);
});

test('persistent navigation targets are at least 44px at the required mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const selector of ['.wordmark', 'footer a[href="/privacy/"]', 'footer a[href="/terms/"]']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    expect(box!.width, `${selector} width`).toBeGreaterThanOrEqual(44);
    expect(box!.height, `${selector} height`).toBeGreaterThanOrEqual(44);
  }

  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    for (const selector of ['header .brand', 'header .back', 'footer a']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${path} ${selector}`).not.toBeNull();
      expect(box!.width, `${path} ${selector} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${path} ${selector} height`).toBeGreaterThanOrEqual(44);
    }
  }
});

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
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalWidth', 1200);
  await page.goto('/privacy/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your camera stays yours.');
  await context.setOffline(false);
});

test('normal use makes no third-party runtime requests', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') origins.add(url.origin);
  });
  await page.goto('/');
  await page.locator('#preview-button').click();
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result')).toBeVisible();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
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
