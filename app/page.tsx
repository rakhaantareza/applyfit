import type { Metadata } from "next";
import { StableLink as Link } from "./components/StableLink";
import type { CSSProperties } from "react";
import { AppSidebar } from "./components/AppSidebar";
import {
  AnalyzedJobContext,
  JobAnalysisProvider,
  JobSwitcher,
} from "./components/JobScorePicker";
import {
  RequirementList,
  type Requirement,
} from "./components/RequirementList";

export const metadata: Metadata = {
  title: "Skor Kecocokan",
  description:
    "Pahami kesiapan profil untuk lowongan tertentu melalui requirement dan bukti yang transparan.",
};

const fitScore = {
  value: 77,
  consideredRequirements: 4,
  excludedRequirements: 1,
} as const;

const requirements: Requirement[] = [
  {
    name: "React & Next.js",
    kind: "Skill",
    priority: "Wajib",
    status: "Proven",
    note: "Dibuktikan oleh 2 bukti",
    evidence: [
      { title: "Website Inventori", type: "Proyek" },
      { title: "Dasbor Analitik", type: "Portofolio" },
    ],
    score: { weight: 3, multiplier: 100, earned: 3, maximum: 3 },
  },
  {
    name: "TypeScript",
    kind: "Skill",
    priority: "Wajib",
    status: "Proven",
    note: "Dibuktikan oleh 1 bukti",
    evidence: [{ title: "Dasbor Analitik", type: "Portofolio" }],
    score: { weight: 3, multiplier: 100, earned: 3, maximum: 3 },
  },
  {
    name: "Git & GitHub",
    kind: "Tool",
    priority: "Wajib",
    status: "Partial",
    note: "Skill aktif, bukti belum ditautkan",
    evidence: [],
    score: { weight: 3, multiplier: 50, earned: 1.5, maximum: 3 },
  },
  {
    name: "Tailwind CSS",
    kind: "Tool",
    priority: "Preferensi",
    status: "Learning",
    note: "Sedang dipelajari",
    evidence: [],
    score: { weight: 1, multiplier: 20, earned: 0.2, maximum: 1 },
  },
  {
    name: "Pengalaman kerja 2 tahun",
    kind: "Experience",
    priority: "Wajib",
    status: "Missing",
    note: "Belum ada pengalaman yang dipetakan",
    evidence: [],
    score: null,
  },
];

const statusSummary = [
  { label: "Proven", value: 2, className: "proven" },
  { label: "Partial", value: 1, className: "partial" },
  { label: "Learning", value: 1, className: "learning" },
  { label: "Di luar skor", value: 1, className: "informational" },
];

const attentionAreas = [
  {
    status: "Partial",
    title: "Git & GitHub",
    detail: "Skill sudah aktif, tetapi belum ada bukti yang ditautkan.",
    className: "partial",
  },
  {
    status: "Learning",
    title: "Tailwind CSS",
    detail: "Skill masih tercatat dalam tahap belajar.",
    className: "learning",
  },
];

