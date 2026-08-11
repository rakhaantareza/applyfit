"use client";

import { AlertCircle, BriefcaseBusiness, Plus } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { StableLink as Link } from "./StableLink";
import {
  AnalyzedJobContext,
  JobAnalysisProvider,
  JobSwitcher,
  type JobAnalysisJob,
} from "./JobScorePicker";
import { RequirementList } from "./RequirementList";
import type { Requirement, RequirementStatus } from "../types/fit-analysis";

type SavedJob = {
  id: string;
  title: string;
  company: string;
  source: string | null;
  location: string | null;
  workArrangement: string | null;
};

type Evidence = {
  id: string;
  title: string;
  type: "project" | "cert" | "work" | "internship" | "github" | "portfolio";
  url: string | null;
};

type MappingSkill = {
  id: string;
  status: "active" | "learning";
  evidences: Evidence[];
};

type MappingRequirement = {
  id: string;
  name: string;
  type: "skill" | "tool";
  priority: "required" | "preferred";
  skills: MappingSkill[];
};

type InformationalRequirement = {
  id: string;
  name: string;
  type: "education" | "experience";
  priority: "required" | "preferred";
};

type FitSummary = {
  score: number;
  currentPoints: number;
  maximumPoints: number;
  totalRequirements: number;
  includedRequirements: number;
  excludedRequirements: number;
  statusCounts: Record<"proven" | "partial" | "learning" | "missing", number>;
};

type ApiRequirementDetail = {
  id: string;
  name: string;
  type: "skill" | "tool" | "education" | "experience";
  priority: "required" | "preferred";
  status: "proven" | "partial" | "learning" | "missing" | null;
  isInformational: boolean;
  evidences: Evidence[];
  points: { weight: number; multiplier: number; earned: number; maximum: number } | null;
};

type Analysis = { summary: FitSummary; requirements: Requirement[] };

export function FitScoreWorkspace() {
  const [jobs, setJobs] = useState<JobAnalysisJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadJobs() {
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });
        const result = await readJson<JobsResponse>(response);
        if (!response.ok || !result.data?.jobs) throw new Error(result.error?.message ?? "Lowongan belum dapat dimuat.");
        const analysisJobs = result.data.jobs.map(toAnalysisJob);
        const queryJobId = new URLSearchParams(window.location.search).get("job");
        const initialId = analysisJobs.some((job) => job.id === queryJobId) ? queryJobId! : analysisJobs[0]?.id ?? "";
        if (active) { setJobs(analysisJobs); setSelectedJobId(initialId); }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Lowongan belum dapat dimuat.");
      } finally {
        if (active) setLoadingJobs(false);
      }
    }
    void loadJobs();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    let active = true;

    async function loadAnalysis() {
      setLoadingAnalysis(true);
      setAnalysis(null);
      setError("");
      try {
        const mappingResponse = await fetch(`/api/jobs/${encodeURIComponent(selectedJobId)}/requirements/mapping-summary`, { cache: "no-store" });
        const mappingResult = await readJson<MappingResponse>(mappingResponse);
        if (!mappingResponse.ok || !mappingResult.data) throw new Error(mappingResult.error?.message ?? "Dasar Fit Score belum dapat dimuat.");
        const payloadRequirements = buildPayloadRequirements(mappingResult.data.requirements, mappingResult.data.informationalRequirements);
        const [summaryResponse, detailsResponse] = await Promise.all([
          fetch("/api/fit-score/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: selectedJobId, requirements: payloadRequirements.summary }) }),
          fetch("/api/fit-score/requirements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId: selectedJobId, requirements: payloadRequirements.details }) }),
        ]);
        const [summaryResult, detailsResult] = await Promise.all([
          readJson<FitSummaryResponse>(summaryResponse),
          readJson<FitDetailsResponse>(detailsResponse),
        ]);
        if (!summaryResponse.ok || !summaryResult.data) throw new Error(summaryResult.error?.message ?? "Fit Score belum dapat dihitung.");
        if (!detailsResponse.ok || !detailsResult.data?.requirements) throw new Error(detailsResult.error?.message ?? "Detail requirement belum dapat dihitung.");
        if (active) setAnalysis({ summary: summaryResult.data, requirements: detailsResult.data.requirements.map(toRequirement) });
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Fit Score belum dapat dimuat.");
      } finally {
        if (active) setLoadingAnalysis(false);
      }
    }
    void loadAnalysis();
    return () => { active = false; };
  }, [selectedJobId]);

  function selectJob(jobId: string) {
    setSelectedJobId(jobId);
    const url = new URL(window.location.href);
    url.searchParams.set("job", jobId);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  if (loadingJobs) return <FitScorePageFrame />;
  if (error && !jobs.length) return <FitScoreErrorState error={error} />;
  if (!jobs.length) return <EmptyJobsState />;

  return (
    <JobAnalysisProvider jobs={jobs} selectedJobId={selectedJobId} onSelectJob={selectJob}>
      <div className="page-container">
        <header className="topbar">
          <div><p className="eyebrow">Analisis kesiapan sebelum melamar</p><h1>Skor Kecocokan</h1><p className="header-copy">Pahami posisi profilmu terhadap requirement lowongan yang sedang dianalisis.</p></div>
          <JobSwitcher />
        </header>
        {loadingAnalysis ? null : error || !analysis ? <FitScoreErrorState error={error || "Fit Score belum dapat dimuat."} compact /> : <FitScoreContent analysis={analysis} />}
      </div>
    </JobAnalysisProvider>
  );
}

