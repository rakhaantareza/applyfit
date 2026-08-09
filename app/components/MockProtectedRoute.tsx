"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";

type MockProtectedRouteProps = {
  children: ReactNode;
};

export function MockProtectedRoute({ children }: MockProtectedRouteProps) {
  const hasSession = useSyncExternalStore(
    subscribeToMockSession,
    getMockSession,
    getServerMockSession,
  );

  useEffect(() => {
    if (!hasSession) window.location.replace("/login?next=/beranda");
  }, [hasSession]);

  if (!hasSession) {
    return (
      <main className="mock-route-check" aria-live="polite">
        <span className="brand-mark" aria-hidden="true">A</span>
        <strong>Memeriksa sesi demo…</strong>
      </main>
    );
  }

  return children;
}

function subscribeToMockSession(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getMockSession() {
  return Boolean(
    window.localStorage.getItem("applyfit-demo-session") ??
    window.sessionStorage.getItem("applyfit-demo-session"),
  );
}

function getServerMockSession() {
  return false;
}
