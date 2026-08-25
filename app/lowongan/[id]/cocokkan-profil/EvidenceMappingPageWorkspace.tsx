"use client";

import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  ChevronDown,
  Info,
  Laptop,
  LibraryBig,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { JobFocusShell } from "../../../components/JobFocusShell";
import { StableLink as Link } from "../../../components/StableLink";
import { EvidenceMappingWorkspace } from "./EvidenceMappingWorkspace";
import type { MappingSkill } from "./ManualEvidenceMappingForm";

type Job = {
  id: string;
  title: string;
  company: string;
  source: string | null;
  location: string | null;
  workArrangement: string | null;
};

type ApiSkill = {
  id: string;
  name: string;
  status: "active" | "learning";
};

type ApiEvidence = { id: string; title: string };

type SummaryRequirement = {
  id: string;
  name: string;
  type: "skill" | "tool";
  priority: "required" | "preferred";
  reviewedWithoutEvidence: boolean;
  skills: Array<{ id: string }>;
};

type InformationalRequirement = {
  id: string;
  name: string;
  type: "education" | "experience";
};

type ExactMatch = {
  requirementId: string;
  requirementName: string;
  skillName: string;
};

type MappingData = {
  skills: MappingSkill[];
  requirements: Array<{
    id: string;
    text: string;
    priority: "Wajib" | "Preferensi";
    reviewedWithoutEvidence: boolean;
    skillIds: string[];
    autoMatchReason: string | null;
  }>;
  informationalRequirements: InformationalRequirement[];
};

