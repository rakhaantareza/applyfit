"use client";

import { Eye } from "lucide-react";
import { useAuthSession } from "./AuthSessionProvider";

export function DemoWorkspaceNotice({ variant }: { variant: "app" | "focus" }) {
  const { user } = useAuthSession();

  if (!user?.isDemo) return null;

  return (
    <aside
      className={`demo-workspace-notice demo-workspace-notice-${variant}`}
      aria-label="Ruang demo"
    >
      <Eye aria-hidden="true" size={15} strokeWidth={1.8} />
      <p>
        <strong>Ruang demo hanya untuk dilihat.</strong>{" "}
        Perubahan tidak dapat disimpan.
      </p>
    </aside>
  );
}
