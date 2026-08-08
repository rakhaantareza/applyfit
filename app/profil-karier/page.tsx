import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { CareerDirectionEditor } from "./CareerDirectionEditor";
import { SkillManager, type CareerSkill } from "./SkillManager";

export const metadata: Metadata = {
  title: "Profil Karier",
  description:
    "Lihat target karier, bidang pekerjaan, dan keahlian yang menjadi dasar analisis ApplyFit.",
};

const profile = {
  name: "Aruna Wijaya",
  initials: "AW",
  targetRole: "Frontend Developer",
  careerField: "Software Engineering",
  summary:
    "Frontend developer awal karier yang berfokus membangun pengalaman web yang jelas, cepat, dan mudah digunakan.",
  completeness: 80,
};

const skills: CareerSkill[] = [
  {
    id: "react",
    name: "React",
    level: "Mahir",
    status: "Aktif",
    evidenceCount: 2,
  },
  {
    id: "nextjs",
    name: "Next.js",
    level: "Menengah",
    status: "Aktif",
    evidenceCount: 2,
  },
  {
    id: "typescript",
    name: "TypeScript",
    level: "Menengah",
    status: "Aktif",
    evidenceCount: 1,
  },
  {
    id: "git-github",
    name: "Git & GitHub",
    level: "Menengah",
    status: "Aktif",
    evidenceCount: 0,
  },
  {
    id: "figma",
    name: "Figma",
    level: "Dasar",
    status: "Aktif",
    evidenceCount: 1,
  },
  {
    id: "tailwind-css",
    name: "Tailwind CSS",
    level: "Dasar",
    status: "Dipelajari",
    evidenceCount: 0,
  },
];

export default function CareerProfilePage() {
  return (
    <div className="app-shell">
      <AppSidebar activeItem="Profil Karier" />

      <main className="main-content profile-main">
        <div className="page-container career-profile-page">
          <header className="profile-page-header">
            <div>
              <p className="eyebrow">Profil karier</p>
              <h1>Arah karier dan keahlianmu</h1>
              <p>
                Profil ini menjadi konteks utama saat ApplyFit membaca requirement
                lowongan dan menelusuri bukti yang relevan.
              </p>
            </div>
            <span className="mock-data-badge">Data profil contoh</span>
          </header>

          <section className="career-profile-hero" aria-labelledby="profile-name">
            <div className="profile-identity">
              <span className="profile-avatar" aria-hidden="true">
                {profile.initials}
              </span>
              <div>
                <span className="profile-status">
                  <BadgeCheck aria-hidden="true" size={15} strokeWidth={1.9} />
                  Profil aktif
                </span>
                <h2 id="profile-name">{profile.name}</h2>
                <p>{profile.summary}</p>
              </div>
            </div>

            <CareerDirectionEditor
              initialCareerField={profile.careerField}
              initialTargetRole={profile.targetRole}
            />

          </section>

          <SkillManager initialSkills={skills} />

          <p className="demo-note">
            Kelengkapan profil contoh: {profile.completeness}%.
          </p>
        </div>
      </main>
    </div>
  );
}
