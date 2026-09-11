"use client";
import { BrandMotif } from "../components/BrandMotif";
import { useI18n } from "../components/LanguageProvider";

import { AlertCircle, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  ActionLink,
  CtaArrow,
} from "../components/ActionControl";
import { PageHeader, SectionHeader } from "../components/ContentHeaders";
import { StableLink as Link } from "../components/StableLink";
import { WorkspaceLoadingState } from "../components/WorkspaceLoadingState";
import {
  getAuthDisplayName,
  useAuthSession,
} from "../components/AuthSessionProvider";

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
  requirements: Array<
    Requirement & {
      reviewedWithoutEvidence: boolean;
      skills: Array<{
        id: string;
        status: "active" | "learning";
        evidences: Array<{ id: string }>;
      }>;
    }
  >;
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
  const { t } = useI18n();
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
        const response = await fetch("/api/workspace?scope=dashboard", {
          cache: "no-store",
        });
        const result = await readJson<DashboardResponse>(response);
        if (!response.ok || !result.data) {
          throw new Error(
            result.error?.message ?? "Ringkasan akun belum dapat dimuat.",
          );
        }
        const {
          profile,
          skills,
          evidences,
          jobs,
          jobContexts,
          recentAnalyses,
        } = result.data;
        if (!active) return;

        const nextData: DashboardData = {
          profile,
          skills,
          evidences,
          jobs,
          requirementsByJob: new Map(
            jobContexts.map(({ jobId, requirements }) => [jobId, requirements]),
          ),
          mappingsByJob: new Map(
            jobContexts.map(({ jobId, mapping }) => [jobId, mapping]),
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
            message:
              requestError instanceof Error
                ? requestError.message
                : "Ringkasan akun belum dapat dimuat.",
          });
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [userId]);

  const data =
    snapshot?.userId === userId
      ? snapshot.data
      : userId
        ? (dashboardDataCache.get(userId) ?? null)
        : null;
  const error = failure?.userId === userId ? failure.message : "";
  const dashboard = useMemo(
    () => (data ? buildDashboardState(data) : null),
    [data],
  );

  if (!data || !dashboard) {
    return error ? (
      <DashboardErrorState error={error} />
    ) : (
      <WorkspaceLoadingState rows={4} />
    );
  }

  const firstName = accountName.split(/\s+/)[0] ?? accountName;
  const intro = getDashboardIntro(dashboard);

  return (
    <>
      <PageHeader
        className="summary-greeting"
        title={
          <>
            {t("Halo,")} {firstName}.
          </>
        }
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
          <CareerFoundationSection
            profile={dashboard.profile}
            gap={dashboard.gap}
          />
          <FoundationContextLink gap={dashboard.gap} />
        </>
      ) : null}
      {dashboard.kind === "jobs" ? (
        <>
          <CurrentWorkSection currentWork={dashboard.currentWork} />
          <JobStateSecondary
            currentWork={dashboard.currentWork}
            jobs={data.jobs}
          />
        </>
      ) : null}
    </>
  );
}

function FirstLoginOnboarding() {
  const { t } = useI18n();
  return (
    <section
      className="summary-current-work summary-current-work-empty"
      aria-labelledby="first-login-title"
    >
      <SectionHeader
        className="summary-work-header"
        title={t("Buat profil kariermu")}
        titleId="first-login-title"
        description={t(
          "Tambahkan target role dan bidang karier sebagai dasar untuk mencocokkan lowongan.",
        )}
        action={
          <ActionLink
            className="career-button primary summary-primary-action"
            href="/profil-karier"
          >
            {t("Buat profil karier")}
            <CtaArrow />
          </ActionLink>
        }
      />
    </section>
  );
}

function OnboardingFlowPreview() {
  const { t } = useI18n();
  return (
    <section
      className="summary-secondary summary-flow-preview"
      aria-label={t("Alur awal ApplyFit")}
    >
      <ol>
        <li>{t("Profil karier")}</li>
        <li>{t("Portfolio & Pengalaman")}</li>
        <li>{t("Lowongan")}</li>
      </ol>
    </section>
  );
}

