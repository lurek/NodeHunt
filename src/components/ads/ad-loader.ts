import { sizeForWidth, WIDE_BREAKPOINT } from '@/config/ads';

let adUid = 0;

/**
 * Renders ad HTML inside a sandboxed iframe (opaque origin, no top-navigation)
 * with auto-height via postMessage.
 *
 * Every slot is sandboxed on purpose: the Adsterra banner tag relies on a single
 * global `window.atOptions` object, and the first `invoke.js` to execute consumes
 * and deletes it. Running each ad in its own iframe gives it an isolated window,
 * so multiple banner units on the same page can render independently.
 */
function injectSandboxed(container: HTMLElement, html: string): void {
  const target = container.querySelector<HTMLElement>('.ad-code');
  if (!target) return;
  target.replaceChildren();
  const uid = 'ad' + ++adUid;
  const frame = document.createElement('iframe');
  frame.className = 'ad-frame';
  frame.dataset.adUid = uid;
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.setAttribute('loading', 'lazy');
  frame.style.cssText = 'width:100%;border:0;display:block;height:160px;';
  target.appendChild(frame);
  const resizeProbe =
    '(function(){var s=function(){try{parent.postMessage({nodehuntAdHeight:document.body.scrollHeight,uid:"' +
    uid +
    '"},"*")}catch(e){}};window.addEventListener("load",s);window.addEventListener("resize",s);s();var i=0,t=setInterval(function(){s();if(++i>12)clearInterval(t)},500);})();';
  frame.srcdoc =
    '<!doctype html><html><head><base target="_blank"></head><body style="margin:0;background:transparent">' +
    html +
    '<script>' +
    resizeProbe +
    '</script></body></html>';
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

function activate(slot: HTMLElement): void {
  const mode = slot.dataset.adMode || 'banner';
  const width = window.innerWidth;

  let size: string;
  if (mode === 'sticky') {
    size = width >= WIDE_BREAKPOINT ? 'native' : sizeForWidth(width);
  } else {
    const nativeBelow = Number(slot.dataset.adNativeBelow || '0');
    if (nativeBelow && width < nativeBelow) size = 'native';
    else size = sizeForWidth(width);
  }

  const tpl = slot.querySelector<HTMLTemplateElement>(`template[data-ad-size="${size}"]`);
  if (!tpl || !tpl.innerHTML.trim()) {
    slot.dataset.activeSize = '';
    slot.classList.add('ad-empty');
    return;
  }

  if (slot.dataset.activeSize === size) return;
  slot.dataset.activeSize = size;
  slot.classList.remove('ad-empty');
  injectSandboxed(slot, tpl.innerHTML);
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
  const run = () => slots.forEach(activate);
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
  window.addEventListener('message', (event) => {
    const data = event.data as { nodehuntAdHeight?: number; uid?: string } | null;
    if (!data || typeof data.nodehuntAdHeight !== 'number' || !data.uid) return;
    const frame = document.querySelector<HTMLIFrameElement>(`iframe[data-ad-uid="${data.uid}"]`);
    if (frame) frame.style.height = `${data.nodehuntAdHeight}px`;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
