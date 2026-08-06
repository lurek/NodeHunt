import adsStore from '../data/ads_store.json';

export type AdSlot = 'topBanner' | 'sidebar' | 'inlineArticle' | 'stickyMobile' | 'bottomBanner' | 'footer';

export interface AdSlotConfig {
  enabled: boolean;
  /** Reserved dimensions prevent layout shift (CLS) once a provider is active. */
  minHeight: number;
  maxWidth: number;
}

export const adsConfig: {
  enabled: boolean;
  provider: string;
  providerId: string;
  slots: Record<AdSlot, AdSlotConfig>;
} = adsStore as {
  enabled: boolean;
  provider: string;
  providerId: string;
  slots: Record<AdSlot, AdSlotConfig>;
};
