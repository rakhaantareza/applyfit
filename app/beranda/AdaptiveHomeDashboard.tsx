"use client";

import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Gauge,
  LibraryBig,
  Link2,
  ListChecks,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StableLink as Link } from "../components/StableLink";
import { getAuthDisplayName, useAuthSession } from "../components/AuthSessionProvider";

type JourneyStep = { title: string; description: string; href: string; icon: LucideIcon };

type CareerProfile = { targetRole: string; careerField: string };
type Skill = { id: string; name: string; status: "active" | "learning" };
type Evidence = { id: string };
type Job = { id: string; title: string; company: string; updatedAt: string };
type Requirement = { id: string; type: "skill" | "tool" | "education" | "experience"; priority: "required" | "preferred" };
type MappingSummary = {
  requirements: Array<Requirement & { skills: Array<{ id: string; status: "active" | "learning"; evidences: Array<{ id: string }> }> }>;
  informationalRequirements: Requirement[];
  mappedCount: number;
  totalMappableRequirements: number;
};
type RecentAnalysis = {
  jobId: string;
  role: string;
  company: string;
  score: number;
  updatedAt: string;
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

const dashboardDataCache = new Map<string, DashboardData>();

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
        const failedMessage = profileResult.error?.message ?? skillsResult.error?.message ?? evidencesResult.error?.message ?? jobsResult.error?.message;
        if (![profileResponse, skillsResponse, evidencesResponse, jobsResponse].every((response) => response.ok)) {
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
            requirements: requirementsResponse.ok ? requirementsResult.data?.requirements ?? [] : [],
            mapping: mappingResponse.ok ? mappingResult.data ?? null : null,
          };
        }));

        const analysisCandidates = jobContexts.filter(
          (context) =>
            context.mapping &&
            context.mapping.totalMappableRequirements > 0 &&
            context.mapping.mappedCount === context.mapping.totalMappableRequirements,
        ).slice(0, 2);
        const recentAnalyses = (await Promise.all(analysisCandidates.map(calculateRecentAnalysis))).filter((analysis): analysis is RecentAnalysis => analysis !== null);
        if (!active) return;
        const nextData: DashboardData = {
          profile: profileResult.data?.profile ?? null,
          skills: skillsResult.data?.skills ?? [],
          evidences: evidencesResult.data?.evidences ?? [],
          jobs,
          requirementsByJob: new Map(jobContexts.map(({ job, requirements }) => [job.id, requirements])),
          mappingsByJob: new Map(jobContexts.flatMap(({ job, mapping }) => mapping ? [[job.id, mapping] as const] : [])),
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
  if (!data || !dashboard) return error ? <DashboardErrorState error={error} /> : null;

  const firstName = accountName.split(/\s+/)[0] ?? accountName;
  const onboarding = <OnboardingJourney completedSteps={dashboard.completedSteps} compact={!dashboard.isNewUser} steps={dashboard.steps} />;

  return (
    <>
      <header className="home-header">
        <div>
          <p className="eyebrow">Ringkasan kesiapan</p>
          <h1>{dashboard.isNewUser ? `Selamat datang, ${firstName}` : `Halo, ${firstName}`}</h1>
          <p>{dashboard.isNewUser ? "Bangun konteks kariermu langkah demi langkah sebelum membaca kecocokan untuk sebuah lowongan." : "Lanjutkan pekerjaan yang belum lengkap atau buka kembali analisis kesiapan untuk lowongan tertentu."}</p>
        </div>
        <span className="home-context-badge"><BadgeCheck aria-hidden="true" size={15} strokeWidth={1.9} />{dashboard.isNewUser ? "Ruang kerja baru" : "Data akun terhubung"}</span>
      </header>

      {dashboard.isNewUser ? onboarding : null}

      <section className="home-stats" aria-labelledby="home-stats-title">
        <div className="home-stats-heading"><p className="eyebrow">Profil singkat</p><h2 id="home-stats-title">Dasar analisis saat ini</h2></div>
        <dl>{dashboard.profileStats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>
      </section>

      <RecentAnalysisSection analyses={data.recentAnalyses} />

      {!dashboard.isNewUser ? <div className="home-support-row"><AttentionSection items={dashboard.attentionItems} />{onboarding}</div> : null}
    </>
  );
}

function buildDashboardState(data: DashboardData) {
  const primaryJob = data.jobs[0];
  const primaryRequirements = primaryJob ? data.requirementsByJob.get(primaryJob.id) ?? [] : [];
  const primaryMapping = primaryJob ? data.mappingsByJob.get(primaryJob.id) : undefined;
  const profileComplete = Boolean(data.profile?.targetRole.trim() && data.profile?.careerField.trim());
  const skillsAndEvidenceComplete = data.skills.length > 0 && data.evidences.length > 0;
  const hasJob = data.jobs.length > 0;
  const hasRequirements = primaryRequirements.length > 0;
  const mappingComplete = Boolean(primaryMapping && primaryMapping.totalMappableRequirements > 0 && primaryMapping.mappedCount === primaryMapping.totalMappableRequirements);
  const hasAnalysis = mappingComplete;
  const completion = [profileComplete, skillsAndEvidenceComplete, hasJob, hasRequirements, mappingComplete, hasAnalysis];
  const firstIncomplete = completion.findIndex((complete) => !complete);
  const completedSteps = firstIncomplete === -1 ? completion.length : firstIncomplete;
  const profileCompleteness = Math.round(([Boolean(data.profile?.targetRole.trim()), Boolean(data.profile?.careerField.trim()), data.skills.length > 0, data.evidences.length > 0].filter(Boolean).length / 4) * 100);
  const jobBase = primaryJob ? `/lowongan/${primaryJob.id}` : "/lowongan";
  const steps: JourneyStep[] = [
    { title: "Profil karier", description: "Tentukan target role dan bidang karier.", href: "/profil-karier", icon: UserRound },
    { title: "Skill & bukti", description: "Catat skill dan tautkan bukti yang relevan.", href: data.skills.length ? "/pustaka-bukti" : "/profil-karier", icon: LibraryBig },
    { title: "Lowongan tersimpan", description: "Simpan konteks pekerjaan yang ingin dianalisis.", href: hasJob ? jobBase : "/lowongan/baru", icon: BriefcaseBusiness },
    { title: "Tinjau requirement", description: "Periksa hasil ekstraksi sebelum digunakan.", href: hasJob ? `${jobBase}/tinjau-syarat` : "/lowongan", icon: ListChecks },
    { title: "Pemetaan", description: "Hubungkan requirement dengan skill dan bukti.", href: hasJob ? `${jobBase}/pemetaan-bukti` : "/lowongan", icon: Link2 },
    { title: "Analisis kecocokan", description: "Baca skor dan dasar perhitungannya.", href: hasJob ? `/?job=${primaryJob.id}` : "/", icon: Gauge },
  ];
  const attentionItems: AttentionItem[] = [];
  if (!profileComplete) attentionItems.push({ title: "Arah karier belum lengkap", description: "Target role dan bidang karier membantu menjaga konteks analisis tetap spesifik.", href: "/profil-karier", linkLabel: "Lengkapi profil" });
  if (data.skills.length > 0 && data.evidences.length === 0) attentionItems.push({ title: "Skill belum memiliki bukti", description: "Tambahkan bukti yang dapat ditautkan ke skill aktif atau yang sedang dipelajari.", href: "/pustaka-bukti", linkLabel: "Tambah bukti" });
  if (hasJob && !hasRequirements) attentionItems.push({ title: "Requirement lowongan belum ditinjau", description: "Ekstrak dan periksa requirement sebelum melakukan pemetaan.", href: `${jobBase}/tinjau-syarat`, linkLabel: "Tinjau requirement" });
  if (hasRequirements && !mappingComplete) attentionItems.push({ title: "Pemetaan requirement belum lengkap", description: "Hubungkan requirement Skill dan Tool dengan skill serta bukti profilmu.", href: `${jobBase}/pemetaan-bukti`, linkLabel: "Lanjutkan pemetaan" });
  return {
    isNewUser: completedSteps === 0,
    completedSteps,
    steps,
    profileStats: [
      { value: `${profileCompleteness}%`, label: "Profil lengkap" },
      { value: String(data.skills.length), label: "Skill tercatat" },
      { value: String(data.evidences.length), label: "Bukti tersimpan" },
      { value: String(data.jobs.length), label: "Lowongan tersimpan" },
    ],
    attentionItems,
  };
}

function OnboardingJourney({ completedSteps, compact, steps }: { completedSteps: number; compact: boolean; steps: JourneyStep[] }) {
  const currentIndex = Math.min(completedSteps, steps.length - 1);
  const currentStep = steps[currentIndex];
  const CurrentIcon = currentStep.icon;
  return (
    <section className={`home-onboarding${compact ? " compact" : " primary"}`} aria-labelledby={compact ? "compact-journey-title" : "journey-title"}>
      <div className="home-section-heading"><div><p className="eyebrow">Alur kesiapan</p><h2 id={compact ? "compact-journey-title" : "journey-title"}>{compact ? "Lanjutkan alur lowongan aktif" : "Mulai dari dasar yang dapat ditelusuri"}</h2><p>{compact ? `${completedSteps} dari ${steps.length} tahap selesai untuk lowongan yang sedang dikerjakan.` : "Setiap tahap menyiapkan konteks untuk tahap berikutnya; tidak ada skor sebelum requirement ditinjau dan dipetakan."}</p></div></div>
      <ol className="home-journey-steps" aria-label={`${completedSteps} dari ${steps.length} tahap selesai`}>
        {steps.map((step, index) => { const isComplete = index < completedSteps; const isCurrent = index === currentIndex; const Icon = step.icon; return <li className={`${isComplete ? "complete" : ""}${isCurrent ? " current" : ""}`} key={step.title}><span className="home-step-marker" aria-hidden="true">{isComplete ? <Check size={14} strokeWidth={2.5} /> : <Icon size={15} strokeWidth={1.9} />}</span><span className="home-step-copy"><strong>{step.title}</strong>{!compact ? <small>{step.description}</small> : null}</span></li>; })}
      </ol>
      <div className="home-next-action"><span aria-hidden="true"><CurrentIcon size={21} strokeWidth={1.8} /></span><div><small>Langkah berikutnya</small><strong>{currentStep.title}</strong><p>{currentStep.description}</p></div><Link href={currentStep.href}>{completedSteps === 0 ? "Lengkapi sekarang" : "Lanjutkan tahap"}<ArrowRight aria-hidden="true" size={16} strokeWidth={1.9} /></Link></div>
    </section>
  );
}

function RecentAnalysisSection({ analyses }: { analyses: RecentAnalysis[] }) {
  const empty = analyses.length === 0;
  return (
    <section className="home-recent" aria-labelledby="recent-analysis-title">
      <div className="home-section-heading"><div><p className="eyebrow">Analisis terkini</p><h2 id="recent-analysis-title">Kesiapan untuk lowongan tertentu</h2><p>Setiap skor dihitung dari role, perusahaan, requirement, skill, dan bukti yang terhubung saat ini.</p></div>{!empty ? <Link className="home-heading-link" href={`/?job=${analyses[0].jobId}`}>Buka Fit Score <ArrowRight size={15} /></Link> : null}</div>
      {empty ? (
        <div className="home-recent-empty"><span aria-hidden="true"><FileCheck2 size={23} strokeWidth={1.8} /></span><div><h3>Belum ada analisis kecocokan</h3><p>Simpan satu lowongan, tinjau requirement, lalu petakan skill dan bukti sebelum skor dihitung.</p></div><Link href="/lowongan">Simpan lowongan<ArrowRight aria-hidden="true" size={16} strokeWidth={1.9} /></Link></div>
      ) : (
        <div className="home-analysis-list">{analyses.map((analysis) => <article className="home-analysis-row" key={analysis.jobId}><span className="home-analysis-icon" aria-hidden="true"><Gauge size={19} strokeWidth={1.8} /></span><div className="home-analysis-copy"><h3>{analysis.role}</h3><p>{analysis.company}</p><small>{analysis.summary}</small></div><div className="home-analysis-time"><Clock3 aria-hidden="true" size={13} strokeWidth={1.8} />{analysis.updatedAt}</div><div className="home-analysis-score"><strong>{formatNumber(analysis.score)}%</strong><span>Fit Score</span></div><Link href={`/?job=${analysis.jobId}`} aria-label={`Buka analisis ${analysis.role} di ${analysis.company}`}><ArrowRight aria-hidden="true" size={17} strokeWidth={1.9} /></Link></article>)}</div>
      )}
    </section>
  );
}

type AttentionItem = { title: string; description: string; href: string; linkLabel: string };
function AttentionSection({ items }: { items: AttentionItem[] }) {
  return (
    <section className="home-attention" aria-labelledby="home-attention-title">
      <div className="home-section-heading"><div><p className="eyebrow">Perlu dilengkapi</p><h2 id="home-attention-title">Konteks profil dan bukti</h2><p>Bagian ini menunjukkan data yang belum lengkap, bukan rekomendasi untuk melamar.</p></div></div>
      <div className="home-attention-list">{items.length ? items.map((item) => <article key={item.title}><span aria-hidden="true"><ClipboardCheck size={17} strokeWidth={1.8} /></span><div><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.linkLabel} <ArrowRight size={14} /></Link></div></article>) : <article><span aria-hidden="true"><BadgeCheck size={17} strokeWidth={1.8} /></span><div><h3>Konteks utama sudah lengkap</h3><p>Profil, lowongan, dan pemetaan utama telah tersedia untuk analisis.</p></div></article>}</div>
    </section>
  );
}

