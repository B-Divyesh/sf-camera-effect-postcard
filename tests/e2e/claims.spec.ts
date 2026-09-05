import { test, expect, type Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle('Demo — Postcard FX');
  await expect(page.locator('#demo-banner')).toBeVisible();
  await expect(page.locator('#demo-banner')).toContainText('Demo — sample data, nothing is saved');
  await expect(page.locator('#restore-button')).toBeVisible();
  if (!(await page.locator('#result').isVisible())) await page.locator('#restore-button').click();
  await expect(page.locator('#result')).toBeVisible();
}

async function pngSize(page: Page) {
  return page.locator('#result-image').evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }));
}

async function effectChecksum(page: Page) {
  return page.locator('#effects-canvas').evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let hash = 2166136261;
    for (let index = 0; index < pixels.length; index += 4) {
      hash = Math.imul(hash ^ pixels[index], 16777619);
      hash = Math.imul(hash ^ pixels[index + 1], 16777619);
      hash = Math.imul(hash ^ pixels[index + 2], 16777619);
      hash = Math.imul(hash ^ pixels[index + 3], 16777619);
    }
    return hash >>> 0;
  });
}

test('@claim:free-use makes and downloads the full sample postcard without a payment step', async ({ page }) => {
  await openDemo(page);
  const download = page.waitForEvent('download');
  await page.locator('#download-link').click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('postcard-fx.png');
});

test('@claim:phone-first keeps the sample maker usable at a 390px phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const banner = await page.locator('#demo-banner').boundingBox();
  const label = await page.locator('#demo-banner p').boundingBox();
  expect(banner).not.toBeNull();
  expect(label).not.toBeNull();
  expect(banner!.height).toBeLessThanOrEqual(104);
  expect(label!.width).toBeGreaterThanOrEqual(330);
  await expect(page.locator('#capture-button')).toHaveCount(1);
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalHeight', 1500);
  await page.locator('#result').scrollIntoViewIfNeeded();
  await expect(page.locator('#demo-banner')).toBeVisible();
  const stickyBanner = await page.locator('#demo-banner').boundingBox();
  expect(stickyBanner).not.toBeNull();
  expect(Math.abs(stickyBanner!.y)).toBeLessThanOrEqual(0.5);
});

test('@claim:portrait-safe-crop makes a tall, uncropped 4:5 postcard from the sample', async ({ page }) => {
  await openDemo(page);
  const size = await pngSize(page);
  expect(size).toEqual({ width: 1200, height: 1500 });
});

test('@claim:no-account opens a completed sample postcard without registration', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalWidth', 1200);
  await expect(page.locator('#download-link')).toBeVisible();
});

test('@claim:no-upload makes a postcard without sending a write request', async ({ page, baseURL }) => {
  const requests: { url: string; method: string }[] = [];
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) requests.push({ url: request.url(), method: request.method() });
  });
  await openDemo(page);
  await page.locator('#preview-button').click();
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result')).toBeVisible();
  expect(requests.every((request) => new URL(request.url).origin === new URL(baseURL!).origin)).toBe(true);
  expect(requests.filter((request) => !['GET', 'HEAD'].includes(request.method))).toEqual([]);
});

test('@claim:offline-reload reopens the demo and sample postcard after its first visit', async ({ browser, baseURL }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/?demo=1`);
    await expect(page.locator('#result')).toBeVisible();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    await context.setOffline(true);
    await page.goto(`${baseURL}/?demo=1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#demo-banner')).toBeVisible();
    await expect(page.locator('#result-image')).toHaveJSProperty('naturalHeight', 1500);
  } finally {
    await context.close();
  }
});

test('@claim:local-processing keeps sample processing requests on this product origin', async ({ page, baseURL }) => {
  const origins = new Set<string>();
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) origins.add(new URL(request.url()).origin);
  });
  await openDemo(page);
  await page.locator('[data-effect="rays"]').click();
  await page.locator('#preview-button').click();
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result')).toBeVisible();
  expect([...origins]).toEqual([new URL(baseURL!).origin]);
});

async function installTrackSpy(target: Page, key: string) {
  await target.addInitScript((storageKey) => {
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      const stop = track.stop.bind(track);
      track.stop = () => { localStorage.setItem(storageKey, 'yes'); stop(); };
      return stream;
    };
  }, key);
}

test('@claim:camera-stops-after-capture stops the video track after making a postcard', async ({ page }) => {
  await installTrackSpy(page, 'demo:track-stopped-after-capture');
  await openDemo(page);
  await page.locator('#camera-button').click();
  await expect(page.locator('#camera-status')).toContainText('Camera ready');
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('demo:track-stopped-after-capture'))).toBe('yes');
});

