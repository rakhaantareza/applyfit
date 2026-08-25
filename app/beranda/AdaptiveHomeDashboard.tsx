"use client";

import { AlertCircle, ArrowRight, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
          (context) => context.mapping
            && context.mapping.totalMappableRequirements > 0
            && context.mapping.mappedCount === context.mapping.totalMappableRequirements,
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

  return (
    <>
      <header className="home-header summary-greeting">
        <h1>Halo, {firstName}.</h1>
        <p>
          {dashboard.currentWork?.isCompleted
            ? "Lihat kembali hasil analisis terakhirmu atau mulai dari lowongan lain."
            : dashboard.currentWork
              ? "Lanjutkan lowongan terakhir dari langkah yang masih perlu kamu selesaikan."
              : "Mulai dengan satu lowongan yang ingin kamu cek."}
        </p>
      </header>

      <CurrentWorkSection currentWork={dashboard.currentWork} />
      <CareerFoundationSection
        profile={data.profile}
        gap={dashboard.foundationGap}
      />
    </>
  );
}

function CurrentWorkSection({ currentWork }: { currentWork: CurrentWork | null }) {
  if (!currentWork) {
    return (
      <section className="summary-current-work summary-current-work-empty" aria-labelledby="current-work-title">
        <div className="summary-work-copy">
          <p className="summary-label">Mulai dari sini</p>
          <h2 id="current-work-title">Tambahkan lowongan yang sedang kamu pertimbangkan</h2>
          <p>Simpan deskripsinya agar persyaratan bisa diperiksa dan dicocokkan dengan profilmu.</p>
        </div>
        <Link className="career-button primary summary-primary-action" href="/lowongan/baru">
          Tambah lowongan
          <ArrowRight aria-hidden="true" size={16} strokeWidth={1.9} />
        </Link>
      </section>
    );
  }

  const activeIndex = workflowSteps.findIndex((step) => step.id === currentWork.activeStep);

  return (
    <section className="summary-current-work" aria-labelledby="current-work-title">
      <div className="summary-work-layout">
        <div className="summary-work-copy">
          <p className="summary-label">
            {currentWork.isCompleted ? "Analisis terakhir" : "Lanjutkan lowongan"}
          </p>
          <h2 id="current-work-title">{currentWork.job.title}</h2>
          <p className="summary-job-meta">
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
          <Link className="career-button primary summary-primary-action" href={currentWork.actionHref}>
            {currentWork.actionLabel}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.9} />
          </Link>
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
  profile: CareerProfile | null;
  gap: FoundationGap | null;
}) {
  const targetRole = profile?.targetRole.trim();
  const careerField = profile?.careerField.trim();

  return (
    <section className="summary-foundation" aria-labelledby="career-foundation-title">
      <div className="summary-foundation-heading">
        <p className="summary-label">Dasar karier</p>
        <h2 id="career-foundation-title">{targetRole || "Profil kariermu"}</h2>
        {careerField ? <p>{careerField}</p> : null}
      </div>

      {gap ? (
        <div className="summary-gap">
          <AlertCircle aria-hidden="true" size={18} strokeWidth={1.8} />
          <div>
            <strong>{gap.title}</strong>
            <p>{gap.description}</p>
            <Link href={gap.href}>
              {gap.linkLabel}
              <ArrowRight aria-hidden="true" size={14} strokeWidth={1.9} />
            </Link>
          </div>
        </div>
      ) : (
        <p className="summary-foundation-note">
          Profil kariermu siap dipakai untuk lowongan berikutnya.
        </p>
      )}
    </section>
  );
}

function buildDashboardState(data: DashboardData) {
  const primaryJob = data.jobs[0] ?? null;
  const currentWork = primaryJob ? buildCurrentWork(data, primaryJob) : null;

  return {
    currentWork,
    foundationGap: buildFoundationGap(data),
  };
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

  if (mapping.mappedCount < mapping.totalMappableRequirements) {
    const unresolved = mapping.totalMappableRequirements - mapping.mappedCount;
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
    description: analysis?.summary ?? "Profil sudah dicocokkan. Analisis siap dibuka.",
    analysis,
  };
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
      <button type="button" onClick={() => window.location.reload()}>Coba lagi</button>
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
    ? `${counts.proven} persyaratan sudah terbukti · ${needsAttention} masih belum terbukti`
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
