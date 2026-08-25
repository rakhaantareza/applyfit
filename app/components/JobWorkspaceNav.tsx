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
  const jobHref = `/lowongan/${encodeURIComponent(jobId)}`;

  return (
    <nav className="job-workspace-nav" aria-label="Navigasi lowongan">
      {workspaceSteps.map((step) => {
        const isActive = step.id === activeStep;
        return (
          <Link
            className={isActive ? "active" : undefined}
            href={`${jobHref}${step.path}`}
            aria-current={isActive ? "page" : undefined}
            key={step.id}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}
