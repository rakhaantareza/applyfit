"use client";

import Link from "next/link";
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

const jobs = [
  {
    id: "nusa-frontend",
    title: "Frontend Developer",
    company: "Nusa Digital",
    initials: "ND",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "pixel-ui",
    title: "UI Engineer",
    company: "PixelWorks",
    initials: "PW",
    source: "Glints",
    location: "Bandung",
    arrangement: "Remote",
  },
  {
    id: "karya-web",
    title: "Web Developer",
    company: "Karya Labs",
    initials: "KL",
    source: "Kalibrr",
    location: "Jakarta Pusat",
    arrangement: "On-site",
  },
  {
    id: "gojek-frontend",
    title: "Frontend Engineer",
    company: "Gojek",
    initials: "GJ",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "tokopedia-frontend",
    title: "Software Engineer, Frontend",
    company: "Tokopedia",
    initials: "TP",
    source: "Career Site",
    location: "Jakarta Selatan",
    arrangement: "Remote",
  },
  {
    id: "traveloka-web",
    title: "Web Platform Engineer",
    company: "Traveloka",
    initials: "TV",
    source: "LinkedIn",
    location: "Tangerang",
    arrangement: "Hybrid",
  },
  {
    id: "bukalapak-frontend",
    title: "Senior Frontend Engineer",
    company: "Bukalapak",
    initials: "BL",
    source: "Glints",
    location: "Jakarta Selatan",
    arrangement: "Remote",
  },
  {
    id: "xendit-platform",
    title: "UI Platform Engineer",
    company: "Xendit",
    initials: "XD",
    source: "Career Site",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "bank-jago-digital",
    title: "Digital Frontend Engineer",
    company: "Bank Jago",
    initials: "BJ",
    source: "Kalibrr",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "bibit-frontend",
    title: "Frontend Engineer",
    company: "Bibit",
    initials: "BB",
    source: "LinkedIn",
    location: "Jakarta Pusat",
    arrangement: "Hybrid",
  },
  {
    id: "ruangguru-web",
    title: "Web Engineer",
    company: "Ruangguru",
    initials: "RG",
    source: "JobStreet",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "halodoc-frontend",
    title: "Frontend Developer",
    company: "Halodoc",
    initials: "HD",
    source: "Career Site",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "mekari-react",
    title: "React Developer",
    company: "Mekari",
    initials: "MK",
    source: "LinkedIn",
    location: "Jakarta Pusat",
    arrangement: "Hybrid",
  },
  {
    id: "efishery-frontend",
    title: "Frontend Engineer",
    company: "eFishery",
    initials: "EF",
    source: "Glints",
    location: "Bandung",
    arrangement: "Hybrid",
  },
  {
    id: "sayurbox-web",
    title: "Web Application Engineer",
    company: "Sayurbox",
    initials: "SB",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "kitabisa-frontend",
    title: "Frontend Software Engineer",
    company: "Kitabisa",
    initials: "KB",
    source: "Tech in Asia",
    location: "Jakarta Selatan",
    arrangement: "Remote",
  },
  {
    id: "kredivo-ui",
    title: "UI Engineer",
    company: "Kredivo",
    initials: "KV",
    source: "Career Site",
    location: "Jakarta Barat",
    arrangement: "On-site",
  },
  {
    id: "julo-frontend",
    title: "Frontend Engineer",
    company: "JULO",
    initials: "JL",
    source: "Kalibrr",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "ajaib-web",
    title: "Senior Web Engineer",
    company: "Ajaib",
    initials: "AJ",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "stockbit-frontend",
    title: "Frontend Engineer",
    company: "Stockbit",
    initials: "ST",
    source: "Career Site",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "sociolla-web",
    title: "Web Frontend Developer",
    company: "Sociolla",
    initials: "SO",
    source: "JobStreet",
    location: "Jakarta Barat",
    arrangement: "Hybrid",
  },
  {
    id: "blibli-frontend",
    title: "Frontend Software Engineer",
    company: "Blibli",
    initials: "BI",
    source: "LinkedIn",
    location: "Jakarta Barat",
    arrangement: "Hybrid",
  },
  {
    id: "tiket-web",
    title: "Web Engineer",
    company: "tiket.com",
    initials: "TC",
    source: "Career Site",
    location: "Jakarta Pusat",
    arrangement: "Hybrid",
  },
  {
    id: "dana-frontend",
    title: "Frontend Engineer",
    company: "DANA",
    initials: "DN",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "ovo-web",
    title: "Web Application Engineer",
    company: "OVO",
    initials: "OV",
    source: "JobStreet",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
  },
  {
    id: "gudangada-frontend",
    title: "Frontend Developer",
    company: "GudangAda",
    initials: "GA",
    source: "Glints",
    location: "Jakarta Selatan",
    arrangement: "On-site",
  },
  {
    id: "sirclo-react",
    title: "React Developer",
    company: "SIRCLO",
    initials: "SC",
    source: "LinkedIn",
    location: "Tangerang",
    arrangement: "Hybrid",
  },
] as const;

type Job = (typeof jobs)[number];

