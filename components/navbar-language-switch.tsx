"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { LanguageSwitch } from "@/components/language-switch";
import type { Locale } from "@/lib/i18n-config";

type NavbarLanguageSwitchProps = {
  locale: Locale;
  labels: {
    title: string;
    arabic: string;
    english: string;
  };
};

export function NavbarLanguageSwitch({ locale, labels }: NavbarLanguageSwitchProps) {
  const pathname = usePathname();

  const shouldRender = useMemo(() => {
    if (!pathname) {
      return true;
    }

    return !pathname.startsWith("/admin");
  }, [pathname]);

  if (!shouldRender) {
    return null;
  }

  return <LanguageSwitch locale={locale} labels={labels} />;
}

