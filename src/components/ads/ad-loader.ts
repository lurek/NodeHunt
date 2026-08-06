import { sizeForWidth, WIDE_BREAKPOINT } from '@/config/ads';

function injectCode(container: HTMLElement, html: string): void {
  const target = container.querySelector<HTMLElement>('.ad-code');
  if (!target) return;
  target.replaceChildren();
  const wrap = document.createElement('div');
  wrap.className = 'ad-inner';
  wrap.innerHTML = html;
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
  target.appendChild(wrap);
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
  injectCode(slot, tpl.innerHTML);
}

function init(): void {
  const slots = Array.from(document.querySelectorAll<HTMLElement>('.ad-slot[data-ad-slot]'));
  const run = () => slots.forEach(activate);
  run();
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
