"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
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
  const switcherRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
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
        aria-haspopup="listbox"
        aria-controls={popoverId}
        onClick={() => setIsOpen((current) => !current)}
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
        <div className="job-popover" id={popoverId} role="listbox" aria-label="Lowongan tersimpan">
          <div className="job-popover-heading">
            <div>
              <strong>Pilih lowongan</strong>
              <span>Ubah konteks analisis Fit Score</span>
            </div>
            <small>{jobs.length} tersimpan</small>
          </div>

          <div className="job-options">
            {jobs.map((job) => {
              const isActive = job.id === selectedJobId;

              return (
                <button
                  className={`job-option${isActive ? " active" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setIsOpen(false);
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
                    {isActive ? <span className="active-job-badge">Aktif</span> : null}
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
