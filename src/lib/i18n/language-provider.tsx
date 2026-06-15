"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n from "@/lib/i18n";
import { useSession } from "@/lib/auth/session-store";
import { useSettings } from "@/hooks/use-queries";
import type { AppLanguage } from "@/lib/types/domain";

const LANGUAGE_STORAGE_KEY = "incm-mgmt-language";
const DEFAULT_LANGUAGE: AppLanguage = "en";

function getPreferredLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

function getStoredLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return raw === "en" || raw === "es" ? raw : null;
}

function storeLanguage(language: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

function applyLanguage(language: AppLanguage) {
  document.documentElement.lang = language;
  void i18n.changeLanguage(language);
}

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { canAccessApp } = useSession();
  const settings = useSettings(canAccessApp);
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return getStoredLanguage() ?? getPreferredLanguage();
  });

  useEffect(() => {
    const localLanguage = getStoredLanguage() ?? getPreferredLanguage();
    setLanguageState(localLanguage);
    applyLanguage(localLanguage);
  }, []);

  useEffect(() => {
    if (!canAccessApp || !settings.data?.language) return;
    const fromApi = settings.data.language;
    if (fromApi !== language) {
      setLanguageState(fromApi);
      storeLanguage(fromApi);
      applyLanguage(fromApi);
    }
  }, [canAccessApp, language, settings.data?.language]);

  async function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage);
    storeLanguage(nextLanguage);
    applyLanguage(nextLanguage);
  }

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
