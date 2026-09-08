"use client";

import { AlertCircle, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionButton, ActionLink, CtaArrow } from "../components/ActionControl";
import { PageHeader, SectionHeader } from "../components/ContentHeaders";
import { StableLink as Link } from "../components/StableLink";
import { getAuthDisplayName, useAuthSession } from "../components/AuthSessionProvider";

type CareerProfile = { targetRole: string; careerField: string };
type Skill = { id: string; name: string; status: "active" | "learning" };
type Evidence = { id: string };
type Job = { id: string; title: string; company: string; updatedAt: string };
type Requirement = {
  id: string;
  type: "skill" | "tool" | "education" | "experience";
  priority: "required" | "preferred";
};
type MappingSummary = {
  requirements: Array<Requirement & {
    reviewedWithoutEvidence: boolean;
    skills: Array<{
      id: string;
      status: "active" | "learning";
      evidences: Array<{ id: string }>;
    }>;
  }>;
  informationalRequirements: Requirement[];
  mappedCount: number;
  totalMappableRequirements: number;
};
type RecentAnalysis = {
  jobId: string;
  score: number;
  summary: string;
};
type DashboardData = {
  profile: CareerProfile | null;
  skills: Skill[];
  evidences: Evidence[];
  jobs: Job[];
  requirementsByJob: Map<string, Requirement[]>;
  mappingsByJob: Map<string, MappingSummary>;
  recentAnalyses: RecentAnalysis[];
};
type DashboardSnapshot = { userId: string; data: DashboardData };
type DashboardFailure = { userId: string; message: string };

type WorkflowStep = "detail" | "requirements" | "matching" | "analysis";
type CurrentWork = {
  job: Job;
  activeStep: WorkflowStep;
  isCompleted: boolean;
  actionHref: string;
  actionLabel: string;
  description: string;
  analysis: RecentAnalysis | null;
};
type FoundationGap = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};
type DashboardState =
  | { kind: "onboarding" }
  | { kind: "foundation"; profile: CareerProfile; gap: FoundationGap }
  | { kind: "jobs"; currentWork: CurrentWork | null };

const dashboardDataCache = new Map<string, DashboardData>();
const workflowSteps: Array<{ id: WorkflowStep; label: string }> = [
  { id: "detail", label: "Detail" },
  { id: "requirements", label: "Persyaratan" },
  { id: "matching", label: "Cocokkan Profil" },
  { id: "analysis", label: "Analisis" },
];

