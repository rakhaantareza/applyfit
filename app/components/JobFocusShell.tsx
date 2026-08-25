import type { ReactNode } from "react";
import { AppTopBar } from "./AppTopBar";
import {
  JobWorkspaceNav,
  type JobWorkspaceStep,
} from "./JobWorkspaceNav";

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
  const mainClasses = ["job-focus-main", mainClassName]
    .filter(Boolean)
    .join(" ");
  const jobContext = `${title || "Lowongan"} — ${company || "Memuat konteks lowongan…"}`;

  return (
    <div className="job-focus-shell">
      <AppTopBar
        backHref="/lowongan"
        context={["Lowongan", jobContext]}
        variant="focus"
      />
      <header className="job-focus-tabs">
        <JobWorkspaceNav activeStep={activeStep} jobId={jobId} />
      </header>
      <main className={mainClasses} id="top">
        {children}
      </main>
    </div>
  );
}
