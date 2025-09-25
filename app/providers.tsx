"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { applyLocaleToDocument } from "@/lib/locale-client";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n-config";
import { usePreferencesStore } from "@/stores/preferences";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);

  useEffect(() => {
    const documentLocale = (document.documentElement.lang || DEFAULT_LOCALE) as Locale;
    if (documentLocale !== locale) {
      setLocale(documentLocale);
      applyLocaleToDocument(documentLocale);
    }
  }, [locale, setLocale]);

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} position="bottom" buttonPosition="bottom-left" />
        <Toaster position="top-center" richColors dir={locale === "ar" ? "rtl" : "ltr"} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
