import type { Metadata } from "next";
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  MapPin,
  Monitor,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";

export const metadata: Metadata = {
  title: "Lowongan",
  description:
    "Kelola lowongan tersimpan dan pantau kesiapan requirement sebelum dianalisis di ApplyFit.",
};

const jobs = [
  {
    id: "nusa-frontend",
    title: "Frontend Developer",
    company: "Nusa Digital",
    initials: "ND",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
    status: "Sudah dianalisis",
    statusTone: "analyzed",
    requirementCount: 5,
    updatedAt: "Dianalisis 2 jam lalu",
  },
  {
    id: "pixel-ui",
    title: "UI Engineer",
    company: "PixelWorks",
    initials: "PW",
    source: "Glints",
    location: "Bandung",
    arrangement: "Remote",
    status: "Siap direview",
    statusTone: "review",
    requirementCount: 8,
    updatedAt: "Disimpan kemarin",
  },
  {
    id: "karya-web",
    title: "Web Developer",
    company: "Karya Labs",
    initials: "KL",
    source: "Kalibrr",
    location: "Jakarta Pusat",
    arrangement: "On-site",
    status: "Draft tersimpan",
    statusTone: "draft",
    requirementCount: 0,
    updatedAt: "Diperbarui 2 hari lalu",
  },
  {
    id: "gojek-frontend",
    title: "Frontend Engineer",
    company: "Gojek",
    initials: "GJ",
    source: "LinkedIn",
    location: "Jakarta Selatan",
    arrangement: "Hybrid",
    status: "Siap direview",
    statusTone: "review",
    requirementCount: 11,
    updatedAt: "Disimpan 3 hari lalu",
  },
  {
    id: "tokopedia-frontend",
    title: "Software Engineer, Frontend",
    company: "Tokopedia",
    initials: "TP",
    source: "Career Site",
    location: "Jakarta Selatan",
    arrangement: "Remote",
    status: "Draft tersimpan",
    statusTone: "draft",
    requirementCount: 0,
    updatedAt: "Disimpan 5 hari lalu",
  },
  {
    id: "traveloka-web",
    title: "Web Platform Engineer",
    company: "Traveloka",
    initials: "TV",
    source: "LinkedIn",
    location: "Tangerang",
    arrangement: "Hybrid",
    status: "Sudah dianalisis",
    statusTone: "analyzed",
    requirementCount: 9,
    updatedAt: "Dianalisis 1 minggu lalu",
  },
] as const;

const analyzedJobCount = jobs.filter((job) => job.statusTone === "analyzed").length;
const reviewJobCount = jobs.filter((job) => job.statusTone === "review").length;
const draftJobCount = jobs.filter((job) => job.statusTone === "draft").length;

export default function JobsPage() {
  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />

      <main className="main-content jobs-main">
        <div className="page-container jobs-page">
          <header className="jobs-page-header">
            <div>
              <p className="eyebrow">Lowongan tersimpan</p>
              <h1>Pahami setiap lowongan sebelum melamar</h1>
              <p>
                Simpan konteks pekerjaan dan pantau tahap review requirement agar
                setiap analisis tetap spesifik pada role dan perusahaan yang tepat.
              </p>
            </div>
            <span className="mock-data-badge">Data lowongan contoh</span>
          </header>

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
                  review requirement tanpa mencampur konteks antarpekerjaan.
                </p>
              </div>
            </div>
            <div className="jobs-stage-summary" aria-label="Ringkasan tahap lowongan">
              <span><strong>{analyzedJobCount}</strong> dianalisis</span>
              <span><strong>{reviewJobCount}</strong> siap direview</span>
              <span><strong>{draftJobCount}</strong> draft</span>
            </div>
          </section>

          <section className="jobs-list-section" aria-labelledby="jobs-list-title">
            <div className="jobs-section-heading">
              <div>
                <p className="eyebrow">Daftar lowongan</p>
                <h2 id="jobs-list-title">Konteks pekerjaan tersimpan</h2>
              </div>
              <p>
                Status menunjukkan tahap pengolahan data, bukan rekomendasi untuk
                melamar atau melewatkan lowongan.
              </p>
            </div>

            <div className="jobs-list">
              {jobs.map((job) => (
                <article className="job-library-row" key={job.id}>
                  <span className="job-library-logo" aria-hidden="true">
                    {job.initials}
                  </span>

                  <div className="job-library-copy">
                    <h3>{job.title}</h3>
                    <span>
                      <Building2 aria-hidden="true" size={13} strokeWidth={1.8} />
                      {job.company}
                    </span>
                  </div>

                  <div className="job-library-context">
                    <span>
                      <ExternalLink aria-hidden="true" size={13} strokeWidth={1.8} />
                      {job.source}
                    </span>
                    <span>
                      <MapPin aria-hidden="true" size={13} strokeWidth={1.8} />
                      {job.location}
                    </span>
                    <span>
                      <Monitor aria-hidden="true" size={13} strokeWidth={1.8} />
                      {job.arrangement}
                    </span>
                  </div>

                  <div className="job-library-progress">
                    <span className={`job-stage ${job.statusTone}`}>{job.status}</span>
                    <strong>
                      {job.requirementCount
                        ? `${job.requirementCount} requirement`
                        : "Requirement belum ditinjau"}
                    </strong>
                    <small>
                      <Clock3 aria-hidden="true" size={12} strokeWidth={1.8} />
                      {job.updatedAt}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <p className="demo-note">Seluruh lowongan pada halaman ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