function FitScoreContent({ analysis }: { analysis: Analysis }) {
  const { summary, requirements } = analysis;
  const evidenceCount = new Set(requirements.flatMap((requirement) => requirement.evidence.map((evidence) => `${evidence.type}:${evidence.title}`))).size;
  const statusSummary = [
    { label: "Proven", value: summary.statusCounts.proven, className: "proven" },
    { label: "Partial", value: summary.statusCounts.partial, className: "partial" },
    { label: "Learning", value: summary.statusCounts.learning, className: "learning" },
    { label: "Missing", value: summary.statusCounts.missing, className: "missing" },
    { label: "Di luar skor", value: summary.excludedRequirements, className: "informational" },
  ].filter((item) => item.value > 0);
  const attentionAreas = requirements.filter((requirement) => requirement.score && requirement.status !== "Proven");
  const practicalSummary = buildPracticalSummary(summary);

  return (
    <>
      <section className="fit-story" aria-labelledby="score-title">
        <article className="score-card">
          <AnalyzedJobContext />
          <div className="score-main">
            <div className="score-visual">
              <div className="score-ring" role="img" aria-label={`Skor kecocokan ${formatNumber(summary.score)} persen`} style={{ "--score-angle": `${summary.score * 3.6}deg` } as CSSProperties}><div><strong>{formatNumber(summary.score)}</strong><span>%</span></div></div>
              <span className="score-visual-label">Fit Score saat ini</span>
            </div>
            <div className="score-copy">
              <span className="fit-label">Kesiapan berbasis bukti</span>
              <h2 id="score-title">Analisis kesiapanmu untuk role ini</h2>
              <p className="readiness-intro">{practicalSummary}</p>
              <div className="score-meta">
                <span><small>Requirement dihitung</small><strong>{summary.includedRequirements} Skill &amp; Tool</strong></span>
                <span><small>Bukti terhubung</small><strong>{evidenceCount} bukti</strong></span>
                <span><small>Data analisis</small><strong>Terbaru dari profilmu</strong></span>
              </div>
            </div>
          </div>
        </article>
        <div className="status-summary" aria-label="Ringkasan status requirement">
          <div className="status-summary-heading"><div><p className="eyebrow">Ringkasan status</p><h2>{summary.totalRequirements} requirement lowongan</h2></div><p>{summary.excludedRequirements} requirement pengalaman atau pendidikan tetap terlihat sebagai konteks dan tidak masuk skor MVP.</p></div>
          <div className="status-list">{statusSummary.map((item) => <div className="status-item" key={item.label}><span className={`status-dot ${item.className}`} /><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
          <div className="status-bar" aria-hidden="true">{statusSummary.map((item) => <span className={item.className} key={item.label} />)}</div>
        </div>
      </section>

      <section className="attention-section" aria-labelledby="attention-title">
        <div className="attention-heading"><div><p className="eyebrow">Perlu perhatian</p><h2 id="attention-title">{attentionAreas.length ? `${attentionAreas.length} area belum sepenuhnya terbukti` : "Semua area yang dinilai sudah memiliki bukti"}</h2></div><p>Status ini menjelaskan celah bukti dan tahap skill saat ini, bukan rekomendasi untuk melamar atau tidak.</p></div>
        {attentionAreas.length ? <div className="attention-list">{attentionAreas.map((item) => <article className="attention-item" key={item.name}><span className={`status-dot ${item.status.toLocaleLowerCase("id-ID")}`} aria-hidden="true" /><div><span className={`status-badge ${item.status.toLocaleLowerCase("id-ID")}`}>{item.status}</span><h3>{item.name}</h3><p>{item.note}</p></div></article>)}</div> : null}
      </section>

      <section className="requirements-panel" aria-labelledby="requirements-title">
        <div className="section-heading requirements-heading"><div><p className="eyebrow">Detail requirement</p><h2 id="requirements-title">Lihat dasar perhitungan satu per satu</h2></div><p>Setiap status berasal dari skill dan bukti yang sudah terhubung ke profilmu.</p></div>
        <RequirementList requirements={requirements} />
      </section>

      <details className="scoring-disclosure">
        <summary><span><span className="eyebrow">Transparansi skor</span><strong>Bagaimana Fit Score dihitung?</strong><small>Lihat formula, bobot, dan contoh perhitungan.</small></span><span className="disclosure-icon" aria-hidden="true">+</span></summary>
        <div className="scoring-content">
          <div><h2>Aturannya tetap dan dapat ditelusuri</h2><p>Setiap poin berasal dari bobot prioritas dan multiplier status requirement.</p></div>
          <div className="formula-card"><div><span>Poin saat ini</span><strong>{formatNumber(summary.currentPoints)}</strong></div><span className="formula-symbol">÷</span><div><span>Poin maksimum</span><strong>{formatNumber(summary.maximumPoints)}</strong></div><span className="formula-symbol">×</span><strong>100</strong></div>
          <div className="weights"><div><span className="weight-mark required">3</span><span><strong>Requirement wajib</strong><small>Bobot 3 poin</small></span></div><div><span className="weight-mark preferred">1</span><span><strong>Requirement preferensi</strong><small>Bobot 1 poin</small></span></div></div>
          <Link className="text-button" href="/contoh-perhitungan" aria-label="Lihat contoh perhitungan skor lengkap">Lihat contoh perhitungan <span aria-hidden="true">→</span></Link>
        </div>
      </details>
    </>
  );
}

function FitScorePageFrame() {
  return (
    <div className="page-container">
      <header className="topbar">
        <div><p className="eyebrow">Analisis kesiapan sebelum melamar</p><h1>Skor Kecocokan</h1><p className="header-copy">Pahami posisi profilmu terhadap requirement lowongan yang sedang dianalisis.</p></div>
      </header>
    </div>
  );
}

function FitScoreErrorState({ error, compact = false }: { error: string; compact?: boolean }) {
  return <div className={`persisted-job-state error${compact ? " compact" : ""}`}><AlertCircle aria-hidden="true" size={22} /><strong>{error}</strong><button type="button" onClick={() => window.location.reload()}>Coba lagi</button></div>;
}

function EmptyJobsState() {
  return (
    <div className="page-container">
      <header className="topbar">
        <div>
          <p className="eyebrow">Analisis kesiapan sebelum melamar</p>
          <h1>Skor Kecocokan</h1>
          <p className="header-copy">Pahami posisi profilmu terhadap requirement lowongan tertentu.</p>
        </div>
      </header>
      <section className="page-empty-state fit-score-empty" aria-labelledby="fit-score-empty-title">
        <span className="page-empty-state-icon" aria-hidden="true">
          <BriefcaseBusiness size={25} strokeWidth={1.7} />
        </span>
        <h2 id="fit-score-empty-title">Belum ada lowongan untuk dianalisis</h2>
        <p>Simpan satu lowongan terlebih dahulu untuk mulai melihat kesiapan profilmu.</p>
        <Link className="career-button primary" href="/lowongan/baru">
          <Plus aria-hidden="true" size={16} strokeWidth={2} />
          Tambah lowongan
        </Link>
      </section>
    </div>
  );
}

function buildPracticalSummary(summary: FitSummary) {
  const parts = [
    `${summary.statusCounts.proven} requirement Proven`,
    `${summary.statusCounts.partial} Partial karena bukti pendukung belum terhubung`,
    `${summary.statusCounts.learning} masih Learning`,
    `${summary.statusCounts.missing} belum memiliki skill yang dipetakan`,
  ];
  return `${parts.join(", ")}. ${summary.excludedRequirements} requirement pengalaman atau pendidikan berada di luar skor MVP.`;
}

function buildPayloadRequirements(requirements: MappingRequirement[], informational: InformationalRequirement[]) {
  const mapped = requirements.map((requirement) => ({
    id: requirement.id,
    name: requirement.name,
    type: requirement.type,
    priority: requirement.priority,
    mappings: requirement.skills.map((skill) => ({ skill: { id: skill.id, status: skill.status }, evidences: skill.evidences })),
  }));
  const contextual = informational.map((requirement) => ({ id: requirement.id, name: requirement.name, type: requirement.type, priority: requirement.priority, mappings: [] as Array<never> }));
  const details = [...mapped, ...contextual];
  return {
    details,
    summary: details.map((requirement) => ({
      id: requirement.id,
      type: requirement.type,
      priority: requirement.priority,
      mappings: requirement.mappings.map((mapping) => ({ skill: mapping.skill, linkedEvidenceIds: mapping.evidences.map((evidence) => evidence.id) })),
    })),
  };
}

function toRequirement(requirement: ApiRequirementDetail): Requirement {
  const status = requirement.status ? statusLabels[requirement.status] : "Missing";
  return {
    name: requirement.name,
    kind: kindLabels[requirement.type],
    priority: requirement.priority === "required" ? "Wajib" : "Preferensi",
    status,
    note: requirement.isInformational ? "Disimpan sebagai konteks dan tidak dihitung dalam Fit Score MVP." : statusNotes[status](requirement.evidences.length),
    evidence: requirement.evidences.map((evidence) => ({ title: evidence.title, type: evidenceTypeLabels[evidence.type] })),
    score: requirement.points,
  };
}

function toAnalysisJob(job: SavedJob): JobAnalysisJob {
  return { id: job.id, title: job.title, company: job.company, initials: getInitials(job.company), source: job.source, location: job.location, arrangement: job.workArrangement };
}

function getInitials(company: string) { return company.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toLocaleUpperCase("id-ID")).join("") || "AF"; }
function formatNumber(value: number) { return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value); }

