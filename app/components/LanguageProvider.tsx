"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translate, type Language } from "../lib/i18n/translate";
import { usePathname } from "next/navigation";

export type { Language } from "../lib/i18n/translate";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
}>({ language: "id", setLanguage: () => {} });

const pageTitles: Record<string, string> = {
  "/beranda": "Ringkasan",
  "/profil-karier": "Profil",
  "/portfolio-pengalaman": "Portfolio & Pengalaman",
  "/lowongan": "Lowongan",
  "/lowongan/baru": "Tambah lowongan",
  "/pengaturan": "Pengaturan",
  "/contoh-perhitungan": "Cara Fit Score dihitung",
  "/login": "Masuk",
  "/daftar": "Buat Akun",
  "/lupa-kata-sandi": "Lupa Kata Sandi",
  "/reset-kata-sandi": "Reset Kata Sandi",
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, updateLanguage] = useState<Language>("id");
  useEffect(() => {
    function sync() {
      try {
        updateLanguage(
          localStorage.getItem("applyfit-language") === "en" ? "en" : "id",
        );
      } catch {
        /* Storage is optional. */
      }
    }
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    const title =
      pageTitles[pathname] ??
      (pathname.endsWith("/analisis")
        ? "Analisis"
        : pathname.endsWith("/cocokkan-profil")
          ? "Cocokkan Profil"
          : pathname.endsWith("/persyaratan")
            ? "Persyaratan"
            : /^\/lowongan\/[^/]+$/.test(pathname)
              ? "Detail Lowongan"
              : null);
    if (title) document.title = `${translate(title, language)} | ApplyFit`;
  }, [language, pathname]);
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    try {
      localStorage.setItem("applyfit-language", next);
    } catch {
      /* Keep the in-session choice. */
    }
  }, []);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);
  const t = useCallback(
    <T,>(value: T): T => translate(value, context.language),
    [context.language],
  );
  return { ...context, t };
}

/** Explicit boundary for static copy in server-rendered pages. */
export function Message({ children }: { children: string }) {
  const { t } = useI18n();
  return t(children);
}
