"use client";
import { useI18n } from "./LanguageProvider";

import type { ReactNode } from "react";

/** An ordered relationship; it never implies completion or a score. */
export function ConnectionPath({
  steps,
  label,
  className = "",
}: {
  steps: ReactNode[];
  label: string;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <ol className={`connection-path ${className}`} aria-label={t(label)}>
      {steps.map((step, index) => (
        <li key={index}>
          <span className="connection-node" aria-hidden="true" />
          <span>{t(step)}</span>
        </li>
      ))}
    </ol>
  );
}
