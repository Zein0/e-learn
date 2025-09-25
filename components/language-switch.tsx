"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n-config";
import { applyLocaleToDocument } from "@/lib/locale-client";
import { usePreferencesStore } from "@/stores/preferences";

type LanguageSwitchProps = {
  locale: Locale;
  labels: {
    title: string;
    arabic: string;
    english: string;
  };
};

const LOCALE_LABEL: Record<Locale, keyof LanguageSwitchProps["labels"]> = {
  ar: "arabic",
  en: "english",
};

export function LanguageSwitch({ locale, labels }: LanguageSwitchProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const persistedLanguage = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  useEffect(() => {
    const currentDocumentLocale = (document.documentElement.lang || DEFAULT_LOCALE) as Locale;
    if (SUPPORTED_LOCALES.includes(currentDocumentLocale) && currentDocumentLocale !== persistedLanguage) {
      setLanguage(currentDocumentLocale);
    }
  }, [persistedLanguage, setLanguage]);

  useEffect(() => {
    applyLocaleToDocument(locale);
  }, [locale]);

  const handleChange = (nextLocale: Locale) => {
    if (nextLocale === locale || isPending) {
      return;
    }

    startTransition(async () => {
      setLanguage(nextLocale);
      applyLocaleToDocument(nextLocale);

      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: nextLocale }),
      });

      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs font-medium text-brand-600">
      <span className="hidden sm:inline">{labels.title}</span>
      <div className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-white/60 p-1 backdrop-blur dark:bg-brand-900/60">
        {SUPPORTED_LOCALES.map((itemLocale) => {
          const isActive = itemLocale === locale;
          return (
            <Button
              key={itemLocale}
              type="button"
              size="sm"
              variant={isActive ? "default" : "ghost"}
              className={`h-8 px-3 text-xs ${isActive ? "bg-emerald-500 text-white" : "text-brand-600 dark:text-brand-200"}`}
              onClick={() => handleChange(itemLocale)}
              aria-pressed={isActive}
              disabled={isPending && !isActive}
            >
              {labels[LOCALE_LABEL[itemLocale]]}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