function CurrentWorkSection({
  currentWork,
}: {
  currentWork: CurrentWork | null;
}) {
  const { t, language } = useI18n();
  if (!currentWork) {
    return (
      <section
        className="summary-current-work summary-current-work-empty"
        aria-labelledby="current-work-title"
      >
        <SectionHeader
          className="summary-work-header"
          title={t("Tambahkan lowongan pertamamu")}
          titleId="current-work-title"
          description={t(
            "Simpan deskripsinya agar persyaratan bisa diperiksa dan dicocokkan dengan profilmu.",
          )}
          action={
            <ActionLink
              className="career-button primary summary-primary-action"
              href="/lowongan/baru"
            >
              {t("Tambah lowongan")}
              <CtaArrow />
            </ActionLink>
          }
        />
      </section>
    );
  }

  const activeIndex = workflowSteps.findIndex(
    (step) => step.id === currentWork.activeStep,
  );

  return (
    <section
      className={`summary-current-work${currentWork.isCompleted ? " completed" : ""}`}
      aria-labelledby="current-work-title"
    >
      <p className="summary-work-context type-metadata">
        {currentWork.isCompleted
          ? t("Analisis terakhir")
          : t("Lanjutkan lowongan")}
      </p>
      <div className="summary-work-layout">
        <div className="summary-work-copy">
          <h2 className="type-section-title" id="current-work-title">
            {currentWork.job.title}
          </h2>
          <p className="summary-job-meta type-metadata">
            <span>{currentWork.job.company}</span>
            <span aria-hidden="true">·</span>
            <span>
              {t(formatActivityDate(currentWork.job.updatedAt, language))}
            </span>
          </p>
          <p className="summary-next-copy">{t(currentWork.description)}</p>
        </div>
        <div className="summary-work-action">
          <span className="card-brand-accent" aria-hidden="true">
            <BrandMotif />
          </span>
          {currentWork.analysis ? (
            <div
              className="summary-fit-score"
              aria-label={t(
                `Fit Score ${formatNumber(currentWork.analysis.score, language)} persen`,
              )}
            >
              <strong>
                {formatNumber(currentWork.analysis.score, language)}%
              </strong>
              <span>Fit Score</span>
            </div>
          ) : null}
          <ActionLink
            className="career-button primary summary-primary-action"
            href={currentWork.actionHref}
          >
            {t(currentWork.actionLabel)}
            <CtaArrow />
          </ActionLink>
        </div>
      </div>

      <ol
        className="summary-workflow"
        aria-label={
          currentWork.isCompleted
            ? t("Semua tahap lowongan selesai")
            : t(`Tahap saat ini: ${t(workflowSteps[activeIndex].label)}`)
        }
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
              <span>{t(step.label)}</span>
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
  const { t } = useI18n();
  const targetRole = profile.targetRole.trim();
  const careerField = profile.careerField.trim();

  return (
    <section
      className="summary-foundation"
      aria-labelledby="career-foundation-title"
    >
      <div className="summary-foundation-heading">
        <SectionHeader
          title={t("Dasar karier")}
          titleId="career-foundation-title"
        />
        <h3 className="type-primary-title">
          {targetRole || t("Profil kariermu")}
        </h3>
        {careerField ? <p>{careerField}</p> : null}
      </div>

      <div className="summary-gap">
        <AlertCircle aria-hidden="true" size={18} strokeWidth={1.8} />
        <div>
          <strong>{t(gap.title)}</strong>
          <p>{t(gap.description)}</p>
          <ActionLink
            className="career-button primary summary-primary-action"
            href={gap.href}
          >
            {t(gap.linkLabel)}
            <CtaArrow />
          </ActionLink>
        </div>
      </div>
    </section>
  );
}

function FoundationContextLink({ gap }: { gap: FoundationGap }) {
  const { t } = useI18n();
  if (gap.href === "/profil-karier") return null;

  return (
    <nav
      className="summary-secondary summary-secondary-nav"
      aria-label={t("Konteks dasar karier")}
    >
      <ActionLink variant="text" href="/profil-karier">
        {t("Lihat profil karier")}
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
  const { t, language } = useI18n();
  if (!currentWork) {
    return (
      <section
        className="summary-secondary summary-secondary-copy"
        aria-labelledby="profile-reuse-title"
      >
        <SectionHeader
          title={t("Profilmu akan dipakai kembali")}
          titleId="profile-reuse-title"
          description={t(
            "Profil dan portfolio yang sudah kamu buat akan digunakan saat mencocokkan setiap lowongan.",
          )}
        />
      </section>
    );
  }

  if (!currentWork.isCompleted) {
    const hasMultipleJobs = jobs.length > 1;
    return (
      <nav
        className="summary-secondary summary-secondary-nav"
        aria-label={t("Akses lowongan")}
      >
        <ActionLink
          variant="text"
          href={
            hasMultipleJobs ? "/lowongan" : `/lowongan/${currentWork.job.id}`
          }
        >
          {hasMultipleJobs
            ? t("Lihat semua lowongan")
            : t("Lihat detail lowongan")}
          <CtaArrow />
        </ActionLink>
      </nav>
    );
  }

  if (jobs.length === 1) {
    return (
      <section
        className="summary-secondary summary-secondary-copy"
        aria-labelledby="next-job-title"
      >
        <SectionHeader
          title={t("Cek lowongan berikutnya")}
          titleId="next-job-title"
          description={t(
            "Profil dan portfolio yang sama bisa langsung dipakai untuk analisis lowongan lain.",
          )}
          action={
            <ActionLink
              className="career-button secondary"
              variant="secondary"
              href="/lowongan/baru"
            >
              {t("Tambah lowongan")}
              <CtaArrow />
            </ActionLink>
          }
        />
      </section>
    );
  }

  const recentJobs = jobs
    .filter((job) => job.id !== currentWork.job.id)
    .slice(0, 3);
  return (
    <section
      className="summary-secondary summary-latest-jobs"
      aria-labelledby="latest-jobs-title"
    >
      <SectionHeader
        title={t("Lowongan terbaru")}
        titleId="latest-jobs-title"
        action={
          <ActionLink variant="text" href="/lowongan">
            {t("Lihat semua lowongan")}
            <CtaArrow />
          </ActionLink>
        }
      />
      <ul>
        {recentJobs.map((job) => (
          <li key={job.id}>
            <Link href={`/lowongan/${job.id}`}>
              <span>
                <strong>{job.title}</strong>
                <small>{job.company}</small>
              </span>
              <small>{t(formatActivityDate(job.updatedAt, language))}</small>
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
  const analysis =
    data.recentAnalyses.find((item) => item.jobId === job.id) ?? null;

  if (requirements.length === 0) {
    return {
      job,
      activeStep: "detail",
      isCompleted: false,
      actionHref: jobBase,
      actionLabel: "Ambil persyaratan",
      description:
        "Deskripsi lowongan sudah tersimpan. Ambil persyaratannya untuk mulai membandingkan.",
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
      description:
        "Persyaratan sudah tersedia. Periksa hasilnya sebelum lanjut.",
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
    description:
      analysis?.summary ??
      "Semua persyaratan sudah ditinjau. Analisis siap dibuka.",
    analysis,
  };
}

function countPendingRequirementReviews(mapping: MappingSummary) {
  const requirementsMissingFromSummary = Math.max(
    mapping.totalMappableRequirements - mapping.requirements.length,
    0,
  );
  const requirementsNeedingReview = mapping.requirements.filter(
    (requirement) =>
      requirement.skills.length === 0 && !requirement.reviewedWithoutEvidence,
  ).length;
  return requirementsMissingFromSummary + requirementsNeedingReview;
}

function buildFoundationGap(data: DashboardData): FoundationGap | null {
  const hasCareerDirection = Boolean(
    data.profile?.targetRole.trim() && data.profile?.careerField.trim(),
  );

  if (!hasCareerDirection) {
    return {
      title: "Lengkapi arah kariermu",
      description:
        "Tambahkan target role dan bidang karier agar profilmu punya konteks yang jelas.",
      href: "/profil-karier",
      linkLabel: "Buka profil",
    };
  }

  if (data.skills.length === 0) {
    return {
      title: "Tambahkan skill utama",
      description:
        "Catat skill yang ingin kamu bandingkan dengan persyaratan lowongan.",
      href: "/profil-karier",
      linkLabel: "Tambah skill",
    };
  }

  if (data.evidences.length === 0) {
    return {
      title: "Skillmu belum punya pendukung",
      description:
        "Tambahkan project, pengalaman, sertifikat, portfolio, atau GitHub yang relevan.",
      href: "/portfolio-pengalaman",
      linkLabel: "Tambah portfolio",
    };
  }

  return null;
}

function DashboardErrorState({ error }: { error: string }) {
  const { t } = useI18n();
  return (
    <div className="career-profile-state error" role="alert">
      <AlertCircle aria-hidden="true" size={22} />
      <strong>{t(error)}</strong>
      <ActionButton
        size="compact"
        variant="secondary"
        type="button"
        onClick={() => window.location.reload()}
      >
        {t("Coba lagi")}
      </ActionButton>
    </div>
  );
}

function formatActivityDate(value: string, language = "id") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Aktivitas terbaru";
  return `Diperbarui ${new Intl.DateTimeFormat(
    language === "en" ? "en-GB" : "id-ID",
    {
      day: "numeric",
      month: "short",
    },
  ).format(date)}`;
}

function formatNumber(value: number, language = "id") {
  return new Intl.NumberFormat(language === "en" ? "en-GB" : "id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

type DashboardResponse = {
  data?: {
    profile: CareerProfile | null;
    skills: Skill[];
    evidences: Evidence[];
    jobs: Job[];
    jobContexts: Array<{
      jobId: string;
      requirements: Requirement[];
      mapping: MappingSummary;
    }>;
    recentAnalyses: RecentAnalysis[];
  };
  error?: { message?: string };
};

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}
