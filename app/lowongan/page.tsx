import type { Metadata } from "next";
import { StableLink as Link } from "../components/StableLink";
import {
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  MapPin,
  Monitor,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { jobs } from "./mockJobs";

export const metadata: Metadata = {
  title: "Lowongan",
  description:
    "Kelola lowongan tersimpan dan pantau kesiapan requirement sebelum dianalisis di ApplyFit.",
};

const analyzedJobCount = jobs.filter((job) => job.statusTone === "analyzed").length;
const reviewJobCount = jobs.filter((job) => job.statusTone === "review").length;
const draftJobCount = jobs.filter((job) => job.statusTone === "draft").length;

export default function JobsPage() {
  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />

      <main className="main-content jobs-main">
        <div className="page-container jobs-page">
          <header className="jobs-page-header responsive-page-header">
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

                  <Link className="job-library-detail-link" href={`/lowongan/${job.id}`}>
                    Lihat detail
                    <span aria-hidden="true">→</span>
                  </Link>
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
