import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const origin = 'http://127.0.0.1:5173/';
const outDir = 'C:\\Users\\ThinkMaster\\Documents\\hass\\base\\web-scene';
const port = 9333 + Math.floor(Math.random() * 400);
const profile = join(tmpdir(), `chrome-cdp-${Date.now()}`);

await mkdir(profile, { recursive: true });

const child = spawn(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1365,768',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  origin,
], { stdio: 'ignore' });

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function waitForChrome() {
  const started = Date.now();
  while (Date.now() - started < 15000) {
    try {
      return await json(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await delay(250);
    }
  }
  throw new Error('Chrome debugging port did not open');
}

async function waitForSceneReady(cdp) {
  const started = Date.now();
  while (Date.now() - started < 45000) {
    const result = await cdp.send('Runtime.evaluate', {
      expression: `(() => ({
        pins: document.querySelectorAll('.pin-spacer').length,
        scrollHeight: document.documentElement.scrollHeight,
        canvas: !!document.querySelector('#scene')
      }))()`,
      returnByValue: true,
    });
    const value = result.result.value;
    if (value.canvas && value.pins >= 2 && value.scrollHeight > 8000) return value;
    await delay(300);
  }
  throw new Error('Scene scroll pins did not initialize');
}

function createCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener('open', () => {
      resolve({
        send(method, params = {}) {
          const messageId = ++id;
          socket.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((resolveMessage, rejectMessage) => {
            pending.set(messageId, { resolve: resolveMessage, reject: rejectMessage });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener('error', reject);
  });
}

try {
  await waitForChrome();
  const pages = await json(`http://127.0.0.1:${port}/json/list`);
  const page = pages.find((entry) => entry.type === 'page') ?? pages[0];
  const cdp = await createCdp(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate', { url: origin });
  await delay(1000);
  await waitForSceneReady(cdp);

  const metrics = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const pick = (selector) => {
        const node = document.querySelector(selector);
        return node ? node.offsetTop : 0;
      };
      const pickPinned = (selector) => {
        const node = document.querySelector(selector);
        if (!node) return 0;
        const parent = node.parentElement;
        return parent?.classList.contains('pin-spacer') ? parent.offsetTop : node.offsetTop;
      };
      return {
        zoom: pick('.section--zoom'),
        project: pick('.section--project'),
        horizontal: pickPinned('.section--hscroll'),
        final: pickPinned('.section--final'),
        max: document.documentElement.scrollHeight - window.innerHeight
      };
    })()`,
    returnByValue: true,
  });
  const positions = metrics.result.value;
  const clamp = (value) => Math.max(0, Math.min(positions.max, Math.round(value)));

  const states = [
    { name: 'scroll-cdp-hero.png', y: 0 },
    { name: 'scroll-cdp-zoom.png', y: clamp(positions.zoom + 360) },
    { name: 'scroll-cdp-project.png', y: clamp(positions.project + 120) },
    { name: 'scroll-cdp-horizontal.png', y: clamp(positions.horizontal + 980) },
    { name: 'scroll-cdp-about.png', y: clamp(positions.final + 520) },
    { name: 'scroll-cdp-about-exit.png', y: clamp(positions.final + 940) },
  ];

  const debug = { positions, states: [] };
  for (const state of states) {
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo(0, ${state.y}); undefined;`,
      awaitPromise: true,
    });
    await delay(2600);
    const observed = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const visible = [...document.querySelectorAll('.section, .hscroll-panel')]
          .map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              className: node.className,
              top: Math.round(rect.top),
              bottom: Math.round(rect.bottom),
              text: node.textContent.trim().slice(0, 80),
            };
          })
          .filter((entry) => entry.bottom > 0 && entry.top < window.innerHeight);
        return { y: Math.round(window.scrollY), visible };
      })()`,
      returnByValue: true,
    });
    debug.states.push({ ...state, observed: observed.result.value });
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(outDir, state.name), Buffer.from(screenshot.data, 'base64'));
  }
  await writeFile(join(outDir, 'scroll-cdp-debug.json'), JSON.stringify(debug, null, 2));

  cdp.close();
} finally {
  child.kill();
}
