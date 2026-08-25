import type { Metadata } from "next";
import {
  PRIORITY_WEIGHTS,
  STATUS_MULTIPLIERS,
} from "../../server/services/fit-score";
import { AppShell } from "../components/AppShell";
import { StableLink as Link } from "../components/StableLink";
import {
  ExampleRequirementList,
  type ExampleRequirement,
} from "./ExampleRequirementList";
import { FinalScoreCalculation } from "./FinalScoreCalculation";

export const metadata: Metadata = {
  title: "Cara Fit Score dihitung",
  description: "Pelajari status, bobot, dan formula Fit Score ApplyFit.",
};

const exampleRequirements: ExampleRequirement[] = [
  {
    label: "Requirement A",
    name: "Menguasai React",
    priority: "Wajib",
    status: "Proven",
    weight: PRIORITY_WEIGHTS.required,
    multiplier: STATUS_MULTIPLIERS.proven,
    contribution: (PRIORITY_WEIGHTS.required * STATUS_MULTIPLIERS.proven) / 100,
    className: "proven",
  },
  {
    label: "Requirement B",
    name: "Terbiasa menggunakan Figma",
    priority: "Preferensi",
    status: "Partial",
    weight: PRIORITY_WEIGHTS.preferred,
    multiplier: STATUS_MULTIPLIERS.partial,
    contribution: (PRIORITY_WEIGHTS.preferred * STATUS_MULTIPLIERS.partial) / 100,
    className: "partial",
  },
];

const statusRules = [
  {
    status: "Proven",
    multiplier: `${STATUS_MULTIPLIERS.proven}%`,
    className: "proven",
    description:
      "Skill aktif terhubung dan punya setidaknya satu Portfolio & Pengalaman pendukung.",
  },
  {
    status: "Partial",
    multiplier: `${STATUS_MULTIPLIERS.partial}%`,
    className: "partial",
    description:
      "Skill aktif sudah terhubung, tetapi belum punya Portfolio & Pengalaman pendukung.",
  },
  {
    status: "Learning",
    multiplier: `${STATUS_MULTIPLIERS.learning}%`,
    className: "learning",
    description: "Requirement terhubung ke skill yang sedang dipelajari.",
  },
  {
    status: "Missing",
    multiplier: `${STATUS_MULTIPLIERS.missing}%`,
    className: "missing",
    description: "Belum ada skill profil yang terhubung ke requirement.",
  },
] as const;

export default function CalculationExamplePage() {
  return (
    <AppShell activeItem="Cara Fit Score dihitung" mainClassName="fit-guide-main">
      <div className="page-container fit-guide-page">
        <Link className="back-link" href="/beranda">
          <span aria-hidden="true">←</span> Kembali
        </Link>

        <header className="fit-guide-header">
          <span className="fit-guide-kicker">Fit Score</span>
          <h1>Cara Fit Score dihitung</h1>
          <p>
            Fit Score merangkum seberapa kuat requirement Skill dan Tool didukung
            oleh skill serta Portfolio &amp; Pengalaman yang sudah kamu hubungkan.
          </p>
        </header>

        <nav className="fit-guide-jump-links" aria-label="Bagian panduan Fit Score">
          <a href="#status">Status</a>
          <a href="#bobot-formula">Bobot &amp; formula</a>
          <a href="#contoh">Contoh perhitungan</a>
        </nav>

        <section className="fit-guide-section" id="status" aria-labelledby="status-title">
          <div className="fit-guide-section-heading">
            <h2 id="status-title">Status requirement</h2>
            <p>Status menunjukkan hubungan requirement dengan skill dan dukungan profilmu.</p>
          </div>
          <div className="fit-guide-status-list">
            {statusRules.map((rule) => (
              <article key={rule.status}>
                <div className="fit-guide-status-name">
                  <span className={`status-dot ${rule.className}`} aria-hidden="true" />
                  <strong>{rule.status}</strong>
                  <span>{rule.multiplier}</span>
                </div>
                <p>{rule.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="fit-guide-section"
          id="bobot-formula"
          aria-labelledby="weight-title"
        >
          <div className="fit-guide-section-heading">
            <h2 id="weight-title">Bobot dan formula</h2>
            <p>Prioritas menentukan bobot maksimum sebelum status diterapkan.</p>
          </div>

          <div className="fit-guide-rules">
            <div className="fit-guide-weights" aria-label="Bobot prioritas requirement">
              <div>
                <span>{PRIORITY_WEIGHTS.required}</span>
                <p><strong>Wajib</strong><small>Bobot maksimum 3 poin</small></p>
              </div>
              <div>
                <span>{PRIORITY_WEIGHTS.preferred}</span>
                <p><strong>Preferensi</strong><small>Bobot maksimum 1 poin</small></p>
              </div>
            </div>

            <div className="fit-guide-formula" aria-label="Formula Fit Score">
              <div>
                <small>Poin tiap requirement</small>
                <strong>Bobot × multiplier status</strong>
              </div>
              <div>
                <small>Fit Score</small>
                <strong>Total poin saat ini ÷ total poin maksimum × 100</strong>
              </div>
            </div>
          </div>

          <p className="fit-guide-scope-note">
            Hanya requirement Skill dan Tool yang dihitung. Pendidikan dan pengalaman
            tetap disimpan sebagai konteks. Hasil dibulatkan ke satu angka desimal,
            dan AI tidak menentukan skor.
          </p>
        </section>

        <section className="fit-guide-section" id="contoh" aria-labelledby="example-title">
          <div className="fit-guide-section-heading">
            <h2 id="example-title">Contoh perhitungan</h2>
            <p>
              Dua requirement berikut menghasilkan 3,5 dari 4 poin maksimum,
              sehingga Fit Score akhirnya 87,5%.
            </p>
          </div>
          <div className="fit-guide-example">
            <ExampleRequirementList requirements={exampleRequirements} />
            <FinalScoreCalculation requirements={exampleRequirements} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}