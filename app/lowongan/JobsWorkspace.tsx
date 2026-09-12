"use client";
import { EmptyCollectionState } from "../components/EmptyCollectionState";
import { useI18n } from "../components/LanguageProvider";

import {
  AlertCircle,
  Building2,
  Clock3,
  ExternalLink,
  MapPin,
  Monitor,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  ActionButton,
  ActionLink,
  CtaArrow,
} from "../components/ActionControl";
import { PageHeader, SectionHeader } from "../components/ContentHeaders";
import { CollectionIllustration } from "../components/CollectionIllustration";
import { WorkspaceLoadingState } from "../components/WorkspaceLoadingState";

import { JobInfoEditor } from "./[id]/JobInfoEditor";

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
  const { t, language } = useI18n();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const filteredJobs = jobs.filter((job) => {
    const text = [job.title, job.company, job.source, job.location]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return (
      text.includes(query.trim().toLocaleLowerCase()) &&
      (stage === "all" ||
        (stage === "review"
          ? job.requirementCount > 0
          : job.requirementCount === 0))
    );
  });

  useEffect(() => {
    let active = true;

    async function loadJobs() {
      try {
        const response = await fetch("/api/workspace?scope=jobs", {
          cache: "no-store",
        });
        const result = await readJobsResponse(response);
        if (!response.ok || !result.data?.jobs) {
          throw new Error(
            result.error?.message ?? "Daftar lowongan belum dapat dimuat.",
          );
        }

        if (active) setJobs(result.data.jobs);
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

  if (error) return <JobsErrorState error={error} />;

  if (loading) {
    return (
      <div className="page-container jobs-page">
        <JobsPageHeader />
        <WorkspaceLoadingState rows={4} />
      </div>
    );
  }

  if (!jobs.length) {
    return <JobsEmptyWorkspace />;
  }

  return (
    <div className="page-container jobs-page">
      <JobsPageHeader />

      <section
        className="jobs-list-section jobs-overview"
        aria-labelledby="jobs-list-title"
      >
        <SectionHeader
          title={t("Lowongan tersimpan")}
          titleId="jobs-list-title"
        />

        <div className="jobs-filter-panel">
          <label className="jobs-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label={t("Cari lowongan")}
              placeholder={t("Cari role, perusahaan, atau lokasi")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label={t("Filter tahap lowongan")}
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            <option value="all">{t("Semua tahap")}</option>
            <option value="draft">{t("Deskripsi tersimpan")}</option>
            <option value="review">{t("Persyaratan tersedia")}</option>
          </select>
        </div>
        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <article
              className="job-library-row responsive-list-row"
              key={job.id}
            >
              <span className="job-library-logo" aria-hidden="true">
                {getInitials(job.company)}
              </span>
              <div className="job-library-copy">
                <h3 className="type-primary-title">{job.title}</h3>
                <span>
                  <Building2 aria-hidden="true" size={13} strokeWidth={1.8} />
                  {job.company}
                </span>
              </div>
              <div className="job-library-context">
                <span>
                  <ExternalLink
                    aria-hidden="true"
                    size={13}
                    strokeWidth={1.8}
                  />
                  {job.source ?? t("Sumber belum diisi")}
                </span>
                <span>
                  <MapPin aria-hidden="true" size={13} strokeWidth={1.8} />
                  {job.location ?? t("Lokasi belum diisi")}
                </span>
                <span>
                  <Monitor aria-hidden="true" size={13} strokeWidth={1.8} />
                  {job.workArrangement ?? t("Cara kerja belum diisi")}
                </span>
              </div>
              <div className="job-library-progress">
                <span
                  className={`job-stage ${job.requirementCount ? "review" : "draft"}`}
                >
                  {job.requirementCount
                    ? t("Persyaratan tersedia")
                    : t("Ambil persyaratan")}
                </span>
                <strong>
                  {job.requirementCount
                    ? t(`${job.requirementCount} persyaratan`)
                    : t("Deskripsi tersimpan")}
                </strong>
                <small>
                  <Clock3 aria-hidden="true" size={12} strokeWidth={1.8} />
                  {t(formatRelativeDate(job.updatedAt, language))}
                </small>
              </div>
              <div className="job-card-footer">
                <ActionLink
                  className="job-library-detail-link"
                  variant="secondary"
                  href={`/lowongan/${job.id}`}
                >
                  {t("Lihat detail")} <CtaArrow />
                </ActionLink>
                <JobInfoEditor
                  presentation="card"
                  jobId={job.id}
                  initialJob={{
                    title: job.title,
                    company: job.company,
                    source: job.source ?? "",
                    location: job.location ?? "",
                    arrangement: job.workArrangement ?? "",
                    initials: getInitials(job.company),
                  }}
                  onUpdated={(info) =>
                    setJobs((current) =>
                      current.map((item) =>
                        item.id === job.id
                          ? {
                              ...item,
                              title: info.title,
                              company: info.company,
                              source: info.source || null,
                              location: info.location || null,
                              workArrangement: info.arrangement || null,
                            }
                          : item,
                      ),
                    )
                  }
                  onDeleted={() =>
                    setJobs((current) =>
                      current.filter((item) => item.id !== job.id),
                    )
                  }
                />
              </div>
            </article>
          ))}
          {!filteredJobs.length ? (
            <div
              className="evidence-empty-state jobs-filter-empty"
              role="status"
            >
              <CollectionIllustration kind="search" />
              <div>
                <strong>{t("Tidak ada lowongan yang cocok")}</strong>
                <p>{t("Coba kata pencarian atau tahap lainnya.")}</p>
              </div>
              <ActionButton
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStage("all");
                }}
              >
                {t("Reset filter")}
              </ActionButton>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function JobsEmptyWorkspace() {
  const { t } = useI18n();
  return (
    <div className="page-container jobs-page">
      <JobsPageHeader showAction={false} />

      <EmptyCollectionState
        className="jobs-zero-state"
        kind="jobs"
        titleId="jobs-empty-title"
        title={t("Belum ada lowongan tersimpan")}
        description={t(
          "Simpan lowongan yang ingin kamu pahami, lalu periksa Persyaratan secara bertahap.",
        )}
        action={
          <ActionLink className="jobs-add-button" href="/lowongan/baru">
            <Plus aria-hidden="true" size={16} />
            {t("Tambah lowongan")}
          </ActionLink>
        }
      />
    </div>
  );
}

function JobsPageHeader({ showAction = true }: { showAction?: boolean }) {
  const { t } = useI18n();
  return (
    <PageHeader
      title={t("Lowongan")}
      description={
        <>{t("Lowongan yang ingin kamu cocokkan dengan profilmu.")}</>
      }
      action={
        showAction ? (
          <ActionLink className="jobs-add-button" href="/lowongan/baru">
            <Plus aria-hidden="true" size={16} strokeWidth={2} />
            {t("Tambah lowongan")}
          </ActionLink>
        ) : null
      }
    />
  );
}

function JobsErrorState({ error }: { error: string }) {
  const { t } = useI18n();
  return (
    <div className="page-container jobs-page">
      <div className="persisted-job-state error">
        <AlertCircle aria-hidden="true" size={22} />
        <strong>{t(error)}</strong>
      </div>
    </div>
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

function formatRelativeDate(value: string, language = "id") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru diperbarui";
  return `Diperbarui ${new Intl.DateTimeFormat(language === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date)}`;
}

type JobsResponse = {
  data?: { jobs?: JobListItem[] };
  error?: { message?: string };
};

async function readJobsResponse(response: Response): Promise<JobsResponse> {
  try {
    return (await response.json()) as JobsResponse;
  } catch {
    return {};
  }
}
