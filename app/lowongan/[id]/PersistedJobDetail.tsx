"use client";
import { useI18n } from "../../components/LanguageProvider";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { JobFocusShell } from "../../components/JobFocusShell";
import { BrandMotif } from "../../components/BrandMotif";
import { ActionLink, CtaArrow } from "../../components/ActionControl";
import { InlineBackLink } from "../../components/InlineBackLink";
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
  const { t, language } = useI18n();
  const [job, setJob] = useState<PersistedJob | null>(null);
  const [requirementCount, setRequirementCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch(`/api/jobs/${encodeURIComponent(jobId)}`, { cache: "no-store" }),
      fetch(`/api/jobs/${encodeURIComponent(jobId)}/requirements`, {
        cache: "no-store",
      }),
    ])
      .then(async ([jobResponse, requirementsResponse]) => {
        const [jobResult, requirementsResult] = await Promise.all([
          readJobResponse(jobResponse),
          readRequirementsResponse(requirementsResponse),
        ]);
        if (!jobResponse.ok || !jobResult.data?.job) {
          throw new Error(
            jobResult.error?.message ?? "Detail lowongan belum dapat dimuat.",
          );
        }
        if (active) {
          setJob(jobResult.data.job);
          setRequirementCount(
            requirementsResponse.ok ? (requirementsResult.data?.total ?? 0) : 0,
          );
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Detail lowongan belum dapat dimuat.",
          );
      });
    return () => {
      active = false;
    };
  }, [jobId]);

  if (!job) return <PersistedJobState jobId={jobId} message={error} />;

  const info: EditableJobInfo & { initials: string } = {
    title: job.title,
    company: job.company,
    source: job.source ?? "Belum diisi",
    location: job.location ?? "Belum diisi",
    arrangement: job.workArrangement ?? "Belum diisi",
    initials: getInitials(job.company),
  };

  return (
    <JobFocusShell
      activeStep="detail"
      company={job.company}
      jobId={job.id}
      mainClassName="job-detail-main"
      title={job.title}
    >
      <div className="page-container job-detail-page">
        <JobInfoEditor initialJob={info} jobId={job.id} allowEditing={false} />

        <section className="job-detail-content" aria-label={t("Isi lowongan")}>
          <JobDescriptionEditor
            initialDescription={job.rawDescription}
            hasExistingRequirements={requirementCount > 0}
            jobId={job.id}
            reviewHref={`/lowongan/${job.id}/persyaratan`}
          />
          <aside className="job-detail-aside" aria-label={t("Status lowongan")}>
            <span className="job-detail-accent" aria-hidden="true">
              <BrandMotif />
            </span>
            <div className="job-next-step">
              <p className="eyebrow">{t("Langkah berikutnya")}</p>
              <span
                className={`job-stage ${requirementCount ? "review" : "draft"}`}
              >
                {requirementCount ? t("Siap diperiksa") : t("Draft tersimpan")}
              </span>
              <p>
                {requirementCount
                  ? t("Periksa persyaratan sebelum lanjut ke Cocokkan Profil.")
                  : t(
                      "Ambil persyaratan dari deskripsi, lalu periksa hasilnya sebelum analisis.",
                    )}
              </p>
            </div>
            <dl>
              <div>
                <dt>{t("Persyaratan tersimpan")}</dt>
                <dd>{requirementCount || t("Belum ada")}</dd>
              </div>
              <div>
                <dt>{t("Disimpan")}</dt>
                <dd>{formatDate(job.createdAt, language)}</dd>
              </div>
              <div>
                <dt>{t("Aktivitas terakhir")}</dt>
                <dd>{formatDate(job.updatedAt, language)}</dd>
              </div>
            </dl>
            {requirementCount ? (
              <ActionLink
                className="career-button primary"
                href={`/lowongan/${job.id}/persyaratan`}
              >
                {t("Buka Persyaratan")}
                <CtaArrow />
              </ActionLink>
            ) : null}
          </aside>
        </section>
      </div>
    </JobFocusShell>
  );
}

function PersistedJobState({
  jobId,
  message,
}: {
  jobId: string;
  message: string;
}) {
  const { t } = useI18n();
  return (
    <JobFocusShell
      activeStep="detail"
      jobId={jobId}
      mainClassName="job-detail-main"
    >
      <div className="page-container job-detail-page">
        {message ? (
          <div className="persisted-job-state error">
            <AlertCircle aria-hidden="true" size={22} />
            <strong>{t(message)}</strong>
            <InlineBackLink href="/lowongan">
              {t("Kembali ke semua lowongan")}
            </InlineBackLink>
          </div>
        ) : null}
      </div>
    </JobFocusShell>
  );
}

function getInitials(company: string) {
  return (
    company
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toLocaleUpperCase("id-ID"))
      .join("") || "AF"
  );
}

function formatDate(value: string, language = "id") {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Baru saja"
    : new Intl.DateTimeFormat(language === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

type JobResponse = {
  data?: { job?: PersistedJob };
  error?: { message?: string };
};
type RequirementsResponse = {
  data?: { total: number };
  error?: { message?: string };
};
async function readJobResponse(response: Response): Promise<JobResponse> {
  try {
    return (await response.json()) as JobResponse;
  } catch {
    return {};
  }
}

async function readRequirementsResponse(
  response: Response,
): Promise<RequirementsResponse> {
  try {
    return (await response.json()) as RequirementsResponse;
  } catch {
    return {};
  }
}
