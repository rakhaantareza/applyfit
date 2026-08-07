"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

const jobs = [
  {
    id: "nusa-frontend",
    title: "Frontend Developer",
    company: "Nusa Digital",
    initials: "ND",
  },
  {
    id: "pixel-ui",
    title: "UI Engineer",
    company: "PixelWorks",
    initials: "PW",
  },
  {
    id: "karya-web",
    title: "Web Developer",
    company: "Karya Labs",
    initials: "KL",
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

  return (
    <label className="job-switcher">
      <span className="company-logo" aria-hidden="true">
        {selectedJob.initials}
      </span>
      <span className="job-choice">
        <small>Lowongan aktif</small>
        <select
          aria-label="Pilih lowongan"
          value={selectedJobId}
          onChange={(event) => setSelectedJobId(event.target.value as typeof selectedJobId)}
        >
          {jobs.map((job) => (
            <option value={job.id} key={job.id}>
              {job.title} · {job.company}
            </option>
          ))}
        </select>
      </span>
      <span className="chevron" aria-hidden="true">
        ⌄
      </span>
    </label>
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
        <strong>{selectedJob.title}</strong>
        <span>{selectedJob.company}</span>
      </span>
    </div>
  );
}
