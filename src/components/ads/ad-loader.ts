import { sizeForWidth, WIDE_BREAKPOINT } from '@/config/ads';

const BANNER_SIZES = new Set(['728x90', '468x60', '320x50']);

function recreateScripts(wrap: HTMLElement): void {
  for (const old of Array.from(wrap.querySelectorAll('script'))) {
    const s = document.createElement('script');
    if (old.type) s.type = old.type;
    if (old.src) {
      s.async = true;
      s.src = old.src;
    } else {
      s.text = old.text;
    }
    old.replaceWith(s);
  }
}

function injectCode(container: HTMLElement, html: string): void {
  const target = container.querySelector<HTMLElement>('.ad-code');
  if (!target) return;
  target.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ad-inner';
  wrap.innerHTML = html;
  recreateScripts(wrap);
  target.appendChild(wrap);
}

function runScripts(html: string, container: HTMLElement): void {
  const wrap = document.createElement('div');
  wrap.style.display = 'none';
  wrap.innerHTML = html;
  const frag = document.createDocumentFragment();
  for (const old of Array.from(wrap.querySelectorAll('script'))) {
    const s = document.createElement('script');
    if (old.type) s.type = old.type;
    if (old.src) {
      s.async = true;
      s.src = old.src;
    } else {
      s.text = old.text;
    }
    frag.appendChild(s);
  }
  container.appendChild(frag);
}

function resolveSize(slot: HTMLElement, width: number): string {
  const mode = slot.dataset.adMode || 'banner';
  if (mode === 'sticky') {
    return width >= WIDE_BREAKPOINT ? 'native' : sizeForWidth(width);
  }
  const nativeBelow = Number(slot.dataset.adNativeBelow || '0');
  if (nativeBelow && width < nativeBelow) return 'native';
  return sizeForWidth(width);
}

/**
 * The Adsterra banner tag is built around a single global `window.atOptions`
 * object: each banner's inline script writes it, and the first `invoke.js` to
 * execute consumes and deletes it. Concurrent banner units therefore race, and
 * only the first one to run renders. Ads are injected one at a time, and each
 * banner slot waits for the previous slot's `invoke.js` to consume `atOptions`
 * before it writes its own.
 */
function waitForAtOptionsFree(timeoutMs = 3000): Promise<void> {
  const w = window as unknown as { atOptions?: unknown };
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (w.atOptions === undefined || Date.now() - start >= timeoutMs) resolve();
      else setTimeout(check, 100);
    };
    check();
  });
}

function activate(slot: HTMLElement): Promise<void> {
  const size = resolveSize(slot, window.innerWidth);
  const tpl = slot.querySelector<HTMLTemplateElement>(`template[data-ad-size="${size}"]`);
  if (!tpl || !tpl.innerHTML.trim()) {
    slot.dataset.activeSize = '';
    slot.classList.add('ad-empty');
    return Promise.resolve();
  }
  if (slot.dataset.activeSize === size) return Promise.resolve();
  slot.dataset.activeSize = size;
  slot.classList.remove('ad-empty');
  if (BANNER_SIZES.has(size)) {
    return waitForAtOptionsFree().then(() => {
      if (slot.dataset.activeSize === size) injectCode(slot, tpl.innerHTML);
    });
  }
  injectCode(slot, tpl.innerHTML);
  return Promise.resolve();
}

function runDeferredSocialbar(): void {
  document.querySelectorAll<HTMLElement>('.ad-socialbar[data-ad-defer="1"]').forEach((slot) => {
    if (slot.dataset.injected) return;
    slot.dataset.injected = '1';
    const tpl = slot.querySelector<HTMLTemplateElement>('template[data-ad-code]');
    if (!tpl || !tpl.innerHTML.trim()) return;
    runScripts(tpl.innerHTML, slot);
  });
}

function init(): void {
  const slots = Array.from(document.querySelectorAll<HTMLElement>('.ad-slot[data-ad-slot]'));
  let queue: Promise<void> = Promise.resolve();
  const run = () => {
    for (const slot of slots) {
      queue = queue.then(() => activate(slot), () => activate(slot));
    }
  };
  run();
  runDeferredSocialbar();
  let t: number | undefined;
  window.addEventListener('resize', () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(run, 150);
  });
  document.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('.ad-close');
    if (!btn) return;
    btn.closest('.ad-slot')?.remove();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
