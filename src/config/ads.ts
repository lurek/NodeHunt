import adsStore from '../data/ads_store.json';

export type AdCodeKey = 'popunder' | 'socialbar' | 'nativeBanner' | 'banner728x90' | 'banner468x60' | 'banner320x50';
export type AdSlotKey = 'topBanner' | 'sidebar' | 'inlineArticle' | 'midArticle' | 'bottomBanner' | 'footer' | 'stickyBottom';

export const AD_CODE_KEYS: AdCodeKey[] = ['popunder', 'socialbar', 'nativeBanner', 'banner728x90', 'banner468x60', 'banner320x50'];
export const AD_SLOT_KEYS: AdSlotKey[] = ['topBanner', 'sidebar', 'inlineArticle', 'midArticle', 'bottomBanner', 'footer', 'stickyBottom'];

export const WIDE_BREAKPOINT = 728;
export const MEDIUM_BREAKPOINT = 468;

/** Banner size for a given viewport width: >=728 -> 728x90, <728 -> 320x50. */
export function sizeForWidth(width: number): string {
  if (width >= WIDE_BREAKPOINT) return '728x90';
  return '320x50';
}

export interface AdStore {
  enabled: boolean;
  provider: string;
  /** Inject the social bar only after every other ad slot has loaded. */
  socialbarAfterAds: boolean;
  codes: Record<AdCodeKey, string>;
  slots: Record<AdSlotKey, { enabled: boolean }>;
}

export const adsConfig: AdStore = adsStore as AdStore;
