"use client";
import { useI18n } from "./LanguageProvider";

import { StableLink as Link } from "./StableLink";

export type JobWorkspaceStep = "detail" | "requirements" | "match" | "analysis";

const workspaceSteps = [
  { id: "detail", label: "Detail", path: "" },
  { id: "requirements", label: "Persyaratan", path: "/persyaratan" },
  { id: "match", label: "Cocokkan Profil", path: "/cocokkan-profil" },
  { id: "analysis", label: "Analisis", path: "/analisis" },
] as const;

export function JobWorkspaceNav({
  activeStep,
  jobId,
}: {
  activeStep: JobWorkspaceStep;
  jobId: string;
}) {
  const { t } = useI18n();
  const jobHref = `/lowongan/${encodeURIComponent(jobId)}`;

  return (
    <nav className="job-workspace-nav" aria-label={t("Navigasi lowongan")}>
      {workspaceSteps.map((step, index) => {
        const isActive = step.id === activeStep;
        return (
          <Link
            className={isActive ? "active" : undefined}
            href={`${jobHref}${step.path}`}
            aria-current={isActive ? "page" : undefined}
            key={step.id}
          >
            <span className="workspace-step-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{t(step.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
