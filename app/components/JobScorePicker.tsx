"use client";
import { useI18n } from "./LanguageProvider";

import {
  BriefcaseBusiness,
  ChevronDown,
  Laptop,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { CtaArrow, IconButton } from "./ActionControl";
import { StableLink as Link } from "./StableLink";
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type JobAnalysisJob = {
  id: string;
  title: string;
  company: string;
  initials: string;
  source: string | null;
  location: string | null;
  arrangement: string | null;
};

type JobAnalysisContextValue = {
  jobs: JobAnalysisJob[];
  selectedJob: JobAnalysisJob;
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
};

const JobAnalysisContext = createContext<JobAnalysisContextValue | null>(null);

function useJobAnalysis() {
  const context = useContext(JobAnalysisContext);
  if (!context)
    throw new Error(
      "Job analysis components must be wrapped in JobAnalysisProvider.",
    );
  return context;
}

export function JobAnalysisProvider({
  children,
  jobs,
  selectedJobId,
  onSelectJob,
}: {
  children: ReactNode;
  jobs: JobAnalysisJob[];
  selectedJobId: string;
  onSelectJob: (id: string) => void;
}) {
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? jobs[0];
  if (!selectedJob) return <>{children}</>;

  return (
    <JobAnalysisContext.Provider
      value={{
        jobs,
        selectedJob,
        selectedJobId: selectedJob.id,
        setSelectedJobId: onSelectJob,
      }}
    >
      {children}
    </JobAnalysisContext.Provider>
  );
}

export function JobSwitcher() {
  const { t } = useI18n();
  const { jobs, selectedJob, selectedJobId, setSelectedJobId } =
    useJobAnalysis();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentJobIds, setRecentJobIds] = useState<string[]>([selectedJobId]);
  const switcherRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverId = useId();

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return jobs
      .filter(
        (job) =>
          !normalizedQuery ||
          `${job.title} ${job.company}`
            .toLocaleLowerCase("id-ID")
            .includes(normalizedQuery),
      )
      .sort((firstJob, secondJob) => {
        const firstRecentIndex = recentJobIds.indexOf(firstJob.id);
        const secondRecentIndex = recentJobIds.indexOf(secondJob.id);
        if (firstRecentIndex === -1 && secondRecentIndex === -1) return 0;
        if (firstRecentIndex === -1) return 1;
        if (secondRecentIndex === -1) return -1;
        return firstRecentIndex - secondRecentIndex;
      });
  }, [jobs, query, recentJobIds]);

  useEffect(() => {
    if (!isOpen) return;
    const focusFrame = window.requestAnimationFrame(() =>
      searchRef.current?.focus(),
    );
    function handlePointerDown(event: PointerEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="job-switcher-wrap" ref={switcherRef}>
      <button
        className="job-switcher"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        onClick={() => {
          if (isOpen) setQuery("");
          setIsOpen((current) => !current);
        }}
      >
        <span className="company-logo" aria-hidden="true">
          {selectedJob.initials}
        </span>
        <span className="job-choice">
          <small>{t("Ganti lowongan")}</small>
          <strong>{selectedJob.title}</strong>
          <span>{selectedJob.company}</span>
        </span>
        <ChevronDown
          className={`chevron${isOpen ? " open" : ""}`}
          aria-hidden="true"
          size={16}
          strokeWidth={1.8}
        />
      </button>

      {isOpen ? (
        <div
          className="job-popover"
          id={popoverId}
          role="dialog"
          aria-label={t("Ganti lowongan yang dianalisis")}
        >
          <div className="job-popover-heading">
            <div>
              <strong>{t("Pilih lowongan")}</strong>
              <span>{t("Ubah konteks analisis Fit Score")}</span>
            </div>
            <small>
              {jobs.length} {t("tersimpan")}
            </small>
          </div>
          <label className="job-search">
            <Search aria-hidden="true" size={16} strokeWidth={1.8} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Cari role atau perusahaan")}
              aria-label={t("Cari berdasarkan role atau perusahaan")}
            />
            {query ? (
              <IconButton
                size="compact"
                type="button"
                aria-label={t("Hapus pencarian")}
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X aria-hidden="true" size={14} strokeWidth={1.8} />
              </IconButton>
            ) : null}
          </label>
          <div className="job-options-scroll">
            <div className="job-list-context">
              <span>
                {query
                  ? t(`${visibleJobs.length} hasil ditemukan`)
                  : t("Lowongan yang baru dipilih tampil paling atas")}
              </span>
            </div>
            {visibleJobs.length ? (
              <div
                className="job-options"
                role="listbox"
                aria-label={t("Lowongan tersimpan")}
              >
                {visibleJobs.map((job) => {
                  const isActive = job.id === selectedJobId;
                  const recentIndex = recentJobIds.indexOf(job.id);
                  return (
                    <button
                      className={`job-option${isActive ? " active" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      key={job.id}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setRecentJobIds((current) =>
                          [
                            job.id,
                            ...current.filter((id) => id !== job.id),
                          ].slice(0, 6),
                        );
                        setIsOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="job-option-topline">
                        <span className="company-logo" aria-hidden="true">
                          {job.initials}
                        </span>
                        <span className="job-option-title">
                          <strong>{job.title}</strong>
                          <span>{job.company}</span>
                        </span>
                        {isActive ? (
                          <span className="active-job-badge">{t("Aktif")}</span>
                        ) : recentIndex !== -1 ? (
                          <span className="recent-job-badge">
                            {t("Terbaru")}
                          </span>
                        ) : null}
                      </span>
                      <span className="job-option-meta">
                        <span>{job.source ?? t("Sumber belum diisi")}</span>
                        <span>{job.location ?? t("Lokasi belum diisi")}</span>
                        <span>
                          {job.arrangement ?? t("Cara kerja belum diisi")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="job-empty-state" role="status">
                <Search aria-hidden="true" size={18} strokeWidth={1.8} />
                <strong>{t("Lowongan tidak ditemukan")}</strong>
                <p>{t("Coba nama role atau perusahaan yang berbeda.")}</p>
              </div>
            )}
          </div>
          <Link
            className="job-popover-footer"
            href="/lowongan"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
          >
            <span>
              <strong>{t("Lihat semua lowongan")}</strong>
              <small>{t("Kelola lowongan tersimpan")}</small>
            </span>
            <CtaArrow />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AnalyzedJobContext() {
  const { t } = useI18n();
  const { selectedJob } = useJobAnalysis();
  const hasMetadata = Boolean(
    selectedJob.source || selectedJob.location || selectedJob.arrangement,
  );

  return (
    <div className="analyzed-job-context" aria-live="polite">
      {hasMetadata ? (
        <span className="analyzed-job-meta" aria-label={t("Konteks lowongan")}>
          {selectedJob.source ? (
            <span>
              <BriefcaseBusiness
                aria-hidden="true"
                size={13}
                strokeWidth={1.8}
              />
              {selectedJob.source}
            </span>
          ) : null}
          {selectedJob.location ? (
            <span>
              <MapPin aria-hidden="true" size={13} strokeWidth={1.8} />
              {selectedJob.location}
            </span>
          ) : null}
          {selectedJob.arrangement ? (
            <span>
              <Laptop aria-hidden="true" size={13} strokeWidth={1.8} />
              {selectedJob.arrangement}
            </span>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
