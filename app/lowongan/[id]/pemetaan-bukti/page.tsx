import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Info,
  Laptop,
  LibraryBig,
  Link2,
  MapPin,
  SearchCheck,
  Waypoints,
} from "lucide-react";
import { AppSidebar } from "../../../components/AppSidebar";
import { jobs } from "../../mockJobs";

type EvidenceMappingPageProps = {
  params: Promise<{ id: string }>;
};

type ProfileEvidence = {
  id: string;
  title: string;
};

type ProfileSkill = {
  id: string;
  name: string;
  status: "Aktif" | "Dipelajari";
  evidence: ProfileEvidence[];
};

type SkillRequirement = {
  id: string;
  text: string;
  priority: "Wajib" | "Preferensi";
  skillIds: string[];
  autoMatchReason: string | null;
};

const profileSkills: ProfileSkill[] = [
  {
    id: "react",
    name: "React",
    status: "Aktif",
    evidence: [
      { id: "website-inventori", title: "Website Inventori UMKM" },
      { id: "dashboard-analitik", title: "Dasbor Analitik Produk" },
    ],
  },
  {
    id: "typescript",
    name: "TypeScript",
    status: "Aktif",
    evidence: [
      { id: "dashboard-analitik", title: "Dasbor Analitik Produk" },
      { id: "magang-frontend", title: "Magang Frontend — Nusa Digital" },
    ],
  },
  {
    id: "javascript",
    name: "JavaScript",
    status: "Aktif",
    evidence: [
      {
        id: "sertifikat-javascript",
        title: "JavaScript Algorithms and Data Structures",
      },
    ],
  },
  {
    id: "git",
    name: "Git & GitHub",
    status: "Aktif",
    evidence: [
      { id: "website-inventori", title: "Website Inventori UMKM" },
      { id: "magang-frontend", title: "Magang Frontend — Nusa Digital" },
    ],
  },
  {
    id: "nextjs",
    name: "Next.js",
    status: "Aktif",
    evidence: [{ id: "website-inventori", title: "Website Inventori UMKM" }],
  },
  {
    id: "automated-testing",
    name: "Automated Testing",
    status: "Dipelajari",
    evidence: [],
  },
];

const skillRequirements: SkillRequirement[] = [
  {
    id: "react-typescript",
    text: "Mampu membangun fitur web menggunakan React dan TypeScript.",
    priority: "Wajib",
    skillIds: ["react", "typescript"],
    autoMatchReason: "Nama React dan TypeScript ditemukan langsung pada requirement.",
  },
  {
    id: "html-css-javascript",
    text: "Memahami JavaScript modern, HTML, dan CSS.",
    priority: "Wajib",
    skillIds: ["javascript"],
    autoMatchReason: "Nama JavaScript ditemukan langsung pada requirement.",
  },
  {
    id: "git-review",
    text: "Terbiasa menggunakan Git dan berpartisipasi dalam code review.",
    priority: "Wajib",
    skillIds: ["git"],
    autoMatchReason: "Nama Git cocok dengan skill Git & GitHub di profil.",
  },
  {
    id: "communication",
    text: "Mampu berkomunikasi dan memecahkan masalah secara terstruktur.",
    priority: "Wajib",
    skillIds: [],
    autoMatchReason: null,
  },
  {
    id: "nextjs",
    text: "Memiliki pengalaman menggunakan Next.js.",
    priority: "Preferensi",
    skillIds: ["nextjs"],
    autoMatchReason: "Nama Next.js ditemukan langsung pada requirement.",
  },
  {
    id: "automated-testing",
    text: "Memahami automated testing untuk aplikasi web.",
    priority: "Preferensi",
    skillIds: ["automated-testing"],
    autoMatchReason: "Nama Automated Testing cocok langsung dengan skill yang sedang dipelajari.",
  },
];

const informationalRequirements = [
  {
    type: "Pengalaman",
    text: "Memiliki pengalaman profesional membangun aplikasi frontend.",
  },
  {
    type: "Pendidikan",
    text: "Latar belakang pendidikan di bidang ilmu komputer atau bidang terkait.",
  },
] as const;

