import { chromium } from '@playwright/test';

const url = process.argv[2];
if (!url) throw new Error('Usage: ./verify-url.sh <https-url>');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

try {
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`Expected a successful document response, received ${response?.status() ?? 'no response'}.`);
  const audit = await page.evaluate(() => ({
    lang: globalThis.document.documentElement.lang,
    title: globalThis.document.title,
    mains: globalThis.document.querySelectorAll('main').length,
    headings: globalThis.document.querySelectorAll('h1').length,
    imagesWithoutAlt: [...globalThis.document.images].filter((image) => !image.hasAttribute('alt')).map((image) => image.src),
  }));
  if (!audit.lang) errors.push('missing html lang');
  if (!audit.title) errors.push('missing title');
  if (audit.mains !== 1) errors.push(`expected one main landmark, found ${audit.mains}`);
  if (audit.headings !== 1) errors.push(`expected one h1, found ${audit.headings}`);
  if (audit.imagesWithoutAlt.length) errors.push(`images without alt: ${audit.imagesWithoutAlt.join(', ')}`);
  if (errors.length) throw new Error(errors.join('\n'));
  process.stdout.write(`PASS ${url}\ntitle: ${audit.title}\nlang: ${audit.lang}\nmain: ${audit.mains}\nh1: ${audit.headings}\n`);
} finally {
  await browser.close();
}