export function AdaptiveHomeDashboard() {
  const { user } = useAuthSession();
  const userId = user?.id ?? "";
  const accountName = getAuthDisplayName(user);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(() => {
    const cached = userId ? dashboardDataCache.get(userId) : undefined;
    return cached ? { userId, data: cached } : null;
  });
  const [failure, setFailure] = useState<DashboardFailure | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadDashboard() {
      try {
        const [profileResponse, skillsResponse, evidencesResponse, jobsResponse] = await Promise.all([
          fetch("/api/career-profile", { cache: "no-store" }),
          fetch("/api/career-profile/skills", { cache: "no-store" }),
          fetch("/api/evidences", { cache: "no-store" }),
          fetch("/api/jobs", { cache: "no-store" }),
        ]);
        const [profileResult, skillsResult, evidencesResult, jobsResult] = await Promise.all([
          readJson<ProfileResponse>(profileResponse),
          readJson<SkillsResponse>(skillsResponse),
          readJson<EvidencesResponse>(evidencesResponse),
          readJson<JobsResponse>(jobsResponse),
        ]);
        const failedMessage = profileResult.error?.message
          ?? skillsResult.error?.message
          ?? evidencesResult.error?.message
          ?? jobsResult.error?.message;
        if (![profileResponse, skillsResponse, evidencesResponse, jobsResponse]
          .every((response) => response.ok)) {
          throw new Error(failedMessage ?? "Ringkasan akun belum dapat dimuat.");
        }

        const jobs = jobsResult.data?.jobs ?? [];
        const jobContexts = await Promise.all(jobs.map(async (job) => {
          const [requirementsResponse, mappingResponse] = await Promise.all([
            fetch(`/api/jobs/${encodeURIComponent(job.id)}/requirements`, { cache: "no-store" }),
            fetch(`/api/jobs/${encodeURIComponent(job.id)}/requirements/mapping-summary`, { cache: "no-store" }),
          ]);
          const [requirementsResult, mappingResult] = await Promise.all([
            readJson<RequirementsResponse>(requirementsResponse),
            readJson<MappingResponse>(mappingResponse),
          ]);
          return {
            job,
            requirements: requirementsResponse.ok
              ? requirementsResult.data?.requirements ?? []
              : [],
            mapping: mappingResponse.ok ? mappingResult.data ?? null : null,
          };
        }));

        const analysisCandidates = jobContexts.filter(
          (context) => context.mapping && hasCompletedRequirementReview(context.mapping),
        ).slice(0, 2);
        const recentAnalyses = (await Promise.all(
          analysisCandidates.map(calculateRecentAnalysis),
        )).filter((analysis): analysis is RecentAnalysis => analysis !== null);
        if (!active) return;

        const nextData: DashboardData = {
          profile: profileResult.data?.profile ?? null,
          skills: skillsResult.data?.skills ?? [],
          evidences: evidencesResult.data?.evidences ?? [],
          jobs,
          requirementsByJob: new Map(
            jobContexts.map(({ job, requirements }) => [job.id, requirements]),
          ),
          mappingsByJob: new Map(
            jobContexts.flatMap(({ job, mapping }) => (
              mapping ? [[job.id, mapping] as const] : []
            )),
          ),
          recentAnalyses,
        };
        dashboardDataCache.set(userId, nextData);
        setSnapshot({ userId, data: nextData });
        setFailure(null);
      } catch (requestError) {
        if (active) {
          setFailure({
            userId,
            message: requestError instanceof Error
              ? requestError.message
              : "Ringkasan akun belum dapat dimuat.",
          });
        }
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, [userId]);

  const data = snapshot?.userId === userId
    ? snapshot.data
    : userId ? dashboardDataCache.get(userId) ?? null : null;
  const error = failure?.userId === userId ? failure.message : "";
  const dashboard = useMemo(() => data ? buildDashboardState(data) : null, [data]);

  if (!data || !dashboard) {
    return error ? <DashboardErrorState error={error} /> : null;
  }

  const firstName = accountName.split(/\s+/)[0] ?? accountName;
  const intro = getDashboardIntro(dashboard);

  return (
    <>
      <PageHeader
        className="summary-greeting"
        title={<>Halo, {firstName}.</>}
        description={intro}
      />

      {dashboard.kind === "onboarding" ? (
        <>
          <FirstLoginOnboarding />
          <OnboardingFlowPreview />
        </>
      ) : null}
      {dashboard.kind === "foundation" ? (
        <>
          <CareerFoundationSection profile={dashboard.profile} gap={dashboard.gap} />
          <FoundationContextLink gap={dashboard.gap} />
        </>
      ) : null}
      {dashboard.kind === "jobs" ? (
        <>
          <CurrentWorkSection currentWork={dashboard.currentWork} />
          <JobStateSecondary currentWork={dashboard.currentWork} jobs={data.jobs} />
        </>
      ) : null}
    </>
  );
}

function FirstLoginOnboarding() {
  return (
    <section className="summary-current-work summary-current-work-empty" aria-labelledby="first-login-title">
      <SectionHeader
        className="summary-work-header"
        title="Buat profil kariermu"
        titleId="first-login-title"
        description="Tambahkan target role dan bidang karier sebagai dasar untuk mencocokkan lowongan."
        action={(
          <ActionLink className="career-button primary summary-primary-action" href="/profil-karier">
            Buat profil karier
            <CtaArrow />
          </ActionLink>
        )}
      />
    </section>
  );
}

function OnboardingFlowPreview() {
  return (
    <section className="summary-secondary summary-flow-preview" aria-label="Alur awal ApplyFit">
      <ol>
        <li>Profil karier</li>
        <li>Portfolio &amp; Pengalaman</li>
        <li>Lowongan</li>
      </ol>
    </section>
  );
}

function CurrentWorkSection({ currentWork }: { currentWork: CurrentWork | null }) {
  if (!currentWork) {
    return (
      <section className="summary-current-work summary-current-work-empty" aria-labelledby="current-work-title">
        <SectionHeader
          className="summary-work-header"
          title="Tambahkan lowongan pertamamu"
          titleId="current-work-title"
          description="Simpan deskripsinya agar persyaratan bisa diperiksa dan dicocokkan dengan profilmu."
          action={(
            <ActionLink className="career-button primary summary-primary-action" href="/lowongan/baru">
              Tambah lowongan
              <CtaArrow />
            </ActionLink>
          )}
        />
      </section>
    );
  }

  const activeIndex = workflowSteps.findIndex((step) => step.id === currentWork.activeStep);

  return (
    <section
      className={`summary-current-work${currentWork.isCompleted ? " completed" : ""}`}
      aria-labelledby="current-work-title"
    >
      <p className="summary-work-context type-metadata">
        {currentWork.isCompleted ? "Analisis terakhir" : "Lanjutkan lowongan"}
      </p>
      <div className="summary-work-layout">
        <div className="summary-work-copy">
          <h2 className="type-section-title" id="current-work-title">{currentWork.job.title}</h2>
          <p className="summary-job-meta type-metadata">
            <span>{currentWork.job.company}</span>
            <span aria-hidden="true">·</span>
            <span>{formatActivityDate(currentWork.job.updatedAt)}</span>
          </p>
          <p className="summary-next-copy">{currentWork.description}</p>
        </div>
        <div className="summary-work-action">
          {currentWork.analysis ? (
            <div className="summary-fit-score" aria-label={`Fit Score ${formatNumber(currentWork.analysis.score)} persen`}>
              <strong>{formatNumber(currentWork.analysis.score)}%</strong>
              <span>Fit Score</span>
            </div>
          ) : null}
          <ActionLink className="career-button primary summary-primary-action" href={currentWork.actionHref}>
            {currentWork.actionLabel}
            <CtaArrow />
          </ActionLink>
        </div>
      </div>

      <ol
        className="summary-workflow"
        aria-label={currentWork.isCompleted
          ? "Semua tahap lowongan selesai"
          : `Tahap saat ini: ${workflowSteps[activeIndex].label}`}
      >
        {workflowSteps.map((step, index) => {
          const isComplete = currentWork.isCompleted || index < activeIndex;
          const isCurrent = !currentWork.isCompleted && index === activeIndex;
          return (
            <li
              className={`${isComplete ? "complete" : ""}${isCurrent ? " current" : ""}`}
              key={step.id}
            >
              <span className="summary-step-marker" aria-hidden="true">
                {isComplete ? <Check size={11} strokeWidth={2.5} /> : null}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function CareerFoundationSection({
  profile,
  gap,
}: {
  profile: CareerProfile;
  gap: FoundationGap;
}) {
  const targetRole = profile.targetRole.trim();
  const careerField = profile.careerField.trim();

  return (
    <section className="summary-foundation" aria-labelledby="career-foundation-title">
      <div className="summary-foundation-heading">
        <SectionHeader title="Dasar karier" titleId="career-foundation-title" />
        <h3 className="type-primary-title">{targetRole || "Profil kariermu"}</h3>
        {careerField ? <p>{careerField}</p> : null}
      </div>

      <div className="summary-gap">
        <AlertCircle aria-hidden="true" size={18} strokeWidth={1.8} />
        <div>
          <strong>{gap.title}</strong>
          <p>{gap.description}</p>
          <ActionLink className="career-button primary summary-primary-action" href={gap.href}>
            {gap.linkLabel}
            <CtaArrow />
          </ActionLink>
        </div>
      </div>
    </section>
  );
}

function FoundationContextLink({ gap }: { gap: FoundationGap }) {
  if (gap.href === "/profil-karier") return null;

  return (
    <nav className="summary-secondary summary-secondary-nav" aria-label="Konteks dasar karier">
      <ActionLink variant="text" href="/profil-karier">
        Lihat profil karier
        <CtaArrow />
      </ActionLink>
    </nav>
  );
}

function JobStateSecondary({
  currentWork,
  jobs,
}: {
  currentWork: CurrentWork | null;
  jobs: Job[];
}) {
  if (!currentWork) {
    return (
      <section className="summary-secondary summary-secondary-copy" aria-labelledby="profile-reuse-title">
        <SectionHeader
          title="Profilmu akan dipakai kembali"
          titleId="profile-reuse-title"
          description="Profil dan portfolio yang sudah kamu buat akan digunakan saat mencocokkan setiap lowongan."
        />
      </section>
    );
  }

  if (!currentWork.isCompleted) {
    const hasMultipleJobs = jobs.length > 1;
    return (
      <nav className="summary-secondary summary-secondary-nav" aria-label="Akses lowongan">
        <ActionLink variant="text" href={hasMultipleJobs ? "/lowongan" : `/lowongan/${currentWork.job.id}`}>
          {hasMultipleJobs ? "Lihat semua lowongan" : "Lihat detail lowongan"}
          <CtaArrow />
        </ActionLink>
      </nav>
    );
  }

  if (jobs.length === 1) {
    return (
      <section className="summary-secondary summary-secondary-copy" aria-labelledby="next-job-title">
        <SectionHeader
          title="Cek lowongan berikutnya"
          titleId="next-job-title"
          description="Profil dan portfolio yang sama bisa langsung dipakai untuk analisis lowongan lain."
          action={(
            <ActionLink className="career-button secondary" variant="secondary" href="/lowongan/baru">
              Tambah lowongan
              <CtaArrow />
            </ActionLink>
          )}
        />
      </section>
    );
  }

  const recentJobs = jobs.filter((job) => job.id !== currentWork.job.id).slice(0, 3);
  return (
    <section className="summary-secondary summary-latest-jobs" aria-labelledby="latest-jobs-title">
      <SectionHeader
        title="Lowongan terbaru"
        titleId="latest-jobs-title"
        action={(
          <ActionLink variant="text" href="/lowongan">
            Lihat semua lowongan
            <CtaArrow />
          </ActionLink>
        )}
      />
      <ul>
        {recentJobs.map((job) => (
          <li key={job.id}>
            <Link href={`/lowongan/${job.id}`}>
              <span>
                <strong>{job.title}</strong>
                <small>{job.company}</small>
              </span>
              <small>{formatActivityDate(job.updatedAt)}</small>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildDashboardState(data: DashboardData): DashboardState {
  if (!data.profile) {
    return { kind: "onboarding" };
  }

  const foundationGap = buildFoundationGap(data);
  if (foundationGap) {
    return { kind: "foundation", profile: data.profile, gap: foundationGap };
  }

  const primaryJob = data.jobs[0] ?? null;
  const currentWork = primaryJob ? buildCurrentWork(data, primaryJob) : null;

  return { kind: "jobs", currentWork };
}

function getDashboardIntro(dashboard: DashboardState) {
  if (dashboard.kind === "onboarding") {
    return "Mulai dengan profil karier yang akan dipakai untuk membandingkan lowongan.";
  }
  if (dashboard.kind === "foundation") {
    return "Lengkapi satu bagian dasar kariermu sebelum mencocokkan lowongan.";
  }
  if (dashboard.currentWork?.isCompleted) {
    return "Lihat kembali hasil analisis terakhirmu atau mulai dari lowongan lain.";
  }
  if (dashboard.currentWork) {
    return "Lanjutkan lowongan terakhir dari langkah yang masih perlu kamu selesaikan.";
  }
  return "Mulai dengan satu lowongan yang ingin kamu cek.";
}

function buildCurrentWork(data: DashboardData, job: Job): CurrentWork {
  const requirements = data.requirementsByJob.get(job.id) ?? [];
  const mapping = data.mappingsByJob.get(job.id);
  const jobBase = `/lowongan/${job.id}`;
  const analysis = data.recentAnalyses.find((item) => item.jobId === job.id) ?? null;

  if (requirements.length === 0) {
    return {
      job,
      activeStep: "detail",
      isCompleted: false,
      actionHref: jobBase,
      actionLabel: "Ambil persyaratan",
      description: "Deskripsi lowongan sudah tersimpan. Ambil persyaratannya untuk mulai membandingkan.",
      analysis: null,
    };
  }

  if (!mapping || mapping.totalMappableRequirements === 0) {
    return {
      job,
      activeStep: "requirements",
      isCompleted: false,
      actionHref: `${jobBase}/persyaratan`,
      actionLabel: "Periksa persyaratan",
      description: "Persyaratan sudah tersedia. Periksa hasilnya sebelum lanjut.",
      analysis: null,
    };
  }

  const unresolved = countPendingRequirementReviews(mapping);
  if (unresolved > 0) {
    return {
      job,
      activeStep: "matching",
      isCompleted: false,
      actionHref: `${jobBase}/cocokkan-profil`,
      actionLabel: "Cocokkan Profil",
      description: `${unresolved} persyaratan masih perlu dicocokkan dengan profilmu.`,
      analysis: null,
    };
  }

  return {
    job,
    activeStep: "analysis",
    isCompleted: analysis !== null,
    actionHref: `${jobBase}/analisis`,
    actionLabel: analysis ? "Lihat analisis" : "Buka analisis",
    description: analysis?.summary ?? "Semua persyaratan sudah ditinjau. Analisis siap dibuka.",
    analysis,
  };
}

function countPendingRequirementReviews(mapping: MappingSummary) {
  const requirementsMissingFromSummary = Math.max(
    mapping.totalMappableRequirements - mapping.requirements.length,
    0,
  );
  const requirementsNeedingReview = mapping.requirements.filter(
    (requirement) => requirement.skills.length === 0 && !requirement.reviewedWithoutEvidence,
  ).length;
  return requirementsMissingFromSummary + requirementsNeedingReview;
}

function hasCompletedRequirementReview(mapping: MappingSummary) {
  return mapping.totalMappableRequirements > 0 && countPendingRequirementReviews(mapping) === 0;
}

function buildFoundationGap(data: DashboardData): FoundationGap | null {
  const hasCareerDirection = Boolean(
    data.profile?.targetRole.trim() && data.profile?.careerField.trim(),
  );

  if (!hasCareerDirection) {
    return {
      title: "Lengkapi arah kariermu",
      description: "Tambahkan target role dan bidang karier agar profilmu punya konteks yang jelas.",
      href: "/profil-karier",
      linkLabel: "Buka profil",
    };
  }

  if (data.skills.length === 0) {
    return {
      title: "Tambahkan skill utama",
      description: "Catat skill yang ingin kamu bandingkan dengan persyaratan lowongan.",
      href: "/profil-karier",
      linkLabel: "Tambah skill",
    };
  }

  if (data.evidences.length === 0) {
    return {
      title: "Skillmu belum punya pendukung",
      description: "Tambahkan project, pengalaman, sertifikat, portfolio, atau GitHub yang relevan.",
      href: "/portfolio-pengalaman",
      linkLabel: "Tambah portfolio",
    };
  }

  return null;
}

function DashboardErrorState({ error }: { error: string }) {
  return (
    <div className="career-profile-state error" role="alert">
      <AlertCircle aria-hidden="true" size={22} />
      <strong>{error}</strong>
      <ActionButton size="compact" variant="secondary" type="button" onClick={() => window.location.reload()}>Coba lagi</ActionButton>
    </div>
  );
}

async function calculateRecentAnalysis(context: {
  job: Job;
  requirements: Requirement[];
  mapping: MappingSummary | null;
}): Promise<RecentAnalysis | null> {
  if (!context.mapping) return null;
  const mappingById = new Map(
    context.mapping.requirements.map((requirement) => [requirement.id, requirement]),
  );
  const payload = context.requirements.map((requirement) => {
    const mapping = mappingById.get(requirement.id);
    return {
      id: requirement.id,
      type: requirement.type,
      priority: requirement.priority,
      mappings: mapping?.skills.map((skill) => ({
        skill: { id: skill.id, status: skill.status },
        linkedEvidenceIds: skill.evidences.map((evidence) => evidence.id),
      })) ?? [],
    };
  });
  const response = await fetch("/api/fit-score/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: context.job.id, requirements: payload }),
  });
  const result = await readJson<FitScoreResponse>(response);
  if (!response.ok || !result.data) return null;

  const counts = result.data.statusCounts;
  const needsAttention = counts.partial + counts.learning + counts.missing;
  const summary = needsAttention > 0
    ? `${counts.proven} persyaratan sudah terbukti · ${needsAttention} lainnya belum sepenuhnya terbukti`
    : `${counts.proven} persyaratan sudah terbukti.`;

  return {
    jobId: context.job.id,
    score: result.data.score,
    summary,
  };
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Aktivitas terbaru";
  return `Diperbarui ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
}

type ProfileResponse = { data?: { profile?: CareerProfile | null }; error?: { message?: string } };
type SkillsResponse = { data?: { skills?: Skill[] }; error?: { message?: string } };
type EvidencesResponse = { data?: { evidences?: Evidence[] }; error?: { message?: string } };
type JobsResponse = { data?: { jobs?: Job[] }; error?: { message?: string } };
type RequirementsResponse = { data?: { requirements?: Requirement[] }; error?: { message?: string } };
type MappingResponse = { data?: MappingSummary; error?: { message?: string } };
type FitScoreResponse = {
  data?: {
    score: number;
    excludedRequirements: number;
    statusCounts: Record<"proven" | "partial" | "learning" | "missing", number>;
  };
};

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}