function getMappedSkills(requirement: SkillRequirement) {
  return requirement.skillIds.flatMap((skillId) => {
    const skill = profileSkills.find((item) => item.id === skillId);
    return skill ? [skill] : [];
  });
}

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

export async function generateMetadata({
  params,
}: EvidenceMappingPageProps): Promise<Metadata> {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);

  return {
    title: job ? `Pemetaan Bukti — ${job.title}` : "Pemetaan Bukti",
    description: "Hubungkan requirement lowongan dengan skill dan bukti profil secara transparan.",
  };
}

export default async function EvidenceMappingPage({
  params,
}: EvidenceMappingPageProps) {
  const { id } = await params;
  const job = jobs.find((item) => item.id === id);
  if (!job) notFound();

  const mappedRequirementCount = skillRequirements.filter(
    (requirement) => getMappedSkills(requirement).length > 0,
  ).length;
  const mappedEvidenceIds = new Set(
    skillRequirements.flatMap((requirement) =>
      getMappedSkills(requirement).flatMap((skill) =>
        skill.evidence.map((evidence) => evidence.id),
      ),
    ),
  );
  const mappingProgress = Math.round(
    (mappedRequirementCount / skillRequirements.length) * 100,
  );
  const autoMatchedRequirementCount = skillRequirements.filter(
    (requirement) => requirement.autoMatchReason !== null,
  ).length;

  return (
    <div className="app-shell">
      <AppSidebar activeItem="Lowongan" />

      <main className="main-content evidence-mapping-main">
        <div className="page-container evidence-mapping-page">
          <header className="evidence-mapping-header">
            <div>
              <Link href={`/lowongan/${job.id}/tinjau-syarat`}>
                <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
                Kembali ke review requirement
              </Link>
              <p className="eyebrow">Pemetaan bukti</p>
              <h1>Hubungkan syarat lowongan ke profilmu</h1>
              <p>
                Telusuri hubungan antara requirement, skill, dan bukti sebelum
                ApplyFit menyusun analisis kesiapan.
              </p>
            </div>
            <span className="mock-data-badge">Pemetaan contoh</span>
          </header>

          <section className="mapping-job-context" aria-labelledby="mapping-job-title">
            <span className="mapping-job-mark" aria-hidden="true">{job.initials}</span>
            <div className="mapping-job-copy">
              <p className="eyebrow">Lowongan yang dipetakan</p>
              <h2 id="mapping-job-title">{job.title}</h2>
              <strong>{job.company}</strong>
            </div>
            <div className="mapping-job-meta" aria-label="Konteks lowongan">
              <span>
                <BriefcaseBusiness aria-hidden="true" size={14} strokeWidth={1.8} />
                {job.source}
              </span>
              <span>
                <MapPin aria-hidden="true" size={14} strokeWidth={1.8} />
                {job.location}
              </span>
              <span>
                <Laptop aria-hidden="true" size={14} strokeWidth={1.8} />
                {job.arrangement}
              </span>
            </div>
          </section>

          <section className="mapping-overview" aria-labelledby="mapping-overview-title">
            <div className="mapping-overview-copy">
              <span className="mapping-overview-icon" aria-hidden="true">
                <Waypoints size={22} strokeWidth={1.8} />
              </span>
              <div>
                <p className="eyebrow">Kesiapan pemetaan</p>
                <h2 id="mapping-overview-title">
                  {mappedRequirementCount} dari {skillRequirements.length} requirement skill sudah terhubung
                </h2>
                <p>
                  Hubungan di bawah ini memakai skill dan bukti dari profil contoh.
                  Status requirement nantinya diturunkan dari data tersebut, bukan disimpan di lowongan.
                </p>
              </div>
            </div>
            <div className="mapping-progress" aria-label={`Pemetaan ${mappingProgress} persen`}>
              <div>
                <span>Progres hubungan</span>
                <strong>{mappingProgress}%</strong>
              </div>
              <span className="mapping-progress-track" aria-hidden="true">
                <span style={{ width: `${mappingProgress}%` }} />
              </span>
              <small>{mappedEvidenceIds.size} bukti unik sudah ikut mendukung pemetaan.</small>
            </div>
          </section>

          <div className="mapping-auto-summary" role="status">
            <span aria-hidden="true">
              <SearchCheck size={19} strokeWidth={1.9} />
            </span>
            <div>
              <strong>{autoMatchedRequirementCount} kecocokan nama ditemukan otomatis</strong>
              <p>
                ApplyFit hanya menautkan nama skill yang cocok langsung. Requirement tanpa
                kecocokan tetap dibiarkan terbuka untuk ditinjau pengguna.
              </p>
            </div>
            <small>Exact match contoh</small>
          </div>

          <section className="mapping-requirements" aria-labelledby="mapping-list-title">
            <div className="mapping-section-heading">
              <div>
                <p className="eyebrow">Requirement yang masuk skor</p>
                <h2 id="mapping-list-title">Periksa hubungan satu per satu</h2>
              </div>
              <p>
                Satu requirement dapat terhubung ke lebih dari satu skill. Bukti mengikuti
                skill yang sudah tercatat di profil karier.
              </p>
            </div>

            <div className="mapping-list">
              {skillRequirements.map((requirement, index) => {
                const mappedSkills = getMappedSkills(requirement);
                const evidenceCount = new Set(
                  mappedSkills.flatMap((skill) =>
                    skill.evidence.map((evidence) => evidence.id),
                  ),
                ).size;
                const isMapped = mappedSkills.length > 0;

                return (
                  <article className={`mapping-row${isMapped ? " mapped" : ""}`} key={requirement.id}>
                    <span className="mapping-row-number">{index + 1}</span>
                    <div className="mapping-requirement-copy">
                      <span className={`mapping-priority ${requirement.priority === "Preferensi" ? "preferred" : ""}`}>
                        {requirement.priority}
                      </span>
                      <h3>{requirement.text}</h3>
                      <small>Requirement skill</small>
                    </div>
                    <div className="mapping-connection" aria-label={`Hubungan profil untuk ${requirement.text}`}>
                      <div className="mapping-connection-heading">
                        <span>
                          {isMapped ? (
                            <SearchCheck aria-hidden="true" size={15} strokeWidth={1.9} />
                          ) : (
                            <CircleDashed aria-hidden="true" size={15} strokeWidth={1.8} />
                          )}
                          {isMapped ? "Cocok otomatis" : "Tidak ada kecocokan langsung"}
                        </span>
                        {isMapped ? <small>{evidenceCount} bukti terkait</small> : null}
                      </div>
                      {isMapped ? (
                        <div className="mapping-skill-list">
                          {mappedSkills.map((skill) => (
                            <span key={skill.id}>
                              <Link2 aria-hidden="true" size={12} strokeWidth={1.9} />
                              {skill.name}
                              <small>{skill.status}</small>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>Nama requirement ini belum cocok langsung dengan skill profil.</p>
                      )}
                      {requirement.autoMatchReason ? (
                        <p className="mapping-auto-reason">
                          <CheckCircle2 aria-hidden="true" size={12} strokeWidth={1.9} />
                          {requirement.autoMatchReason}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <details className="mapping-informational">
            <summary>
              <span aria-hidden="true"><Info size={17} strokeWidth={1.8} /></span>
              <span>
                <strong>{informationalRequirements.length} requirement tetap disimpan sebagai konteks</strong>
                <small>Pengalaman dan pendidikan tidak masuk Fit Score MVP.</small>
              </span>
              <ChevronDown aria-hidden="true" size={18} strokeWidth={1.8} />
            </summary>
            <div>
              {informationalRequirements.map((requirement) => (
                <article key={requirement.type}>
                  <span>{requirement.type}</span>
                  <p>{requirement.text}</p>
                </article>
              ))}
            </div>
          </details>

          <div className="mapping-evidence-note">
            <LibraryBig aria-hidden="true" size={17} strokeWidth={1.8} />
            <p>
              Bukti dikelola di <Link href="/pustaka-bukti">Pustaka Bukti</Link> dan
              dapat digunakan kembali untuk lowongan lain.
            </p>
          </div>

          <p className="demo-note">Seluruh pemetaan pada halaman ini menggunakan data tiruan.</p>
        </div>
      </main>
    </div>
  );
}
