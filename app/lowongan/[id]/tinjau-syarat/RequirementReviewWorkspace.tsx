"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  LoaderCircle,
  Waypoints,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StableLink as Link } from "../../../components/StableLink";
import {
  RequirementReviewEditor,
  type Requirement,
  type RequirementPriority,
  type RequirementType,
} from "./RequirementReviewEditor";

type Job = {
  id: string;
  title: string;
  company: string;
  source: string | null;
};

type ApiRequirement = {
  id: string;
  name: string;
  type: "skill" | "tool" | "education" | "experience";
  priority: "required" | "preferred";
};

export function RequirementReviewWorkspace({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [jobResponse, requirementResponse] = await Promise.all([
          fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" }),
          fetch(`/api/jobs/${encodeURIComponent(jobId)}/requirements`, { cache: "no-store" }),
        ]);
        const [jobResult, requirementResult] = await Promise.all([
          readJobResponse(jobResponse),
          readRequirementsResponse(requirementResponse),
        ]);
        if (!jobResponse.ok || !jobResult.data?.job) {
          throw new Error(jobResult.error?.message ?? "Konteks lowongan belum dapat dimuat.");
        }
        if (!requirementResponse.ok || !requirementResult.data?.requirements) {
          throw new Error(requirementResult.error?.message ?? "Requirement belum dapat dimuat.");
        }

        const extractedDraft = readExtractionDraft(jobId);
        const initial = extractedDraft.length
          ? extractedDraft.map((requirement, index) => fromExtraction(requirement, index))
          : requirementResult.data.requirements.map(fromPersistedRequirement);
        if (active) {
          setJob(jobResult.data.job);
          setRequirements(initial);
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Review requirement belum dapat dimuat.");
      }
    }

    void load();
    return () => { active = false; };
  }, [jobId]);

  if (!job || !requirements) return <ReviewLoadState error={error} jobId={jobId} />;

  return (
    <div className="page-container requirement-review-page">
      <header className="requirement-review-header">
        <div>
          <Link href={`/lowongan/${job.id}`}>
            <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
            Kembali ke detail lowongan
          </Link>
          <p className="eyebrow">Tinjau syarat</p>
          <h1>Periksa requirement sebelum dianalisis</h1>
          <p>
            Hasil ekstraksi adalah draft. Pastikan setiap kalimat, prioritas, dan
            tipe requirement sesuai dengan konteks {job.title} di {job.company}.
          </p>
        </div>
      </header>

      <section className="requirement-review-overview" aria-labelledby="review-overview-title">
        <div>
          <span className="requirement-review-overview-icon" aria-hidden="true"><BookOpenCheck size={22} strokeWidth={1.8} /></span>
          <div>
            <p className="eyebrow">Konteks review</p>
            <h2 id="review-overview-title">Requirement menunggu konfirmasi</h2>
            <p>ApplyFit belum menggunakan perubahan draft untuk Fit Score sampai kamu menyimpan hasil review.</p>
          </div>
        </div>
        <dl>
          <div><dt>Role</dt><dd>{job.title}</dd></div>
          <div><dt>Perusahaan</dt><dd>{job.company}</dd></div>
          <div><dt>Sumber</dt><dd>{job.source ?? "Belum diisi"}</dd></div>
        </dl>
      </section>

      <RequirementReviewEditor jobId={job.id} initialRequirements={requirements} />

      <section className="requirement-review-next-step" aria-label="Langkah berikutnya">
        <span aria-hidden="true"><Waypoints size={19} strokeWidth={1.8} /></span>
        <div><strong>Lanjutkan ke pemetaan bukti</strong><p>Hubungkan requirement yang sudah direview dengan skill dan bukti profilmu.</p></div>
        <Link href={`/lowongan/${job.id}/pemetaan-bukti`}>Buka pemetaan <ArrowRight aria-hidden="true" size={15} strokeWidth={1.9} /></Link>
      </section>
    </div>
  );
}

function ReviewLoadState({ error, jobId }: { error: string; jobId: string }) {
  return (
    <div className="page-container requirement-review-page">
      <div className={`persisted-job-state ${error ? "error" : ""}`}>
        {error ? <AlertCircle aria-hidden="true" size={22} /> : <LoaderCircle className="spin" aria-hidden="true" size={22} />}
        <strong>{error || "Memuat requirement…"}</strong>
        {error ? <Link href={`/lowongan/${jobId}`}>Kembali ke detail lowongan</Link> : null}
      </div>
    </div>
  );
}

function fromPersistedRequirement(requirement: ApiRequirement): Requirement {
  return {
    id: requirement.id,
    persistedId: requirement.id,
    text: requirement.name,
    type: typeLabels[requirement.type],
    priority: priorityLabels[requirement.priority],
    reviewed: true,
  };
}

function fromExtraction(requirement: Omit<ApiRequirement, "id">, index: number): Requirement {
  return {
    id: `extracted-${index}`,
    text: requirement.name,
    type: typeLabels[requirement.type],
    priority: priorityLabels[requirement.priority],
    reviewed: false,
  };
}

function readExtractionDraft(jobId: string): Array<Omit<ApiRequirement, "id">> {
  try {
    const value = window.sessionStorage.getItem(`applyfit:extracted-requirements:${jobId}`);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isExtractionRequirement);
  } catch {
    return [];
  }
}

function isExtractionRequirement(value: unknown): value is Omit<ApiRequirement, "id"> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.name === "string" && candidate.name.trim() !== "" &&
    ["skill", "tool", "education", "experience"].includes(String(candidate.type)) &&
    ["required", "preferred"].includes(String(candidate.priority));
}

const typeLabels: Record<ApiRequirement["type"], RequirementType> = {
  skill: "Skill",
  tool: "Tool",
  education: "Pendidikan",
  experience: "Pengalaman",
};

const priorityLabels: Record<ApiRequirement["priority"], RequirementPriority> = {
  required: "Wajib",
  preferred: "Preferensi",
};

type JobResponse = { data?: { job?: Job }; error?: { message?: string } };
type RequirementsResponse = { data?: { requirements?: ApiRequirement[] }; error?: { message?: string } };

async function readJobResponse(response: Response): Promise<JobResponse> {
  try { return await response.json() as JobResponse; } catch { return {}; }
}

async function readRequirementsResponse(response: Response): Promise<RequirementsResponse> {
  try { return await response.json() as RequirementsResponse; } catch { return {}; }
}
