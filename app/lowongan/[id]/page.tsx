import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  Monitor,
} from "lucide-react";
import { AppSidebar } from "../../components/AppSidebar";
import { jobs } from "../mockJobs";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  return {
    title: job ? `${job.title} di ${job.company}` : "Detail Lowongan",
    description: job
      ? `Lihat konteks lowongan ${job.title} di ${job.company}.`
      : "Lihat konteks lowongan tersimpan di ApplyFit.",
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  if (!job) notFound();

  const processingCopy = {
    analyzed: "Requirement telah direview dan analisis kesiapan sudah tersedia.",
    review: "Hasil ekstraksi tersimpan dan masih menunggu review pengguna.",
    draft: "Deskripsi lowongan tersimpan dan belum diproses menjadi requirement.",
  }[job.statusTone];

  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />

      <main className="main-content job-detail-main">
        <div className="page-container job-detail-page">
          <header className="job-detail-page-header">
            <Link href="/lowongan">
              <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
              Kembali ke semua lowongan
            </Link>
            <span className="mock-data-badge">Data lowongan contoh</span>
          </header>

          <section className="job-detail-hero" aria-labelledby="job-detail-title">
            <div className="job-detail-identity">
              <span className="job-detail-logo" aria-hidden="true">{job.initials}</span>
              <div>
                <p className="eyebrow">Lowongan tersimpan</p>
                <h1 id="job-detail-title">{job.title}</h1>
                <span className="job-detail-company">
                  <Building2 aria-hidden="true" size={15} strokeWidth={1.8} />
                  {job.company}
                </span>
              </div>
            </div>

            <div className="job-detail-meta" aria-label="Konteks lowongan">
              <span>
                <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
                <small>Sumber</small>
                <strong>{job.source}</strong>
              </span>
              <span>
                <MapPin aria-hidden="true" size={14} strokeWidth={1.8} />
                <small>Lokasi</small>
                <strong>{job.location}</strong>
              </span>
              <span>
                <Monitor aria-hidden="true" size={14} strokeWidth={1.8} />
                <small>Cara kerja</small>
                <strong>{job.arrangement}</strong>
              </span>
              <span>
                <BriefcaseBusiness aria-hidden="true" size={14} strokeWidth={1.8} />
                <small>Tipe</small>
                <strong>{job.employmentType}</strong>
              </span>
            </div>
          </section>

          <section className="job-detail-content" aria-label="Isi lowongan">
            <article className="job-description-copy">
              <div className="job-detail-section-heading">
                <span aria-hidden="true"><FileText size={18} strokeWidth={1.8} /></span>
                <div>
                  <p className="eyebrow">Deskripsi asli</p>
                  <h2>Tentang peran ini</h2>
                </div>
              </div>

              <p>
                {job.company} mencari {job.title} untuk membantu membangun pengalaman
                web yang cepat, konsisten, dan mudah digunakan. Kamu akan bekerja dekat
                dengan product designer, engineer, serta product manager untuk mengubah
                kebutuhan pengguna menjadi antarmuka yang dapat dipelihara.
              </p>
              <p>
                Peran ini cocok untuk seseorang yang nyaman bekerja secara kolaboratif,
                terbiasa memberi konteks pada keputusan teknis, dan peduli pada detail
                implementasi dari tahap eksplorasi sampai rilis.
              </p>

              <h3>Tanggung jawab utama</h3>
              <ul>
                <li>Membangun dan memelihara fitur web menggunakan React dan TypeScript.</li>
                <li>Berkolaborasi dengan design untuk menjaga kualitas serta aksesibilitas UI.</li>
                <li>Menulis kode yang dapat diuji dan berpartisipasi dalam proses code review.</li>
                <li>Mengidentifikasi masalah performa dan memperbaiki pengalaman pengguna.</li>
              </ul>

              <h3>Kualifikasi yang dicantumkan</h3>
              <ul>
                <li>Memahami JavaScript modern, React, HTML, dan CSS.</li>
                <li>Terbiasa menggunakan Git dalam alur kerja tim.</li>
                <li>Mampu berkomunikasi dan memecahkan masalah secara terstruktur.</li>
                <li>Pengalaman dengan Next.js dan automated testing menjadi nilai tambah.</li>
              </ul>
            </article>

            <aside className="job-detail-aside" aria-label="Status lowongan">
              <div>
                <p className="eyebrow">Status pengolahan</p>
                <span className={`job-stage ${job.statusTone}`}>{job.status}</span>
                <p>{processingCopy}</p>
              </div>

              <dl>
                <div>
                  <dt>Requirement tersimpan</dt>
                  <dd>{job.requirementCount || "Belum ada"}</dd>
                </div>
                <div>
                  <dt>Dipublikasikan</dt>
                  <dd>{job.postedAt.replace("Dipublikasikan ", "")}</dd>
                </div>
                <div>
                  <dt>Aktivitas terakhir</dt>
                  <dd>{job.updatedAt}</dd>
                </div>
              </dl>

              <p className="job-detail-source-note">
                <Clock3 aria-hidden="true" size={13} strokeWidth={1.8} />
                Teks ini adalah contoh salinan dari sumber lowongan, bukan hasil atau
                rekomendasi AI.
              </p>
            </aside>
          </section>

          <p className="demo-note">Detail lowongan ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
