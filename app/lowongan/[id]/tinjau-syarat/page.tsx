import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { AppSidebar } from "../../../components/AppSidebar";
import { jobs } from "../../mockJobs";
import { RequirementReviewEditor } from "./RequirementReviewEditor";

type RequirementReviewPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: RequirementReviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  return {
    title: job ? `Tinjau Syarat — ${job.title}` : "Tinjau Syarat",
    description: "Periksa requirement hasil ekstraksi sebelum dipakai dalam analisis ApplyFit.",
  };
}

export default async function RequirementReviewPage({
  params,
}: RequirementReviewPageProps) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);
  if (!job) notFound();

  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />

      <main className="main-content requirement-review-main">
        <div className="page-container requirement-review-page">
          <header className="requirement-review-header">
            <div>
              <Link href={`/lowongan/${job.id}`}>
                <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
                Kembali ke detail lowongan
              </Link>
              <p className="eyebrow">Tinjau syarat</p>
              <h1>Periksa requirement sebelum dianalisis</h1>
              <p>
                Hasil ekstraksi adalah draft. Pastikan setiap kalimat, prioritas, dan
                tipe requirement sesuai dengan konteks {job.title} di {job.company}.
              </p>
            </div>
            <span className="mock-data-badge">Hasil AI contoh</span>
          </header>

          <section className="requirement-review-overview" aria-labelledby="review-overview-title">
            <div>
              <span className="requirement-review-overview-icon" aria-hidden="true">
                <BookOpenCheck size={22} strokeWidth={1.8} />
              </span>
              <div>
                <p className="eyebrow">Konteks review</p>
                <h2 id="review-overview-title">Requirement menunggu konfirmasi</h2>
                <p>
                  ApplyFit belum menggunakan daftar ini untuk Fit Score sampai pengguna
                  selesai meninjau hasil ekstraksi.
                </p>
              </div>
            </div>
            <dl>
              <div><dt>Role</dt><dd>{job.title}</dd></div>
              <div><dt>Perusahaan</dt><dd>{job.company}</dd></div>
              <div><dt>Sumber</dt><dd>{job.source}</dd></div>
            </dl>
          </section>

          <RequirementReviewEditor />

          <p className="demo-note">Seluruh requirement pada halaman ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