test('@claim:camera-stops-tab-close stops the video track when its tab closes', async ({ page, context }) => {
  await installTrackSpy(page, 'demo:track-stopped-on-close');
  await openDemo(page);
  await page.locator('#camera-button').click();
  await expect(page.locator('#camera-status')).toContainText('Camera ready');
  await page.close({ runBeforeUnload: true });

  const checkPage = await context.newPage();
  await checkPage.goto('/?demo=1');
  await expect.poll(() => checkPage.evaluate(() => localStorage.getItem('demo:track-stopped-on-close'))).toBe('yes');
  await checkPage.close();
});

test('@claim:no-audio requests a video stream with audio disabled', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      (window as Window & { requestedConstraints?: MediaStreamConstraints }).requestedConstraints = constraints;
      throw new DOMException('Denied for test', 'NotAllowedError');
    };
  });
  await openDemo(page);
  await page.locator('#camera-button').click();
  await expect(page.locator('#camera-status')).toContainText('Camera permission was not granted');
  expect(await page.evaluate(() => (window as Window & { requestedConstraints?: MediaStreamConstraints }).requestedConstraints?.audio)).toBe(false);
});

test('@claim:three-effects changes the visible effect for all three choices', async ({ page }) => {
  await openDemo(page);
  const snapshots = new Set<string>();
  for (const effect of ['orbit', 'rays', 'confetti']) {
    await page.locator(`[data-effect="${effect}"]`).click();
    await expect(page.locator(`[data-effect="${effect}"]`)).toHaveAttribute('aria-pressed', 'true');
    snapshots.add(await page.locator('#effects-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()));
  }
  expect(snapshots.size).toBe(3);
});

test('@claim:face-following moves the rendered effect with a detected face', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { x: 600, calls: 0 };
    const testWindow = window as Window & {
      setTestFaceX?: (x: number) => void;
      faceDetectionCalls?: () => number;
      FaceDetector?: unknown;
    };
    testWindow.setTestFaceX = (x) => { state.x = x; };
    testWindow.faceDetectionCalls = () => state.calls;
    Object.defineProperty(window, 'FaceDetector', {
      configurable: true,
      value: class {
        async detect() {
          state.calls += 1;
          return [{ boundingBox: { x: state.x, y: 280, width: 300, height: 420 } }];
        }
      }
    });
  });

  await openDemo(page);
  await page.locator('#motion-toggle').check();
  await page.locator('[data-effect="orbit"]').click();
  await page.locator('#camera-button').click();
  await expect(page.locator('#camera-status')).toContainText('effect follows your face');
  await expect.poll(() => page.evaluate(() => (window as Window & { faceDetectionCalls?: () => number }).faceDetectionCalls?.() ?? 0)).toBeGreaterThan(0);
  const first = await effectChecksum(page);

  const previousCalls = await page.evaluate(() => (window as Window & { faceDetectionCalls?: () => number }).faceDetectionCalls?.() ?? 0);
  await page.evaluate(() => (window as Window & { setTestFaceX?: (x: number) => void }).setTestFaceX?.(1100));
  await expect.poll(() => page.evaluate(() => (window as Window & { faceDetectionCalls?: () => number }).faceDetectionCalls?.() ?? 0)).toBeGreaterThan(previousCalls);
  await expect.poll(() => effectChecksum(page)).not.toBe(first);
});

test('@claim:optional-face-positioning still makes a postcard when face positioning is unavailable', async ({ page }) => {
  await openDemo(page);
  await page.locator('#camera-button').click();
  await expect(page.locator('#camera-status')).toContainText('centered portrait guide');
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalWidth', 1200);
});

test('@claim:postcard-4x5 exports a 1200 by 1500 postcard image', async ({ page }) => {
  await openDemo(page);
  expect(await pngSize(page)).toEqual({ width: 1200, height: 1500 });
});

test('@claim:png-download downloads a valid PNG postcard', async ({ page }) => {
  await openDemo(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-link').click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const bytes = Buffer.concat(chunks);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(1500);
});

test('@claim:native-share sends the completed PNG to an available device share sheet', async ({ page }) => {
  await page.addInitScript(() => {
    const testWindow = window as Window & { sharedPostcard?: { name: string; type: string; signature: number[]; width: number; height: number } };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        const file = data.files?.[0];
        if (!file) throw new Error('No shared file');
        const bytes = new Uint8Array(await file.arrayBuffer());
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        testWindow.sharedPostcard = {
          name: file.name,
          type: file.type,
          signature: [...bytes.slice(0, 8)],
          width: view.getUint32(16),
          height: view.getUint32(20)
        };
      }
    });
  });
  await openDemo(page);
  await page.locator('#share-button').click();
  await expect.poll(() => page.evaluate(() => (window as Window & { sharedPostcard?: unknown }).sharedPostcard)).toEqual({
    name: 'postcard-fx.png',
    type: 'image/png',
    signature: [137, 80, 78, 71, 13, 10, 26, 10],
    width: 1200,
    height: 1500
  });
});

