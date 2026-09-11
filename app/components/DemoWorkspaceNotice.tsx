"use client";
import { useI18n } from "./LanguageProvider";

import { Eye } from "lucide-react";
import { useAuthSession } from "./AuthSessionProvider";

export function DemoWorkspaceNotice({ variant }: { variant: "app" | "focus" }) {
  const { t } = useI18n();
  const { user } = useAuthSession();

  if (!user?.isDemo) return null;

  return (
    <aside
      className={`demo-workspace-notice demo-workspace-notice-${variant}`}
      aria-label={t("Ruang demo")}
    >
      <Eye aria-hidden="true" size={15} strokeWidth={1.8} />
      <p>
        <strong>{t("Ruang demo hanya untuk dilihat.")}</strong>{" "}
        {t("Perubahan tidak dapat disimpan.")}
      </p>
    </aside>
  );
}
