import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  type Locale,
} from "./i18n-config";

async function importDictionary(locale: Locale) {
  switch (locale) {
    case "ar":
      return (await import("@/i18n/ar.json")).default;
    case "en":
      return (await import("@/i18n/en.json")).default;
    default:
      return (await import("@/i18n/en.json")).default;
  }
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale)) {
    return cookieLocale;
  }

  const hdrs = headers();
  const hintedLocale = hdrs.get("x-next-locale") ?? hdrs.get("x-next-intl-locale");
  if (hintedLocale && SUPPORTED_LOCALES.includes(hintedLocale as Locale)) {
    return hintedLocale as Locale;
  }

  const acceptLanguage = hdrs.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0]?.split("-")[0];
    if (preferred && SUPPORTED_LOCALES.includes(preferred as Locale)) {
      return preferred as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

export async function getDictionary(locale?: Locale) {
  const resolved = locale ?? (await getLocale());
  try {
    return await importDictionary(resolved);
  } catch (error) {
    console.error("Failed to load dictionary", error);
    return await importDictionary(FALLBACK_LOCALE);
  }
}

export { SUPPORTED_LOCALES, isRTL } from "./i18n-config";
export type { Locale } from "./i18n-config";
