"use client";
import type { ReactNode } from "react";
import { useI18n } from "./LanguageProvider";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { DemoWorkspaceNotice } from "./DemoWorkspaceNotice";
import { JobWorkspaceNav, type JobWorkspaceStep } from "./JobWorkspaceNav";

type JobFocusShellProps = {
  activeStep: JobWorkspaceStep;
  children: ReactNode;
  company?: string | null;
  jobId: string;
  mainClassName?: string;
  title?: string | null;
};

export function JobFocusShell({
  activeStep,
  children,
  company,
  jobId,
  mainClassName,
  title,
}: JobFocusShellProps) {
  const { t } = useI18n();
  const mainClasses = ["job-focus-main", mainClassName]
    .filter(Boolean)
    .join(" ");
  // Keep this declaration compatible with the rendered-source contract.
  // prettier-ignore
  const jobContext = title ? `${title}${company ? ` — ${company}` : ""}`
    : t("Memuat konteks lowongan…");

  return (
    <div className="job-focus-shell">
      <AppTopBar
        backHref="/lowongan"
        context={["Lowongan", jobContext]}
        variant="focus"
        showSidebarControls
      />
      <div className="job-focus-mobile-navigation">
        <AppSidebar activeItem="Lowongan" />
      </div>
      <header className="job-focus-tabs">
        <JobWorkspaceNav activeStep={activeStep} jobId={jobId} />
      </header>
      <main className={mainClasses} id="top">
        <DemoWorkspaceNotice variant="focus" />
        {children}
      </main>
    </div>
  );
}
