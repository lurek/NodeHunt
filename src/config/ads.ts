export type AdSlot = 'topBanner' | 'sidebar' | 'inlineArticle' | 'stickyMobile' | 'bottomBanner' | 'footer';

export interface AdSlotConfig {
  enabled: boolean;
  /** Reserved dimensions prevent layout shift (CLS) once a provider is active. */
  minHeight: number;
  maxWidth: number;
}

export const adsConfig = {
  enabled: false,
  provider: '',
  providerId: '',
  slots: {
    topBanner: { enabled: false, minHeight: 90, maxWidth: 970 },
    sidebar: { enabled: false, minHeight: 600, maxWidth: 300 },
    inlineArticle: { enabled: false, minHeight: 250, maxWidth: 728 },
    stickyMobile: { enabled: false, minHeight: 50, maxWidth: 360 },
    bottomBanner: { enabled: false, minHeight: 90, maxWidth: 728 },
    footer: { enabled: false, minHeight: 90, maxWidth: 728 },
  } satisfies Record<AdSlot, AdSlotConfig>,
} as const;
