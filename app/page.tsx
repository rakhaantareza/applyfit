import type { Metadata } from "next";
import Link from "next/link";
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

const readinessDetails = [
  {
    label: "2 Proven",
    detail: "React & Next.js serta TypeScript sudah didukung bukti.",
    className: "proven",
  },
  {
    label: "1 Partial",
    detail: "Git & GitHub tercatat, tetapi bukti belum ditautkan.",
    className: "partial",
  },
  {
    label: "1 Learning",
    detail: "Tailwind CSS masih dalam proses dipelajari.",
    className: "learning",
  },
  {
    label: "1 di luar skor",
    detail: "Pengalaman kerja 2 tahun tetap tampil sebagai konteks.",
    className: "informational",
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

            <section className="score-overview" aria-labelledby="score-title">
              <article className="score-card">
                <div
                  className="score-ring"
                  role="img"
                  aria-label={`Skor kecocokan ${fitScore.value} persen`}
                  style={
                    { "--score-angle": `${fitScore.value * 3.6}deg` } as CSSProperties
                  }
                >
                  <div>
                    <strong>{fitScore.value}</strong>
                    <span>%</span>
                  </div>
                </div>
                <div className="score-copy">
                  <AnalyzedJobContext />
                  <span className="fit-label">Kesiapan berbasis bukti</span>
                  <h2 id="score-title">Gambaran kesiapanmu untuk role ini</h2>
                  <p className="readiness-intro">
                    Skor merangkum seberapa jauh requirement lowongan sudah didukung
                    skill dan bukti di profilmu saat ini.
                  </p>

                  <div className="readiness-grid" aria-label="Ringkasan kesiapan">
                    {readinessDetails.map((item) => (
                      <div className="readiness-item" key={item.label}>
                        <span
                          className={`status-dot ${item.className}`}
                          aria-hidden="true"
                        />
                        <div>
                          <strong>{item.label}</strong>
                          <span>{item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>

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
                  <p className="score-footnote">
                    {fitScore.excludedRequirements} requirement non-skill tetap tampil,
                    tetapi tidak masuk perhitungan {fitScore.consideredRequirements}
                    requirement Skill &amp; Tool. Skor ini bukan keputusan untuk melamar.
                  </p>
                </div>
              </article>

              <aside className="status-card" aria-label="Peta kesiapan requirement">
                <div className="section-heading compact">
                  <div>
                    <p className="eyebrow">5 requirement lowongan</p>
                    <h2>Peta kesiapan</h2>
                  </div>
                  <span className="info-button" aria-label="Informasi status">
                    i
                  </span>
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
                <p className="scope-note">
                  Requirement pengalaman tetap ditampilkan sebagai konteks, tetapi tidak
                  memengaruhi skor MVP.
                </p>
              </aside>
            </section>

            <section className="content-grid">
              <div className="requirements-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Breakdown transparan</p>
                    <h2>Requirement lowongan ini</h2>
                  </div>
                </div>

                <RequirementList requirements={requirements} />
              </div>

              <aside className="explanation-panel">
                <div className="explanation-icon" aria-hidden="true">
                  ↗
                </div>
                <p className="eyebrow">Cara hitung</p>
                <h2>Skor dihitung dengan aturan tetap</h2>
                <p>
                  Setiap poin berasal dari bobot prioritas dan multiplier status
                  requirement.
                </p>

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
              </aside>
            </section>

            <p className="demo-note">Data contoh untuk validasi tampilan frontend.</p>
          </div>
        </JobAnalysisProvider>
      </main>
    </div>
  );
}