type JobAnalysisContextValue = {
  selectedJob: Job;
  selectedJobId: Job["id"];
  setSelectedJobId: (id: Job["id"]) => void;
};

const JobAnalysisContext = createContext<JobAnalysisContextValue | null>(null);

function useJobAnalysis() {
  const context = useContext(JobAnalysisContext);
  if (!context) {
    throw new Error("Job analysis components must be wrapped in JobAnalysisProvider.");
  }

  return context;
}

export function JobAnalysisProvider({ children }: { children: ReactNode }) {
  const [selectedJobId, setSelectedJobId] = useState<Job["id"]>(jobs[0].id);
  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? jobs[0];

  return (
    <JobAnalysisContext.Provider
      value={{ selectedJob, selectedJobId, setSelectedJobId }}
    >
      {children}
    </JobAnalysisContext.Provider>
  );
}

export function JobSwitcher() {
  const { selectedJob, selectedJobId, setSelectedJobId } = useJobAnalysis();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentJobIds, setRecentJobIds] = useState<Job["id"][]>([
    "nusa-frontend",
    "pixel-ui",
    "xendit-platform",
    "traveloka-web",
    "mekari-react",
  ]);
  const switcherRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverId = useId();

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");

    return jobs
      .filter((job) => {
        if (!normalizedQuery) return true;

        return `${job.title} ${job.company}`
          .toLocaleLowerCase("id-ID")
          .includes(normalizedQuery);
      })
      .sort((firstJob, secondJob) => {
        const firstRecentIndex = recentJobIds.indexOf(firstJob.id);
        const secondRecentIndex = recentJobIds.indexOf(secondJob.id);

        if (firstRecentIndex === -1 && secondRecentIndex === -1) return 0;
        if (firstRecentIndex === -1) return 1;
        if (secondRecentIndex === -1) return -1;
        return firstRecentIndex - secondRecentIndex;
      });
  }, [query, recentJobIds]);

  useEffect(() => {
    if (!isOpen) return;

    const focusFrame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

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
          <small>Ganti lowongan</small>
          <strong>{selectedJob.title}</strong>
          <span>{selectedJob.company}</span>
        </span>
        <span className={`chevron${isOpen ? " open" : ""}`} aria-hidden="true">
          ⌄
        </span>
      </button>

      {isOpen ? (
        <div
          className="job-popover"
          id={popoverId}
          role="dialog"
          aria-label="Ganti lowongan yang dianalisis"
        >
          <div className="job-popover-heading">
            <div>
              <strong>Pilih lowongan</strong>
              <span>Ubah konteks analisis Fit Score</span>
            </div>
            <small>{jobs.length} tersimpan</small>
          </div>

          <label className="job-search">
            <span aria-hidden="true">⌕</span>
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari role atau perusahaan"
              aria-label="Cari berdasarkan role atau perusahaan"
            />
            {query ? (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                ×
              </button>
            ) : null}
          </label>

          <div className="job-options-scroll">
            <div className="job-list-context">
              <span>
                {query
                  ? `${visibleJobs.length} hasil ditemukan`
                  : "Terakhir dianalisis tampil paling atas"}
              </span>
            </div>

            {visibleJobs.length ? (
              <div className="job-options" role="listbox" aria-label="Lowongan tersimpan">
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
                        setRecentJobIds((current) => [
                          job.id,
                          ...current.filter((id) => id !== job.id),
                        ].slice(0, 6));
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
                          <span className="active-job-badge">Aktif</span>
                        ) : recentIndex !== -1 ? (
                          <span className="recent-job-badge">Terbaru</span>
                        ) : null}
                      </span>
                      <span className="job-option-meta">
                        <span>{job.source}</span>
                        <span>{job.location}</span>
                        <span>{job.arrangement}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="job-empty-state" role="status">
                <span aria-hidden="true">⌕</span>
                <strong>Lowongan tidak ditemukan</strong>
                <p>Coba nama role atau perusahaan yang berbeda.</p>
              </div>
            )}
          </div>

          <Link
            className="job-popover-footer"
            href="/#lowongan"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
          >
            <span>
              <strong>Lihat semua lowongan</strong>
              <small>Kelola lowongan tersimpan</small>
            </span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function AnalyzedJobContext() {
  const { selectedJob } = useJobAnalysis();

  return (
    <div className="analyzed-job-context" aria-live="polite">
      <span className="company-logo" aria-hidden="true">
        {selectedJob.initials}
      </span>
      <span className="analyzed-job-copy">
        <small>Lowongan yang dianalisis</small>
        <span className="analyzed-job-heading">
          <strong>{selectedJob.title}</strong>
          <span>{selectedJob.company}</span>
        </span>
        <span className="analyzed-job-meta">
          <span>
            <small>Sumber</small>
            <strong>{selectedJob.source}</strong>
          </span>
          <span>
            <small>Lokasi</small>
            <strong>{selectedJob.location}</strong>
          </span>
          <span>
            <small>Pengaturan kerja</small>
            <strong>{selectedJob.arrangement}</strong>
          </span>
        </span>
      </span>
    </div>
  );
}
