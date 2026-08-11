"use client";

import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  MapPin,
  Monitor,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

type SavedJob = {
  id: string;
  title: string;
  company: string;
  source: string | null;
  location: string | null;
  workArrangement: string | null;
  createdAt: string;
  updatedAt: string;
};

type JobListItem = SavedJob & { requirementCount: number };

export function JobsWorkspace() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });
        const result = await readJobsResponse(response);
        if (!response.ok || !result.data?.jobs) {
          throw new Error(result.error?.message ?? "Daftar lowongan belum dapat dimuat.");
        }

        const withRequirementCounts = await Promise.all(
          result.data.jobs.map(async (job) => {
            const requirementResponse = await fetch(
              `/api/jobs/${encodeURIComponent(job.id)}/requirements`,
              { cache: "no-store" },
            );
            const requirementResult = await readRequirementsResponse(requirementResponse);
            return {
              ...job,
              requirementCount:
                requirementResponse.ok && requirementResult.data
                  ? requirementResult.data.total
                  : 0,
            };
          }),
        );

        if (active) setJobs(withRequirementCounts);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Daftar lowongan belum dapat dimuat.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadJobs();
    return () => {
      active = false;
    };
  }, []);

  const jobsWithRequirements = useMemo(
    () => jobs.filter((job) => job.requirementCount > 0).length,
    [jobs],
  );

  if (error) return <JobsErrorState error={error} />;

  if (loading) {
    return <div className="page-container jobs-page"><JobsPageHeader /></div>;
  }

  if (!jobs.length) {
    return <JobsEmptyWorkspace />;
  }

  return (
    <div className="page-container jobs-page">
      <JobsPageHeader />

      <section className="jobs-overview" aria-labelledby="jobs-overview-title">
        <div className="jobs-overview-copy">
          <span className="jobs-overview-icon" aria-hidden="true">
            <BriefcaseBusiness size={23} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">Ruang kerja lowongan</p>
            <h2 id="jobs-overview-title">{jobs.length} lowongan dalam pantauanmu</h2>
            <p>
              Setiap lowongan menyimpan sumber, lokasi, cara kerja, dan progres
              requirement tanpa mencampur konteks antarpekerjaan.
            </p>
          </div>
        </div>
        <div className="jobs-stage-summary" aria-label="Ringkasan tahap lowongan">
          <span><strong>{jobsWithRequirements}</strong> memiliki requirement</span>
          <span><strong>{jobs.length - jobsWithRequirements}</strong> belum diekstrak</span>
        </div>
      </section>

      <section className="jobs-list-section" aria-labelledby="jobs-list-title">
        <div className="jobs-section-heading responsive-card-heading">
          <div>
            <p className="eyebrow">Daftar lowongan</p>
            <h2 id="jobs-list-title">Konteks pekerjaan tersimpan</h2>
          </div>
          <p className="responsive-card-heading-copy">
            Status menunjukkan tahap pengolahan data, bukan rekomendasi untuk
            melamar atau melewatkan lowongan.
          </p>
        </div>

        <div className="jobs-list">
          {jobs.map((job) => (
            <article className="job-library-row responsive-list-row" key={job.id}>
              <span className="job-library-logo" aria-hidden="true">
                {getInitials(job.company)}
              </span>
              <div className="job-library-copy">
                <h3>{job.title}</h3>
                <span><Building2 aria-hidden="true" size={13} strokeWidth={1.8} />{job.company}</span>
              </div>
              <div className="job-library-context">
                <span><ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} />{job.source ?? "Sumber belum diisi"}</span>
                <span><MapPin aria-hidden="true" size={13} strokeWidth={1.8} />{job.location ?? "Lokasi belum diisi"}</span>
                <span><Monitor aria-hidden="true" size={13} strokeWidth={1.8} />{job.workArrangement ?? "Cara kerja belum diisi"}</span>
              </div>
              <div className="job-library-progress">
                <span className={`job-stage ${job.requirementCount ? "review" : "draft"}`}>
                  {job.requirementCount ? "Requirement tersimpan" : "Belum diekstrak"}
                </span>
                <strong>{job.requirementCount ? `${job.requirementCount} requirement` : "Deskripsi tersimpan"}</strong>
                <small><Clock3 aria-hidden="true" size={12} strokeWidth={1.8} />{formatRelativeDate(job.updatedAt)}</small>
              </div>
              <Link className="job-library-detail-link" href={`/lowongan/${job.id}`}>
                Lihat detail <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function JobsEmptyWorkspace() {
  return (
    <div className="page-container jobs-page">
      <JobsPageHeader showAction={false} />

      <section className="page-empty-state jobs-zero-state" aria-labelledby="jobs-empty-title">
        <span className="page-empty-state-icon" aria-hidden="true">
          <BriefcaseBusiness size={25} strokeWidth={1.7} />
        </span>
        <p className="eyebrow">Mulai dari satu lowongan</p>
        <h2 id="jobs-empty-title">Belum ada lowongan tersimpan</h2>
        <p>Simpan lowongan yang ingin kamu pahami, lalu tinjau requirement-nya secara bertahap.</p>
        <Link className="jobs-add-button" href="/lowongan/baru">
          <Plus aria-hidden="true" size={16} strokeWidth={2} />
          Tambah lowongan
        </Link>
      </section>
    </div>
  );
}

function JobsPageHeader({ showAction = true }: { showAction?: boolean }) {
  return (
    <header className="jobs-page-header responsive-page-header">
      <div>
        <p className="eyebrow">Lowongan tersimpan</p>
        <h1>Pahami setiap lowongan sebelum melamar</h1>
        <p>
          Simpan konteks pekerjaan dan pantau tahap review requirement agar
          setiap analisis tetap spesifik pada role dan perusahaan yang tepat.
        </p>
      </div>
      {showAction ? (
        <div className="jobs-page-header-actions">
          <Link className="jobs-add-button" href="/lowongan/baru">
            <Plus aria-hidden="true" size={16} strokeWidth={2} />
            Tambah lowongan
          </Link>
        </div>
      ) : null}
    </header>
  );
}

function JobsErrorState({ error }: { error: string }) {
  return (
    <div className="page-container jobs-page">
      <div className="persisted-job-state error">
        <AlertCircle aria-hidden="true" size={22} />
        <strong>{error}</strong>
      </div>
    </div>
  );
}

function getInitials(company: string) {
  return company.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toLocaleUpperCase("id-ID")).join("") || "AF";
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru diperbarui";
  return `Diperbarui ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date)}`;
}

type JobsResponse = { data?: { jobs?: SavedJob[] }; error?: { message?: string } };
type RequirementsResponse = { data?: { total: number }; error?: { message?: string } };

async function readJobsResponse(response: Response): Promise<JobsResponse> {
  try { return await response.json() as JobsResponse; } catch { return {}; }
}

async function readRequirementsResponse(response: Response): Promise<RequirementsResponse> {
  try { return await response.json() as RequirementsResponse; } catch { return {}; }
}
