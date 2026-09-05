export const supportedLocales = ["en", "ja"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const localeLoaders = {
  en: () => import("./locales/en"),
  ja: () => import("./locales/ja"),
} as const;
