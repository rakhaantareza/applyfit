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

export type AuthSessionUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: {
    name?: string;
    avatar_url?: string;
  } | null;
};

type AccountProfileResponse = {
  data?: {
    account?: {
      id: string;
      email: string;
      emailVerified: boolean;
      name: string;
      avatarUrl: string | null;
    };
  };
};

type AuthSessionContextValue = {
  user: AuthSessionUser | null;
  loading: boolean;
  refresh: () => Promise<AuthSessionUser | null>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const nextUser = await loadCurrentUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      const nextUser = await loadCurrentUser();
      if (cancelled) return;
      setUser(nextUser);
      setLoading(false);
    }

    void hydrateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh }),
    [loading, refresh, user],
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider.");
  }
  return context;
}

async function loadCurrentUser(): Promise<AuthSessionUser | null> {
  try {
    const response = await fetch("/api/account/profile", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;

    const result = await response.json() as AccountProfileResponse;
    const account = result.data?.account;
    if (!account) return null;

    return {
      id: account.id,
      email: account.email,
      emailVerified: account.emailVerified,
      profile: {
        name: account.name,
        avatar_url: account.avatarUrl ?? undefined,
      },
    };
  } catch {
    return null;
  }
}

export function getAuthDisplayName(user: AuthSessionUser | null) {
  const profileName = user?.profile?.name?.trim();
  if (profileName) return profileName;

  const localPart = user?.email.split("@")[0] ?? "Pengguna";
  const words = localPart.split(/[._-]+/).filter(Boolean);
  if (!words.length) return "Pengguna ApplyFit";

  return words
    .map((word) => `${word.charAt(0).toLocaleUpperCase("id-ID")}${word.slice(1)}`)
    .join(" ");
}

export function getAccountInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toLocaleUpperCase("id-ID") || "AF"
  );
}
