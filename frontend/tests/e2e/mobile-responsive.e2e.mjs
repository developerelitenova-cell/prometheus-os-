import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '../..');
const BASE_URL = 'http://127.0.0.1:4173';

const VIEWPORTS = [
  { name: 'Android Small (360x800)', width: 360, height: 800, isMobile: true, hasTouch: true },
  { name: 'iOS Pro Max (430x932)', width: 430, height: 932, isMobile: true, hasTouch: true },
];

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function run() {
  const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: frontendDir,
    stdio: 'ignore',
  });

  let browser;
  try {
    await waitForServer(BASE_URL);

    // Verificar PWA manifest y Service Worker servidos correctamente
    const manifestRes = await fetch(`${BASE_URL}/manifest.webmanifest`);
    assert.equal(manifestRes.status, 200, 'manifest.webmanifest debe responder 200');
    const manifest = await manifestRes.json();
    assert.equal(manifest.display, 'standalone');
    assert.ok(manifest.icons?.length >= 1, 'Manifest debe declarar iconos PWA');

    const swRes = await fetch(`${BASE_URL}/sw.js`);
    assert.equal(swRes.status, 200, 'Service Worker /sw.js debe responder 200');

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewport(vp);

      for (const route of ['/', '/login']) {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });

        // 1. Verificar ausencia de desbordamiento horizontal (overflow-x)
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        assert.ok(
          overflow.scrollWidth <= overflow.innerWidth,
          `[${vp.name}] ${route} tiene overflow-x: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
        );

        // 2. Verificar meta viewport y manifest en DOM
        const hasManifestLink = await page.evaluate(
          () => Boolean(document.querySelector('link[rel="manifest"]'))
        );
        assert.ok(hasManifestLink, 'Debe existir <link rel="manifest"> en el DOM');

        // 3. Verificar áreas táctiles mínimas (>= 44px de alto) en botones visibles
        const smallButtons = await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, a[role="button"]'));
          return btns
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && r.height < 44;
            })
            .map((el) => ({ text: el.textContent?.trim(), height: el.getBoundingClientRect().height }));
        });
        assert.equal(
          smallButtons.length,
          0,
          `[${vp.name}] ${route} tiene botones menores a 44px: ${JSON.stringify(smallButtons)}`
        );
      }

      await page.close();
      console.log(`✓ E2E Mobile Viewport OK: ${vp.name}`);
    }

    console.log('✓ All Mobile E2E checks passed (PWA + 360x800 + 430x932 + zero overflow-x + 44px touch targets)');
  } finally {
    if (browser) await browser.close();
    preview.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('Mobile E2E failed:', err);
  process.exit(1);
});

