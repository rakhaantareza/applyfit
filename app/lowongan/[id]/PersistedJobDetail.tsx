"use client";

import { AlertCircle, ArrowLeft, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppSidebar } from "../../components/AppSidebar";
import { StableLink as Link } from "../../components/StableLink";
import { JobDescriptionEditor } from "./JobDescriptionEditor";
import { JobInfoEditor, type EditableJobInfo } from "./JobInfoEditor";

type PersistedJob = {
  id: string;
  title: string;
  company: string;
  source: string | null;
  location: string | null;
  workArrangement: string | null;
  rawDescription: string;
  createdAt: string;
  updatedAt: string;
};

export function PersistedJobDetail({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<PersistedJob | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" }),
      fetch(`/api/jobs/${encodeURIComponent(jobId)}/requirements`, { cache: "no-store" }),
    ])
      .then(async ([jobResponse, requirementsResponse]) => {
        const [jobResult, requirementsResult] = await Promise.all([
          readJobResponse(jobResponse),
          readRequirementsResponse(requirementsResponse),
        ]);
        if (!jobResponse.ok || !jobResult.data?.job) {
          throw new Error(jobResult.error?.message ?? "Detail lowongan belum dapat dimuat.");
        }
        if (active) {
          setJob(jobResult.data.job);
          setRequirementCount(
            requirementsResponse.ok ? requirementsResult.data?.total ?? 0 : 0,
          );
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Detail lowongan belum dapat dimuat.");
      });
    return () => { active = false; };
  }, [jobId]);

  if (!job) return <PersistedJobState message={error} />;

  const info: EditableJobInfo & { initials: string } = {
    title: job.title,
    company: job.company,
    source: job.source ?? "Belum diisi",
    location: job.location ?? "Belum diisi",
    arrangement: job.workArrangement ?? "Belum diisi",
    initials: getInitials(job.company),
  };

  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />
      <main className="main-content job-detail-main">
        <div className="page-container job-detail-page">
          <header className="job-detail-page-header">
            <Link href="/lowongan"><ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />Kembali ke semua lowongan</Link>
            <span className={`job-stage ${requirementCount ? "review" : "draft"}`}>
              {requirementCount ? "Requirement tersimpan" : "Belum diekstrak"}
            </span>
          </header>

          <JobInfoEditor initialJob={info} jobId={job.id} />

          <section className="job-detail-content" aria-label="Isi lowongan">
            <JobDescriptionEditor
              initialDescription={job.rawDescription}
              jobId={job.id}
              reviewHref={`/lowongan/${job.id}/tinjau-syarat`}
            />
            <aside className="job-detail-aside" aria-label="Status lowongan">
              <div><p className="eyebrow">Langkah berikutnya</p><span className={`job-stage ${requirementCount ? "review" : "draft"}`}>{requirementCount ? "Siap ditinjau" : "Draft tersimpan"}</span><p>{requirementCount ? "Periksa requirement tersimpan sebelum melanjutkan ke pemetaan." : "Ekstrak requirement dari deskripsi, lalu periksa hasilnya sebelum analisis."}</p></div>
              <dl>
                <div><dt>Requirement tersimpan</dt><dd>{requirementCount || "Belum ada"}</dd></div>
                <div><dt>Disimpan</dt><dd>{formatDate(job.createdAt)}</dd></div>
                <div><dt>Aktivitas terakhir</dt><dd>{formatDate(job.updatedAt)}</dd></div>
              </dl>
              <p className="job-detail-source-note"><Clock3 aria-hidden="true" size={13} strokeWidth={1.8} />Konteks ini berasal dari informasi yang kamu simpan.</p>
              {requirementCount ? (
                <Link className="career-button primary" href={`/lowongan/${job.id}/tinjau-syarat`}>
                  Tinjau requirement
                  <span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function PersistedJobState({ message }: { message: string }) {
  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />
      <main className="main-content job-detail-main">
        <div className="page-container job-detail-page">
          {message ? (
            <div className="persisted-job-state error">
              <AlertCircle aria-hidden="true" size={22} />
              <strong>{message}</strong>
              <Link href="/lowongan">Kembali ke semua lowongan</Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function getInitials(company: string) {
  return company.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toLocaleUpperCase("id-ID")).join("") || "AF";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Baru saja" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

type JobResponse = { data?: { job?: PersistedJob }; error?: { message?: string } };
type RequirementsResponse = { data?: { total: number }; error?: { message?: string } };
async function readJobResponse(response: Response): Promise<JobResponse> {
  try { return await response.json() as JobResponse; } catch { return {}; }
}

async function readRequirementsResponse(response: Response): Promise<RequirementsResponse> {
  try { return await response.json() as RequirementsResponse; } catch { return {}; }
}
