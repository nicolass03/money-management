"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { maskNumericValue } from "@/lib/privacy/mask";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "money-mgmt-privacy-mode";

interface PrivacyModeContextValue {
  privacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null);

export function PrivacyModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    setPrivacyMode(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode((current) => {
      const next = !current;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <PrivacyModeContext.Provider value={{ privacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyModeContext.Provider>
  );
}

export function usePrivacyMode() {
  const context = useContext(PrivacyModeContext);
  if (!context) {
    throw new Error("usePrivacyMode must be used within PrivacyModeProvider");
  }
  return context;
}

export function useMaskedValue(value: string): string {
  const { privacyMode } = usePrivacyMode();
  return privacyMode ? maskNumericValue(value) : value;
}

interface MoneyTextProps {
  value: string;
  className?: string;
}

export function MoneyText({ value, className }: MoneyTextProps) {
  const display = useMaskedValue(value);
  return <span className={cn(className)}>{display}</span>;
}
