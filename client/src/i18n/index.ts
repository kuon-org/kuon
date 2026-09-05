import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { localeLoaders, supportedLocales, type SupportedLocale } from "./localeLoaders";

export const defaultLocale: SupportedLocale = "ja";
export const enabledLocales: SupportedLocale[] = ["ja", "en"];
export const localeStorageKey = "kuon.locale";

const isEnabledLocale = (locale: string): locale is SupportedLocale =>
  enabledLocales.includes(locale as SupportedLocale) &&
  supportedLocales.includes(locale as SupportedLocale);

export const resolveLocale = (): SupportedLocale => {
  if (typeof window !== "undefined") {
    const storedLocale = window.localStorage.getItem(localeStorageKey);
    if (storedLocale && isEnabledLocale(storedLocale)) return storedLocale;
  }

  if (typeof navigator === "undefined") return defaultLocale;

  for (const language of navigator.languages ?? [navigator.language]) {
    const locale = language.toLowerCase().split("-")[0];
    if (isEnabledLocale(locale)) return locale;
  }

  return defaultLocale;
};

const loadLocale = async (locale: SupportedLocale) => {
  if (i18n.hasResourceBundle(locale, "common")) return;

  const { default: resources } = await localeLoaders[locale]();
  for (const [namespace, resource] of Object.entries(resources)) {
    i18n.addResourceBundle(locale, namespace, resource, true, true);
  }
};

export const changeLocale = async (locale: SupportedLocale) => {
  if (!isEnabledLocale(locale)) return;

  await loadLocale(locale);
  await i18n.changeLanguage(locale);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(localeStorageKey, locale);
  }
};

export const initializeI18n = async (locale = resolveLocale()) => {
  if (i18n.isInitialized) {
    await changeLocale(locale);
    return i18n;
  }

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
