"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { applyLocaleToDocument } from "@/lib/locale-client";
import { usePreferencesStore } from "@/stores/preferences";

export function AdminLanguageInitializer() {
  const router = useRouter();
  const initializedRef = useRef(false);
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    if (language !== "en") {
      initializedRef.current = true;
      setLanguage("en");
      applyLocaleToDocument("en");

      fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      }).finally(() => {
        router.refresh();
      });
    }
  }, [language, router, setLanguage]);

  return null;
}

