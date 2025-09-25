const DEFAULT_TZ = process.env.TIMEZONE_DISPLAY ?? "Asia/Beirut";
const DEFAULT_LOCALE = process.env.APP_LOCALE_DEFAULT ?? "ar";

type FormatVariant = "datetime" | "time";

type FormatOptions = {
  locale?: string;
  variant?: FormatVariant;
};

function resolveLocale(locale?: string) {
  if (locale) return locale;
  if (typeof window !== "undefined") {
    const docLang = document.documentElement.lang;
    if (docLang) {
      return docLang;
    }
  }
  return DEFAULT_LOCALE;
}

function formatWithOptions(date: Date, locale: string, variant: FormatVariant) {
  if (variant === "time") {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: DEFAULT_TZ,
    }).format(date);
  }

  const datePart = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: DEFAULT_TZ,
  }).format(date);

  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DEFAULT_TZ,
  }).format(date);

  return `${datePart} — ${timePart}`;
}

export function formatUTC(date: Date | string, options?: FormatOptions) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) {
    return "";
  }

  const locale = resolveLocale(options?.locale);
  const variant = options?.variant ?? "datetime";
  return formatWithOptions(dateObj, locale, variant);
}

export function toUTC(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Date(dateObj.toISOString());
}
