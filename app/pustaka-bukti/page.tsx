import type { Metadata } from "next";
import { AppSidebar } from "../components/AppSidebar";
import { EvidenceLibrary, type EvidenceItem } from "./EvidenceLibrary";

export const metadata: Metadata = {
  title: "Pustaka Bukti",
  description:
    "Kumpulkan proyek, pengalaman, sertifikat, repositori, dan portofolio yang mendukung skill di profil ApplyFit.",
};

const evidences: EvidenceItem[] = [
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
];

const profileSkills = [
  "React",
  "Next.js",
  "TypeScript",
  "Git & GitHub",
  "Figma",
  "Tailwind CSS",
];

export default function EvidenceLibraryPage() {
  return (
    <div className="app-shell">
      <AppSidebar activeItem="Pustaka Bukti" />

      <main className="main-content evidence-main">
        <div className="page-container evidence-library-page">
          <header className="evidence-page-header responsive-page-header">
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

          <EvidenceLibrary
            initialEvidences={evidences}
            availableSkills={profileSkills}
          />

          <p className="demo-note">Seluruh item pada halaman ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
