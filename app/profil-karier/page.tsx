import type { Metadata } from "next";
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Layers3,
  Link2,
} from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";

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

const skills = [
  {
    name: "React",
    level: "Mahir",
    status: "Aktif",
    evidenceCount: 2,
  },
  {
    name: "Next.js",
    level: "Menengah",
    status: "Aktif",
    evidenceCount: 2,
  },
  {
    name: "TypeScript",
    level: "Menengah",
    status: "Aktif",
    evidenceCount: 1,
  },
  {
    name: "Git & GitHub",
    level: "Menengah",
    status: "Aktif",
    evidenceCount: 0,
  },
  {
    name: "Figma",
    level: "Dasar",
    status: "Aktif",
    evidenceCount: 1,
  },
  {
    name: "Tailwind CSS",
    level: "Dasar",
    status: "Dipelajari",
    evidenceCount: 0,
  },
] as const;

const activeSkillCount = skills.filter((skill) => skill.status === "Aktif").length;
const learningSkillCount = skills.length - activeSkillCount;
const linkedEvidenceCount = skills.reduce(
  (total, skill) => total + skill.evidenceCount,
  0,
);

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

            <div className="career-direction" aria-label="Target karier">
              <div className="career-direction-heading">
                <span className="career-direction-icon" aria-hidden="true">
                  <BriefcaseBusiness size={20} strokeWidth={1.8} />
                </span>
                <div>
                  <span>Arah yang dituju</span>
                  <strong>{profile.targetRole}</strong>
                </div>
              </div>
              <div className="career-direction-field">
                <span>Bidang karier</span>
                <strong>{profile.careerField}</strong>
              </div>
            </div>

            <div className="profile-foundation" aria-label="Ringkasan profil">
              <div>
                <span className="profile-foundation-icon" aria-hidden="true">
                  <Layers3 size={18} strokeWidth={1.8} />
                </span>
                <span>
                  <strong>{skills.length} skill</strong>
                  <small>tercatat di profil</small>
                </span>
              </div>
              <div>
                <span className="profile-foundation-icon" aria-hidden="true">
                  <BadgeCheck size={18} strokeWidth={1.8} />
                </span>
                <span>
                  <strong>{activeSkillCount} aktif</strong>
                  <small>siap dipetakan</small>
                </span>
              </div>
              <div>
                <span className="profile-foundation-icon" aria-hidden="true">
                  <BookOpen size={18} strokeWidth={1.8} />
                </span>
                <span>
                  <strong>{learningSkillCount} dipelajari</strong>
                  <small>masih bertumbuh</small>
                </span>
              </div>
              <div>
                <span className="profile-foundation-icon" aria-hidden="true">
                  <Link2 size={18} strokeWidth={1.8} />
                </span>
                <span>
                  <strong>{linkedEvidenceCount} tautan bukti</strong>
                  <small>di seluruh skill</small>
                </span>
              </div>
            </div>
          </section>

          <section className="profile-skills-section" aria-labelledby="profile-skills-title">
            <div className="profile-section-heading">
              <div>
                <p className="eyebrow">Fondasi keahlian</p>
                <h2 id="profile-skills-title">Skill yang membentuk profilmu</h2>
              </div>
              <p>
                Status skill di profil berbeda dari status requirement. Bukti yang
                terhubung akan menentukan hasil pemetaan pada setiap lowongan.
              </p>
            </div>

            <div className="profile-skill-list">
              {skills.map((skill) => (
                <article className="profile-skill-row" key={skill.name}>
                  <div className="profile-skill-name">
                    <span aria-hidden="true">{skill.name.slice(0, 2).toUpperCase()}</span>
                    <div>
                      <h3>{skill.name}</h3>
                      <small>Level {skill.level.toLowerCase()}</small>
                    </div>
                  </div>

                  <div className="profile-skill-state">
                    <span
                      className={`skill-state-badge ${
                        skill.status === "Aktif" ? "active" : "learning"
                      }`}
                    >
                      {skill.status}
                    </span>
                    <span className="skill-level">{skill.level}</span>
                  </div>

                  <div className="profile-skill-evidence">
                    <Link2 aria-hidden="true" size={15} strokeWidth={1.8} />
                    <span>
                      {skill.evidenceCount > 0
                        ? `${skill.evidenceCount} bukti terhubung`
                        : "Belum ada bukti"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <p className="demo-note">
            Kelengkapan profil contoh: {profile.completeness}%.
          </p>
        </div>
      </main>
    </div>
  );
}
