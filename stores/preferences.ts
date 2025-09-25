"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n-config";

type PreferencesState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => set({ locale }),
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
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);
