import { defineConfig } from 'vitest/config';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function versionedServiceWorker() {
  return {
    name: 'postcard-fx-versioned-service-worker',
    async closeBundle() {
      const root = process.cwd();
      const dist = resolve(root, 'dist');
      const pages = await Promise.all(['index.html', 'privacy/index.html', 'terms/index.html'].map((page) => readFile(resolve(dist, page), 'utf8')));
      const shell = ['/', '/?demo=1', '/index.html', '/demo/', '/404.html', '/offline.html', '/offline.css', '/privacy/', '/terms/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png'];
      for (const page of pages) for (const match of page.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) shell.push(match[1]);
      const uniqueShell = [...new Set(shell)];
      const version = `postcard-fx-${createHash('sha256').update(uniqueShell.join('|')).digest('hex').slice(0, 12)}`;
      const template = await readFile(resolve(root, 'public/service-worker.js'), 'utf8');
      const serviceWorker = template
        .replace(/const VERSION = '[^']+';/, `const VERSION = '${version}';`)
        .replace(/const SHELL = \[[\s\S]*?\];/, `const SHELL = ${JSON.stringify(uniqueShell, null, 2)};`);
      await writeFile(resolve(dist, 'service-worker.js'), serviceWorker);
    }
  };
}

export default defineConfig({
  plugins: [versionedServiceWorker()],
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        app: resolve(process.cwd(), 'index.html'),
        demo: resolve(process.cwd(), 'demo/index.html'),
        notFound: resolve(process.cwd(), '404.html'),
        privacy: resolve(process.cwd(), 'privacy/index.html'),
        terms: resolve(process.cwd(), 'terms/index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  test: { environment: 'node', include: ['tests/*.test.ts'] }
});
