import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  BriefcaseBusiness,
  CircleAlert,
  GraduationCap,
  ListChecks,
  Sparkles,
  Wrench,
} from "lucide-react";
import { AppSidebar } from "../../../components/AppSidebar";
import { jobs } from "../../mockJobs";

type RequirementReviewPageProps = {
  params: Promise<{ id: string }>;
};

const requirements = [
  {
    id: "react-typescript",
    priority: "Wajib",
    type: "Skill",
    text: "Mampu membangun fitur web menggunakan React dan TypeScript.",
  },
  {
    id: "html-css-javascript",
    priority: "Wajib",
    type: "Skill",
    text: "Memahami JavaScript modern, HTML, dan CSS.",
  },
  {
    id: "git-review",
    priority: "Wajib",
    type: "Skill",
    text: "Terbiasa menggunakan Git dan berpartisipasi dalam code review.",
  },
  {
    id: "communication",
    priority: "Wajib",
    type: "Skill",
    text: "Mampu berkomunikasi dan memecahkan masalah secara terstruktur.",
  },
  {
    id: "frontend-experience",
    priority: "Wajib",
    type: "Pengalaman",
    text: "Memiliki pengalaman profesional membangun aplikasi frontend.",
  },
  {
    id: "nextjs",
    priority: "Diutamakan",
    type: "Skill",
    text: "Memiliki pengalaman menggunakan Next.js.",
  },
  {
    id: "automated-testing",
    priority: "Diutamakan",
    type: "Skill",
    text: "Memahami automated testing untuk aplikasi web.",
  },
  {
    id: "education",
    priority: "Diutamakan",
    type: "Pendidikan",
    text: "Latar belakang pendidikan di bidang ilmu komputer atau bidang terkait.",
  },
] as const;

const requirementTypeIcons = {
  Skill: Wrench,
  Pengalaman: BriefcaseBusiness,
  Pendidikan: GraduationCap,
} as const;

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

  const requiredRequirements = requirements.filter((item) => item.priority === "Wajib");
  const preferredRequirements = requirements.filter((item) => item.priority === "Diutamakan");
  const excludedRequirementCount = requirements.filter((item) => item.type !== "Skill").length;

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
                <h2 id="review-overview-title">{requirements.length} requirement menunggu konfirmasi</h2>
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

          <section className="requirement-review-list-section" aria-labelledby="review-list-title">
            <div className="requirement-review-section-heading">
              <div>
                <p className="eyebrow">Draft requirement</p>
                <h2 id="review-list-title">Hasil yang perlu diperiksa</h2>
              </div>
              <div className="requirement-review-counts" aria-label="Ringkasan hasil ekstraksi">
                <span><strong>{requiredRequirements.length}</strong> wajib</span>
                <span><strong>{preferredRequirements.length}</strong> diutamakan</span>
                <span><strong>{excludedRequirementCount}</strong> di luar skor MVP</span>
              </div>
            </div>

            <div className="requirement-review-group">
              <div className="requirement-review-group-heading">
                <span aria-hidden="true"><ListChecks size={16} strokeWidth={1.8} /></span>
                <div>
                  <h3>Wajib</h3>
                  <p>Requirement utama yang dinyatakan perlu dipenuhi pada lowongan.</p>
                </div>
              </div>
              <div className="requirement-review-list">
                {requiredRequirements.map((requirement, index) => {
                  const TypeIcon = requirementTypeIcons[requirement.type];
                  return (
                    <article key={requirement.id}>
                      <span className="requirement-review-number">{index + 1}</span>
                      <div>
                        <span className="requirement-review-type">
                          <TypeIcon aria-hidden="true" size={13} strokeWidth={1.8} />
                          {requirement.type}
                        </span>
                        <p>{requirement.text}</p>
                      </div>
                      <span className="requirement-review-state">
                        <Sparkles aria-hidden="true" size={12} strokeWidth={1.8} />
                        Hasil AI
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="requirement-review-group preferred">
              <div className="requirement-review-group-heading">
                <span aria-hidden="true"><ListChecks size={16} strokeWidth={1.8} /></span>
                <div>
                  <h3>Diutamakan</h3>
                  <p>Kualifikasi tambahan yang memberi konteks, dengan bobot lebih rendah.</p>
                </div>
              </div>
              <div className="requirement-review-list">
                {preferredRequirements.map((requirement, index) => {
                  const TypeIcon = requirementTypeIcons[requirement.type];
                  return (
                    <article key={requirement.id}>
                      <span className="requirement-review-number">{index + 1}</span>
                      <div>
                        <span className="requirement-review-type">
                          <TypeIcon aria-hidden="true" size={13} strokeWidth={1.8} />
                          {requirement.type}
                        </span>
                        <p>{requirement.text}</p>
                      </div>
                      <span className="requirement-review-state">
                        <Sparkles aria-hidden="true" size={12} strokeWidth={1.8} />
                        Hasil AI
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="requirement-review-note">
              <CircleAlert aria-hidden="true" size={17} strokeWidth={1.8} />
              <p>
                Requirement pengalaman dan pendidikan tetap disimpan sebagai konteks,
                tetapi tidak dihitung dalam Fit Score MVP. Halaman ini belum menampilkan
                status kesiapan profil.
              </p>
            </div>
          </section>

          <p className="demo-note">Seluruh requirement pada halaman ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
