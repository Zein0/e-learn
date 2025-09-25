"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n-config";

type PreferencesState = {
  language: Locale;
  setLanguage: (language: Locale) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: DEFAULT_LOCALE,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "preferences-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
            clear: () => undefined,
            key: () => null,
            length: 0,
          } as Storage;
        }
        return localStorage;
      }),
      partialize: (state) => ({ language: state.language }),
    },
  ),
);
