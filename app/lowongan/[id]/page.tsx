import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
} from "lucide-react";
import { AppSidebar } from "../../components/AppSidebar";
import { jobs } from "../mockJobs";
import { JobInfoEditor } from "./JobInfoEditor";
import { JobDescriptionEditor } from "./JobDescriptionEditor";

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
  const initialDescription = `Tim produk mencari engineer untuk membantu membangun pengalaman web yang cepat, konsisten, dan mudah digunakan. Peran ini bekerja dekat dengan product designer, engineer, serta product manager untuk mengubah kebutuhan pengguna menjadi antarmuka yang dapat dipelihara.

Peran ini cocok untuk seseorang yang nyaman bekerja secara kolaboratif, terbiasa memberi konteks pada keputusan teknis, dan peduli pada detail implementasi dari tahap eksplorasi sampai rilis.

## Tanggung jawab utama

- Membangun dan memelihara fitur web menggunakan React dan TypeScript.
- Berkolaborasi dengan design untuk menjaga kualitas serta aksesibilitas UI.
- Menulis kode yang dapat diuji dan berpartisipasi dalam proses code review.
- Mengidentifikasi masalah performa dan memperbaiki pengalaman pengguna.

## Kualifikasi yang dicantumkan

- Memahami JavaScript modern, React, HTML, dan CSS.
- Terbiasa menggunakan Git dalam alur kerja tim.
- Mampu berkomunikasi dan memecahkan masalah secara terstruktur.
- Pengalaman dengan Next.js dan automated testing menjadi nilai tambah.`;

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

          <JobInfoEditor initialJob={job} />

          <section className="job-detail-content" aria-label="Isi lowongan">
            <JobDescriptionEditor initialDescription={initialDescription} />

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
