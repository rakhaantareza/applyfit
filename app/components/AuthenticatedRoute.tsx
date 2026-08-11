"use client";

import { type ReactNode, useEffect } from "react";
import { useAuthSession } from "./AuthSessionProvider";

export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (loading || user) return;
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, user]);

  if (loading || !user) {
    return (
      <main className="session-route-check" aria-live="polite">
        <span className="brand-mark session-logo-flip" aria-hidden="true">A</span>
        <strong>Menyiapkan ruang kerjamu…</strong>
      </main>
    );
  }

  return children;
}
