import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const policy = JSON.parse(await readFile(resolve(root, 'staticwebapp.config.json'), 'utf8'));
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

function localPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '').replace(/^[/\\]+/, '');
  return join(root, relative || 'index.html');
}

async function fileFor(pathname) {
  let candidate = localPath(pathname);
  try {
    if ((await stat(candidate)).isDirectory()) candidate = join(candidate, 'index.html');
    if ((await stat(candidate)).isFile()) return { file: candidate, status: 200 };
  } catch { /* Return the configured Static Web Apps response override. */ }
  const override = policy.responseOverrides?.['404'];
  return { file: localPath(override?.rewrite ?? '/404.html'), status: override?.statusCode ?? 404 };
}

createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname;
    const { file, status } = await fileFor(pathname);
    const body = await readFile(file);
    const routeHeaders = pathname.startsWith('/assets/')
      ? policy.routes.find(({ route }) => route === '/assets/*')?.headers ?? {}
      : {};
    const headers = { ...policy.globalHeaders, ...routeHeaders };
    for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    response.setHeader('Content-Length', body.byteLength);
    response.writeHead(status);
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Production preview failed.');
  }
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Production-policy preview ready at http://127.0.0.1:${port}\n`);
});
