"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppearancePreference = "system" | "light" | "dark";
type ResolvedAppearance = Exclude<AppearancePreference, "system">;

type AppearanceContextValue = {
  appearance: AppearancePreference;
  resolvedAppearance: ResolvedAppearance;
  setAppearance: (appearance: AppearancePreference) => void;
};

const appearanceStorageKey = "applyfit-appearance";
const darkSchemeQuery = "(prefers-color-scheme: dark)";
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function readAppearancePreference(): AppearancePreference {
  const stored = window.localStorage.getItem(appearanceStorageKey);
  return stored === "light" || stored === "dark" ? stored : "system";
}

function resolveAppearance(
  appearance: AppearancePreference,
  prefersDark: boolean,
): ResolvedAppearance {
  if (appearance === "system") return prefersDark ? "dark" : "light";
  return appearance;
}

function applyAppearance(
  appearance: AppearancePreference,
  mediaQuery: MediaQueryList,
) {
  const resolved = resolveAppearance(appearance, mediaQuery.matches);
  document.documentElement.dataset.appearance = appearance;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] =
    useState<AppearancePreference>("system");
  const [resolvedAppearance, setResolvedAppearance] =
    useState<ResolvedAppearance>("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia(darkSchemeQuery);

    function syncAppearance() {
      const nextAppearance = readAppearancePreference();
      setAppearanceState(nextAppearance);
      setResolvedAppearance(applyAppearance(nextAppearance, mediaQuery));
    }

    syncAppearance();
    mediaQuery.addEventListener("change", syncAppearance);
    window.addEventListener("storage", syncAppearance);

    return () => {
      mediaQuery.removeEventListener("change", syncAppearance);
      window.removeEventListener("storage", syncAppearance);
    };
  }, []);

  const setAppearance = useCallback((nextAppearance: AppearancePreference) => {
    const mediaQuery = window.matchMedia(darkSchemeQuery);

    if (nextAppearance === "system") {
      window.localStorage.removeItem(appearanceStorageKey);
    } else {
      window.localStorage.setItem(appearanceStorageKey, nextAppearance);
    }

    setAppearanceState(nextAppearance);
    setResolvedAppearance(applyAppearance(nextAppearance, mediaQuery));
  }, []);

  const value = useMemo(
    () => ({ appearance, resolvedAppearance, setAppearance }),
    [appearance, resolvedAppearance, setAppearance],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider.");
  }
  return context;
}