export default function Home() {
  return (
    <div className="app-shell">
      <AppSidebar />

      <main className="main-content" id="top">
        <JobAnalysisProvider>
          <div className="page-container">
            <header className="topbar">
              <div>
                <p className="eyebrow">Analisis kesiapan sebelum melamar</p>
                <h1>Skor Kecocokan</h1>
                <p className="header-copy">
                  Pahami posisi profilmu terhadap requirement lowongan yang sedang
                  dianalisis.
                </p>
              </div>
              <JobSwitcher />
            </header>

            <section className="fit-story" aria-labelledby="score-title">
              <article className="score-card">
                <AnalyzedJobContext />

                <div className="score-main">
                  <div className="score-visual">
                    <div
                      className="score-ring"
                      role="img"
                      aria-label={`Skor kecocokan ${fitScore.value} persen`}
                      style={
                        {
                          "--score-angle": `${fitScore.value * 3.6}deg`,
                        } as CSSProperties
                      }
                    >
                      <div>
                        <strong>{fitScore.value}</strong>
                        <span>%</span>
                      </div>
                    </div>
                    <span className="score-visual-label">Fit Score saat ini</span>
                  </div>

                  <div className="score-copy">
                    <span className="fit-label">Kesiapan berbasis bukti</span>
                    <h2 id="score-title">Fondasi utamamu sudah terbukti</h2>
                    <p className="readiness-intro">
                      Dari 4 requirement yang masuk skor, 2 sudah berstatus Proven.
                      Git &amp; GitHub masih Partial karena bukti belum terhubung,
                      sementara Tailwind CSS masih Learning.
                    </p>

                    <div className="score-meta">
                      <span>
                        <small>Requirement dihitung</small>
                        <strong>4 Skill &amp; Tool</strong>
                      </span>
                      <span>
                        <small>Bukti terhubung</small>
                        <strong>3 bukti</strong>
                      </span>
                      <span>
                        <small>Diperbarui</small>
                        <strong>Hari ini, 08.45</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              <div className="status-summary" aria-label="Ringkasan status requirement">
                <div className="status-summary-heading">
                  <div>
                    <p className="eyebrow">Ringkasan status</p>
                    <h2>5 requirement lowongan</h2>
                  </div>
                  <p>
                    {fitScore.excludedRequirements} requirement pengalaman tetap
                    terlihat sebagai konteks dan tidak masuk skor MVP.
                  </p>
                </div>
                <div className="status-list">
                  {statusSummary.map((item) => (
                    <div className="status-item" key={item.label}>
                      <span className={`status-dot ${item.className}`} />
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="status-bar" aria-hidden="true">
                  <span className="proven" />
                  <span className="partial" />
                  <span className="learning" />
                  <span className="informational" />
                </div>
              </div>
            </section>

            <section className="attention-section" aria-labelledby="attention-title">
              <div className="attention-heading">
                <div>
                  <p className="eyebrow">Perlu perhatian</p>
                  <h2 id="attention-title">Dua area yang belum sepenuhnya terbukti</h2>
                </div>
                <p>
                  Status ini menjelaskan celah bukti dan tahap skill saat ini, bukan
                  rekomendasi untuk melamar atau tidak.
                </p>
              </div>

              <div className="attention-list">
                {attentionAreas.map((item) => (
                  <article className="attention-item" key={item.title}>
                    <span className={`status-dot ${item.className}`} aria-hidden="true" />
                    <div>
                      <span className={`status-badge ${item.className}`}>
                        {item.status}
                      </span>
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="requirements-panel" aria-labelledby="requirements-title">
              <div className="section-heading requirements-heading">
                <div>
                  <p className="eyebrow">Detail requirement</p>
                  <h2 id="requirements-title">Lihat dasar perhitungan satu per satu</h2>
                </div>
                <p>
                  Setiap status berasal dari skill dan bukti yang sudah terhubung ke
                  profilmu.
                </p>
              </div>

              <RequirementList requirements={requirements} />
            </section>

            <details className="scoring-disclosure">
              <summary>
                <span>
                  <span className="eyebrow">Transparansi skor</span>
                  <strong>Bagaimana Fit Score dihitung?</strong>
                  <small>Lihat formula, bobot, dan contoh perhitungan.</small>
                </span>
                <span className="disclosure-icon" aria-hidden="true">+</span>
              </summary>

              <div className="scoring-content">
                <div>
                  <h2>Aturannya tetap dan dapat ditelusuri</h2>
                  <p>
                    Setiap poin berasal dari bobot prioritas dan multiplier status
                    requirement.
                  </p>
                </div>

                <div className="formula-card">
                  <div>
                    <span>Poin saat ini</span>
                    <strong>7,7</strong>
                  </div>
                  <span className="formula-symbol">÷</span>
                  <div>
                    <span>Poin maksimum</span>
                    <strong>10</strong>
                  </div>
                  <span className="formula-symbol">×</span>
                  <strong>100</strong>
                </div>

                <div className="weights">
                  <div>
                    <span className="weight-mark required">3</span>
                    <span>
                      <strong>Requirement wajib</strong>
                      <small>Bobot 3 poin</small>
                    </span>
                  </div>
                  <div>
                    <span className="weight-mark preferred">1</span>
                    <span>
                      <strong>Requirement preferensi</strong>
                      <small>Bobot 1 poin</small>
                    </span>
                  </div>
                </div>

                <Link
                  className="text-button"
                  href="/contoh-perhitungan"
                  aria-label="Lihat contoh perhitungan skor lengkap"
                >
                  Lihat contoh perhitungan <span aria-hidden="true">→</span>
                </Link>
              </div>
            </details>

            <p className="demo-note">Data contoh untuk validasi tampilan frontend.</p>
          </div>
        </JobAnalysisProvider>
      </main>
    </div>
  );
}
