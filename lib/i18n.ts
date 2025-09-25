import { headers } from "next/headers";

export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: Locale = "en";
const DEFAULT_LOCALE: Locale = "ar";

export const isRTL = (locale: Locale) => locale === "ar";

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
  const hdrs = headers();
  const acceptLanguage = hdrs.get("x-next-intl-locale") ?? hdrs.get("accept-language");
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }
  const preferred = acceptLanguage.split(",")[0]?.split("-")[0];
  if (preferred && SUPPORTED_LOCALES.includes(preferred as Locale)) {
    return preferred as Locale;
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
