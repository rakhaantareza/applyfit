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
    return null;
  }

  return children;
}
