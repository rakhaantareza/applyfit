"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
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

type AuthSessionState = Pick<AuthSessionContextValue, "user" | "loading">;

const initialAuthSessionState: AuthSessionState = {
  user: null,
  loading: true,
};
let authSessionState = initialAuthSessionState;
let authBootstrapRequest: Promise<AuthSessionUser | null> | null = null;
const authSessionListeners = new Set<() => void>();

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  return children;
}

export function useAuthSession() {
  const { user, loading } = useSyncExternalStore(
    subscribeToAuthSession,
    getAuthSessionState,
    getInitialAuthSessionState,
  );
  const refresh = useCallback(() => refreshAuthSession(), []);

  return useMemo(
    () => ({ user, loading, refresh }),
    [loading, refresh, user],
  );
}

function subscribeToAuthSession(listener: () => void) {
  authSessionListeners.add(listener);
  return () => authSessionListeners.delete(listener);
}

function getAuthSessionState() {
  return authSessionState;
}

function getInitialAuthSessionState() {
  return initialAuthSessionState;
}

function publishAuthSession(nextState: AuthSessionState) {
  authSessionState = nextState;
  authSessionListeners.forEach((listener) => listener());
}

function bootstrapAuthSession() {
  if (!authSessionState.loading) {
    return Promise.resolve(authSessionState.user);
  }

  if (!authBootstrapRequest) {
    authBootstrapRequest = refreshAuthSession().finally(() => {
      authBootstrapRequest = null;
    });
  }

  return authBootstrapRequest;
}

async function refreshAuthSession() {
  const nextUser = await loadCurrentUser();
  publishAuthSession({ user: nextUser, loading: false });
  return nextUser;
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
