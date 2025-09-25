"use client";

import type { Locale } from "./i18n-config";

export function applyLocaleToDocument(locale: Locale) {
  const direction = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", direction);
  document.documentElement.setAttribute("lang", locale);
  document.body.classList.remove("rtl", "ltr");
  document.body.classList.add(direction);
}