function DashboardErrorState({ error }: { error: string }) {
  return <div className="career-profile-state error" role="alert"><AlertCircle aria-hidden="true" size={22} /><strong>{error}</strong><button type="button" onClick={() => window.location.reload()}>Coba lagi</button></div>;
}

async function calculateRecentAnalysis(context: { job: Job; requirements: Requirement[]; mapping: MappingSummary | null }): Promise<RecentAnalysis | null> {
  if (!context.mapping) return null;
  const mappingById = new Map(context.mapping.requirements.map((requirement) => [requirement.id, requirement]));
  const payload = context.requirements.map((requirement) => {
    const mapping = mappingById.get(requirement.id);
    return { id: requirement.id, type: requirement.type, priority: requirement.priority, mappings: mapping?.skills.map((skill) => ({ skill: { id: skill.id, status: skill.status }, linkedEvidenceIds: skill.evidences.map((evidence) => evidence.id) })) ?? [] };
  });
  const response = await fetch("/api/fit-score/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: context.job.id, requirements: payload }) });
  const result = await readJson<FitScoreResponse>(response);
  if (!response.ok || !result.data) return null;
  const counts = result.data.statusCounts;
  return {
    jobId: context.job.id,
    role: context.job.title,
    company: context.job.company,
    score: result.data.score,
    updatedAt: `Data ${formatDate(context.job.updatedAt)}`,
    summary: `${counts.proven} Proven · ${counts.partial} Partial · ${counts.learning} Learning · ${counts.missing} Missing · ${result.data.excludedRequirements} di luar skor`,
  };
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "terbaru" : `diperbarui ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date)}`; }
function formatNumber(value: number) { return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value); }

type ProfileResponse = { data?: { profile?: CareerProfile | null }; error?: { message?: string } };
type SkillsResponse = { data?: { skills?: Skill[] }; error?: { message?: string } };
type EvidencesResponse = { data?: { evidences?: Evidence[] }; error?: { message?: string } };
type JobsResponse = { data?: { jobs?: Job[] }; error?: { message?: string } };
type RequirementsResponse = { data?: { requirements?: Requirement[] }; error?: { message?: string } };
type MappingResponse = { data?: MappingSummary; error?: { message?: string } };
type FitScoreResponse = { data?: { score: number; excludedRequirements: number; statusCounts: Record<"proven" | "partial" | "learning" | "missing", number> } };

async function readJson<T>(response: Response): Promise<T> { try { return await response.json() as T; } catch { return {} as T; } }
