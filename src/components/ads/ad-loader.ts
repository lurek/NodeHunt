import { sizeForWidth } from '@/config/ads';

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
  return sizeForWidth(width);
}

function activate(slot: HTMLElement): Promise<void> {
  if (slot.dataset.adMode === 'native') return Promise.resolve();
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
