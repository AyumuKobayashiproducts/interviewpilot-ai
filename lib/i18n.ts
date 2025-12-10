"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import React from "react";

import en from "@/locales/en.json";
import ja from "@/locales/ja.json";

export type Language = "en" | "ja";

const translations: Record<Language, Record<string, string>> = {
  en,
  ja,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const t = useCallback(
    (key: string): string => {
      return translations[language][key] || key;
    },
    [language]
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function getTranslation(language: Language, key: string): string {
  return translations[language][key] || key;
}



