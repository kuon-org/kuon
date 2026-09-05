import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localeLoaders, supportedLocales, type SupportedLocale } from "./localeLoaders";

export const defaultLocale: SupportedLocale = "ja";

const isSupportedLocale = (locale: string): locale is SupportedLocale =>
  supportedLocales.includes(locale as SupportedLocale);

export const resolveLocale = (): SupportedLocale => {
  if (typeof navigator === "undefined") return defaultLocale;

  for (const language of navigator.languages ?? [navigator.language]) {
    const locale = language.toLowerCase().split("-")[0];
    if (isSupportedLocale(locale)) return locale;
  }

  return defaultLocale;
};

export const initializeI18n = async (locale = resolveLocale()) => {
  if (i18n.isInitialized && i18n.language === locale) return i18n;

  const { default: resources } = await localeLoaders[locale]();

  await i18n.use(initReactI18next).init({
    lng: locale,
    fallbackLng: false,
    defaultNS: "common",
    resources: {
      [locale]: resources,
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

  return i18n;
};

export default i18n;
