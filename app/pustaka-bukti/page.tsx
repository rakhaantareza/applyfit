import type { Metadata } from "next";
import {
  Award,
  BriefcaseBusiness,
  ExternalLink,
  FolderKanban,
  GitBranch,
  Globe2,
  LibraryBig,
  Link2,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";

export const metadata: Metadata = {
  title: "Pustaka Bukti",
  description:
    "Kumpulkan proyek, pengalaman, sertifikat, repositori, dan portofolio yang mendukung skill di profil ApplyFit.",
};

const evidenceTypeIcons = {
  Proyek: FolderKanban,
  Pengalaman: BriefcaseBusiness,
  Sertifikat: Award,
  GitHub: GitBranch,
  Portofolio: Globe2,
} as const;

const evidences = [
  {
    id: "website-inventori",
    title: "Website Inventori UMKM",
    type: "Proyek",
    description:
      "Aplikasi inventori responsif dengan autentikasi, pencarian produk, dan ringkasan stok.",
    source: "github.com/arunaw/inventori",
    skills: ["React", "Next.js", "Git & GitHub"],
    updatedAt: "Diperbarui 2 hari lalu",
  },
  {
    id: "dashboard-analitik",
    title: "Dasbor Analitik Produk",
    type: "Portofolio",
    description:
      "Studi kasus antarmuka analitik yang berfokus pada hierarki data dan aksesibilitas.",
    source: "arunawijaya.dev/analytics",
    skills: ["React", "TypeScript", "Figma"],
    updatedAt: "Diperbarui 1 minggu lalu",
  },
  {
    id: "magang-frontend",
    title: "Magang Frontend — Nusa Digital",
    type: "Pengalaman",
    description:
      "Membangun dan memelihara komponen UI untuk platform operasional internal selama enam bulan.",
    source: null,
    skills: ["React", "TypeScript", "Git & GitHub"],
    updatedAt: "Diperbarui 3 minggu lalu",
  },
  {
    id: "sertifikat-javascript",
    title: "JavaScript Algorithms and Data Structures",
    type: "Sertifikat",
    description:
      "Sertifikasi fundamental JavaScript, pemecahan masalah, serta struktur data dasar.",
    source: "freecodecamp.org/certification/arunaw",
    skills: ["JavaScript"],
    updatedAt: "Ditambahkan 1 bulan lalu",
  },
  {
    id: "component-library",
    title: "Accessible Component Library",
    type: "GitHub",
    description:
      "Eksperimen komponen reusable dengan dokumentasi state, keyboard behavior, dan token desain.",
    source: "github.com/arunaw/ui-library",
    skills: ["React", "TypeScript", "Figma"],
    updatedAt: "Diperbarui 1 bulan lalu",
  },
] as const;

const typeSummary = Object.keys(evidenceTypeIcons).map((type) => ({
  type,
  count: evidences.filter((evidence) => evidence.type === type).length,
}));

const linkedSkillCount = new Set(evidences.flatMap((evidence) => evidence.skills)).size;

export default function EvidenceLibraryPage() {
  return (
    <div className="app-shell">
      <AppSidebar activeItem="Pustaka Bukti" />

      <main className="main-content evidence-main">
        <div className="page-container evidence-library-page">
          <header className="evidence-page-header">
            <div>
              <p className="eyebrow">Pustaka bukti</p>
              <h1>Bukti nyata di balik setiap skill</h1>
              <p>
                Simpan hasil kerja, pengalaman, dan kredensial dalam satu tempat agar
                setiap klaim kemampuan dapat ditelusuri dengan jelas.
              </p>
            </div>
            <span className="mock-data-badge">Data bukti contoh</span>
          </header>

          <section className="evidence-overview" aria-labelledby="evidence-overview-title">
            <div className="evidence-overview-copy">
              <span className="evidence-overview-icon" aria-hidden="true">
                <LibraryBig size={23} strokeWidth={1.8} />
              </span>
              <div>
                <p className="eyebrow">Fondasi berbasis bukti</p>
                <h2 id="evidence-overview-title">
                  {evidences.length} bukti mendukung {linkedSkillCount} skill
                </h2>
                <p>
                  Satu bukti dapat terhubung ke beberapa skill. Hubungan inilah yang
                  membantu ApplyFit menjelaskan status requirement secara transparan.
                </p>
              </div>
            </div>

            <div className="evidence-type-summary" aria-label="Ringkasan jenis bukti">
              {typeSummary.map((item) => (
                <span key={item.type}>
                  <strong>{item.count}</strong>
                  <small>{item.type}</small>
                </span>
              ))}
            </div>
          </section>

          <section className="evidence-list-section" aria-labelledby="evidence-list-title">
            <div className="evidence-section-heading">
              <div>
                <p className="eyebrow">Semua bukti</p>
                <h2 id="evidence-list-title">Koleksi bukti profilmu</h2>
              </div>
              <p>
                Setiap item menampilkan konteks, skill yang didukung, dan sumber yang
                dapat diperiksa bila tersedia.
              </p>
            </div>

            <div className="evidence-list">
              {evidences.map((evidence) => {
                const TypeIcon = evidenceTypeIcons[evidence.type];

                return (
                  <article className="evidence-row" key={evidence.id}>
                    <span className="evidence-type-icon" aria-hidden="true">
                      <TypeIcon size={19} strokeWidth={1.8} />
                    </span>

                    <div className="evidence-row-copy">
                      <span className="evidence-type-label">{evidence.type}</span>
                      <h3>{evidence.title}</h3>
                      <p>{evidence.description}</p>
                    </div>

                    <div className="evidence-skill-links" aria-label={`Skill untuk ${evidence.title}`}>
                      <span>
                        <Link2 aria-hidden="true" size={14} strokeWidth={1.8} />
                        Skill terkait
                      </span>
                      <div>
                        {evidence.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    </div>

                    <div className="evidence-source">
                      {evidence.source ? (
                        <span>
                          <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
                          {evidence.source}
                        </span>
                      ) : (
                        <span>Catatan internal</span>
                      )}
                      <small>{evidence.updatedAt}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <p className="demo-note">Seluruh item pada halaman ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