const statusLabels = { proven: "Proven", partial: "Partial", learning: "Learning", missing: "Missing" } as const;
const kindLabels = { skill: "Skill", tool: "Tool", education: "Education", experience: "Experience" } as const;
const evidenceTypeLabels = { project: "Proyek", cert: "Sertifikat", work: "Pengalaman", internship: "Pengalaman", github: "Portofolio", portfolio: "Portofolio" } as const;
const statusNotes: Record<RequirementStatus, (count: number) => string> = {
  Proven: (count) => `Dibuktikan oleh ${count} bukti terhubung`,
  Partial: () => "Skill aktif sudah dipetakan, tetapi bukti pendukung belum terhubung.",
  Learning: () => "Skill yang dipetakan masih berstatus dipelajari.",
  Missing: () => "Belum ada skill yang dipetakan ke requirement ini.",
};

type JobsResponse = { data?: { jobs?: SavedJob[] }; error?: { message?: string } };
type MappingResponse = { data?: { requirements: MappingRequirement[]; informationalRequirements: InformationalRequirement[] }; error?: { message?: string } };
type FitSummaryResponse = { data?: FitSummary; error?: { message?: string } };
type FitDetailsResponse = { data?: { requirements?: ApiRequirementDetail[] }; error?: { message?: string } };

async function readJson<T>(response: Response): Promise<T> { try { return await response.json() as T; } catch { return {} as T; } }
