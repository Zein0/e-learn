export const SUPPORTED_LOCALES = ["ar", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

export const FALLBACK_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const isRTL = (locale: Locale) => locale === "ar";
