"use client";

import { useEffect, useRef } from "react";

import { applyLocaleToDocument } from "@/lib/locale-client";
import type { Locale } from "@/lib/i18n-config";
import { usePreferencesStore } from "@/stores/preferences";

type AdminLanguageInitializerProps = {
  locale: Locale;
};

export function AdminLanguageInitializer({ locale }: AdminLanguageInitializerProps) {
  const initializedRef = useRef(false);
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    if (language !== locale) {
      setLanguage(locale);
    }
    applyLocaleToDocument(locale);
  }, [language, locale, setLanguage]);

  useEffect(() => {
    if (language !== locale) {
      setLanguage(locale);
      applyLocaleToDocument(locale);
    }
  }, [language, locale, setLanguage]);

  return null;
}