export function EvidenceMappingPageWorkspace({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [mapping, setMapping] = useState<MappingData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [jobResponse, skillsResponse] = await Promise.all([
          fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" }),
          fetch("/api/career-profile/skills", { cache: "no-store" }),
        ]);
        const [jobResult, skillsResult] = await Promise.all([
          readJson<JobResponse>(jobResponse),
          readJson<SkillsResponse>(skillsResponse),
        ]);
        if (!jobResponse.ok || !jobResult.data?.job) {
          throw new Error(jobResult.error?.message ?? "Konteks lowongan belum dapat dimuat.");
        }
        if (!skillsResponse.ok || !skillsResult.data?.skills) {
          throw new Error(skillsResult.error?.message ?? "Skill profil belum dapat dimuat.");
        }

        const autoMatchResponse = await fetch(
          `/api/jobs/${encodeURIComponent(jobId)}/requirements/auto-match`,
          { method: "POST" },
        );
        const autoMatchResult = await readJson<AutoMatchResponse>(autoMatchResponse);
        const exactMatches = autoMatchResponse.ok ? autoMatchResult.data?.matches ?? [] : [];

        const summaryResponse = await fetch(
          `/api/jobs/${encodeURIComponent(jobId)}/requirements/mapping-summary`,
          { cache: "no-store" },
        );
        const summaryResult = await readJson<SummaryResponse>(summaryResponse);
        if (!summaryResponse.ok || !summaryResult.data) {
          throw new Error(summaryResult.error?.message ?? "Cocokkan Profil belum dapat dimuat.");
        }

        const apiSkills = skillsResult.data.skills;
        const skillEvidences = await Promise.all(
          apiSkills.map(async (skill) => {
            const response = await fetch(`/api/evidences?skillId=${encodeURIComponent(skill.id)}`, { cache: "no-store" });
            if (!response.ok) return [];
            const result = await readJson<EvidencesResponse>(response);
            return result.data?.evidences ?? [];
          }),
        );

        if (!active) return;
        const exactMatchByRequirement = new Map(
          exactMatches.map((match) => [match.requirementId, match]),
        );
        setJob(jobResult.data.job);
        setMapping({
          skills: apiSkills.map((skill, index) => ({
            id: skill.id,
            name: skill.name,
            status: skill.status === "learning" ? "Dipelajari" : "Aktif",
            evidence: skillEvidences[index]?.map(({ id, title }) => ({ id, title })) ?? [],
          })),
          requirements: summaryResult.data.requirements.map((requirement) => {
            const exactMatch = exactMatchByRequirement.get(requirement.id);
            return {
              id: requirement.id,
              text: requirement.name,
              priority: requirement.priority === "required" ? "Wajib" : "Preferensi",
              reviewedWithoutEvidence: requirement.reviewedWithoutEvidence,
              skillIds: requirement.skills.map((skill) => skill.id),
              autoMatchReason: exactMatch
                ? `Nama ${exactMatch.skillName} cocok langsung dengan requirement.`
                : null,
            };
          }),
          informationalRequirements: summaryResult.data.informationalRequirements,
        });
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Cocokkan Profil belum dapat dimuat.");
      }
    }

    void load();
    return () => { active = false; };
  }, [jobId]);

  if (!job || !mapping) return <MappingLoadState error={error} jobId={jobId} />;

  return (
    <JobFocusShell
      activeStep="match"
      company={job.company}
      jobId={job.id}
      mainClassName="evidence-mapping-main"
      title={job.title}
    >
      <div className="page-container evidence-mapping-page">
      <header className="evidence-mapping-header">
        <div>
          <Link href={`/lowongan/${job.id}/persyaratan`}><ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />Kembali ke review requirement</Link>
          <p className="eyebrow">Cocokkan Profil</p>
          <h1>Hubungkan syarat lowongan ke profilmu</h1>
          <p>Telusuri hubungan antara requirement, skill, dan bukti sebelum ApplyFit menyusun analisis kesiapan.</p>
        </div>
      </header>

      <section className="mapping-job-context" aria-labelledby="mapping-job-title">
        <span className="mapping-job-mark" aria-hidden="true">{getInitials(job.company)}</span>
        <div className="mapping-job-copy"><p className="eyebrow">Lowongan yang dipetakan</p><h2 id="mapping-job-title">{job.title}</h2><strong>{job.company}</strong></div>
        <div className="mapping-job-meta" aria-label="Konteks lowongan">
          <span><BriefcaseBusiness aria-hidden="true" size={14} strokeWidth={1.8} />{job.source ?? "Sumber belum diisi"}</span>
          <span><MapPin aria-hidden="true" size={14} strokeWidth={1.8} />{job.location ?? "Lokasi belum diisi"}</span>
          <span><Laptop aria-hidden="true" size={14} strokeWidth={1.8} />{job.workArrangement ?? "Cara kerja belum diisi"}</span>
        </div>
      </section>

      <EvidenceMappingWorkspace jobId={job.id} requirements={mapping.requirements} skills={mapping.skills} />

      <details className="mapping-informational">
        <summary>
          <span aria-hidden="true"><Info size={17} strokeWidth={1.8} /></span>
          <span><strong>{mapping.informationalRequirements.length} requirement tetap disimpan sebagai konteks</strong><small>Pengalaman dan pendidikan tidak masuk Fit Score.</small></span>
          <ChevronDown aria-hidden="true" size={18} strokeWidth={1.8} />
        </summary>
        <div>
          {mapping.informationalRequirements.map((requirement) => (
            <article key={requirement.id}><span>{requirement.type === "education" ? "Pendidikan" : "Pengalaman"}</span><p>{requirement.name}</p></article>
          ))}
        </div>
      </details>

      <div className="mapping-evidence-note"><LibraryBig aria-hidden="true" size={17} strokeWidth={1.8} /><p>Bukti dikelola di <Link href="/portfolio-pengalaman">Portfolio & Pengalaman</Link> dan dapat digunakan kembali untuk lowongan lain.</p></div>
      </div>
    </JobFocusShell>
  );
}

function MappingLoadState({ error, jobId }: { error: string; jobId: string }) {
  return (
    <JobFocusShell activeStep="match" jobId={jobId} mainClassName="evidence-mapping-main">
      <div className="page-container evidence-mapping-page">
        {error ? (
          <div className="persisted-job-state error">
            <AlertCircle aria-hidden="true" size={22} />
            <strong>{error}</strong>
            <Link href={`/lowongan/${jobId}/persyaratan`}>Kembali ke review requirement</Link>
          </div>
        ) : null}
      </div>
    </JobFocusShell>
  );
}

function getInitials(company: string) {
  return company.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toLocaleUpperCase("id-ID")).join("") || "AF";
}

type JobResponse = { data?: { job?: Job }; error?: { message?: string } };
type SkillsResponse = { data?: { skills?: ApiSkill[] }; error?: { message?: string } };
type EvidencesResponse = { data?: { evidences?: ApiEvidence[] } };
type AutoMatchResponse = { data?: { matches?: ExactMatch[] }; error?: { message?: string } };
type SummaryResponse = {
  data?: { requirements: SummaryRequirement[]; informationalRequirements: InformationalRequirement[] };
  error?: { message?: string };
};

async function readJson<T>(response: Response): Promise<T> {
  try { return await response.json() as T; } catch { return {} as T; }
}