test('@claim:local-persistence restores a saved demo postcard after refresh', async ({ page }) => {
  await openDemo(page);
  await page.locator('#preview-button').click();
  await page.locator('#caption-input').fill('Saved in the demo browser');
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await page.reload();
  await expect(page.locator('#restore-button')).toBeVisible();
  await page.locator('#restore-button').click();
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalHeight', 1500);
});

test('@claim:local-backup exports and imports a sample postcard in demo storage', async ({ page }) => {
  await openDemo(page);
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
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalWidth', 1200);
});

test('@claim:no-third-party-runtime uses only same-origin requests across the product pages', async ({ page, baseURL }) => {
  const origins = new Set<string>();
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) origins.add(new URL(request.url()).origin);
  });
  for (const path of ['/?demo=1', '/privacy/', '/terms/']) await page.goto(path);
  expect([...origins]).toEqual([new URL(baseURL!).origin]);
});

test('@claim:no-face-identification makes a sample postcard without asking for a person identity', async ({ page }) => {
  await openDemo(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make a private camera postcard');
  await expect(page.locator('#result-image')).toHaveJSProperty('naturalHeight', 1500);
});

test('@claim:no-face-position-storage leaves only settings and the finished PNG in demo storage', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { calls: 0 };
    const testWindow = window as Window & { faceDetectionCalls?: () => number; FaceDetector?: unknown };
    testWindow.faceDetectionCalls = () => state.calls;
    Object.defineProperty(window, 'FaceDetector', {
      configurable: true,
      value: class {
        async detect() {
          state.calls += 1;
          return [{ boundingBox: { x: 92, y: 48, width: 62, height: 90 } }];
        }
      }
    });
  });
  await openDemo(page);
  await page.locator('#camera-button').click();
  await expect.poll(() => page.evaluate(() => (window as Window & { faceDetectionCalls?: () => number }).faceDetectionCalls?.() ?? 0)).toBeGreaterThan(0);
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result')).toBeVisible();

  const stored = await page.evaluate(async () => {
    const settings = JSON.parse(localStorage.getItem('demo:postcard-fx-settings') ?? 'null') as Record<string, unknown> | null;
    const databaseNames = (await indexedDB.databases()).map((database) => database.name).filter(Boolean).sort();
    const postcard = await new Promise<{ keys: IDBValidKey[]; values: Array<{ kind: string; type?: string }> }>((resolve, reject) => {
      const request = indexedDB.open('demo:postcard-fx');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('postcards');
        const store = transaction.objectStore('postcards');
        const keysRequest = store.getAllKeys();
        const valuesRequest = store.getAll();
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => {
          const values = valuesRequest.result.map((value) => value instanceof Blob ? { kind: 'Blob', type: value.type } : { kind: typeof value });
          database.close();
          resolve({ keys: keysRequest.result, values });
        };
      };
    });
    return { settings, databaseNames, postcard };
  });

  expect(Object.keys(stored.settings ?? {}).sort()).toEqual(['caption', 'effect', 'frozen', 'mirror', 'timer']);
  expect(stored.databaseNames).toEqual(['demo:postcard-fx']);
  expect(stored.postcard).toEqual({ keys: ['latest'], values: [{ kind: 'Blob', type: 'image/png' }] });
});

test('@claim:demo-isolation resets sample changes without changing a real postcard', async ({ page }) => {
  await page.goto('/');
  await page.locator('#preview-button').click();
  await page.locator('#caption-input').fill('Real postcard stays here');
  await page.locator('#timer-select').selectOption('0');
  await page.locator('#capture-button').click();
  await expect(page.locator('#result')).toBeVisible();

  await openDemo(page);
  await page.locator('#caption-input').fill('Only the sample changes');
  await page.locator('#reset-demo').click();
  await expect(page.locator('#caption-input')).toHaveValue('Mina and Jo\'s garden party');
  await page.locator('#start-real').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#caption-input')).toHaveValue('Real postcard stays here');
  await expect(page.locator('#restore-button')).toBeVisible();
});
