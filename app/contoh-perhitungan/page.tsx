import { Message } from "../components/LanguageProvider";
import type { Metadata } from "next";
import {
  PRIORITY_WEIGHTS,
  STATUS_MULTIPLIERS,
} from "../../server/services/fit-score";
import { AppShell } from "../components/AppShell";
import { InlineBackLink } from "../components/InlineBackLink";
import { fitScoreStatusLabels } from "../lib/fit-status-labels";
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
    contribution:
      (PRIORITY_WEIGHTS.preferred * STATUS_MULTIPLIERS.partial) / 100,
    className: "partial",
  },
];

const statusRules = [
  {
    status: fitScoreStatusLabels.proven,
    multiplier: `${STATUS_MULTIPLIERS.proven}%`,
    className: "proven",
    description:
      "Skill aktif terhubung dan punya setidaknya satu Portfolio & Pengalaman pendukung.",
  },
  {
    status: fitScoreStatusLabels.partial,
    multiplier: `${STATUS_MULTIPLIERS.partial}%`,
    className: "partial",
    description:
      "Skill aktif sudah terhubung, tetapi belum punya Portfolio & Pengalaman pendukung.",
  },
  {
    status: fitScoreStatusLabels.learning,
    multiplier: `${STATUS_MULTIPLIERS.learning}%`,
    className: "learning",
    description: "Requirement terhubung ke skill yang sedang dipelajari.",
  },
  {
    status: fitScoreStatusLabels.missing,
    multiplier: `${STATUS_MULTIPLIERS.missing}%`,
    className: "missing",
    description: "Belum ada skill profil yang terhubung ke requirement.",
  },
] as const;

export default function CalculationExamplePage() {
  return (
    <AppShell
      activeItem="Cara Fit Score dihitung"
      mainClassName="fit-guide-main"
    >
      <div className="page-container fit-guide-page">
        <InlineBackLink href="/beranda">
          <Message>{"Kembali"}</Message>
        </InlineBackLink>

        <header className="fit-guide-header">
          <span className="fit-guide-kicker">Fit Score</span>
          <h1>
            <Message>{"Cara Fit Score dihitung"}</Message>
          </h1>
          <p>
            <Message>
              {
                "Fit Score merangkum seberapa kuat requirement Skill dan Tool didukung oleh skill serta Portfolio & Pengalaman yang sudah kamu hubungkan."
              }
            </Message>
          </p>
        </header>

        <nav
          className="fit-guide-jump-links"
          aria-label="Bagian panduan Fit Score"
        >
          <a href="#status">Status</a>
          <a href="#bobot-formula">
            <Message>{"Bobot & formula"}</Message>
          </a>
          <a href="#contoh">
            <Message>{"Contoh perhitungan"}</Message>
          </a>
        </nav>

        <section
          className="fit-guide-section"
          id="status"
          aria-labelledby="status-title"
        >
          <div className="fit-guide-section-heading">
            <h2 id="status-title">
              <Message>{"Status requirement"}</Message>
            </h2>
            <p>
              <Message>
                {
                  "Status menunjukkan hubungan requirement dengan skill dan dukungan profilmu."
                }
              </Message>
            </p>
          </div>
          <div className="fit-guide-status-list">
            {statusRules.map((rule) => (
              <article key={rule.status}>
                <div className="fit-guide-status-name">
                  <span
                    className={`status-dot ${rule.className}`}
                    aria-hidden="true"
                  />
                  <strong>
                    <Message>{rule.status}</Message>
                  </strong>
                  <span>{rule.multiplier}</span>
                </div>
                <p>
                  <Message>{rule.description}</Message>
                </p>
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
            <h2 id="weight-title">
              <Message>{"Bobot dan formula"}</Message>
            </h2>
            <p>
              <Message>
                {
                  "Prioritas menentukan bobot maksimum sebelum status diterapkan."
                }
              </Message>
            </p>
          </div>

          <div className="fit-guide-rules">
            <div
              className="fit-guide-weights"
              aria-label="Bobot prioritas requirement"
            >
              <div>
                <span>{PRIORITY_WEIGHTS.required}</span>
                <p>
                  <strong>
                    <Message>{"Wajib"}</Message>
                  </strong>
                  <small>
                    <Message>{"Bobot maksimum 3 poin"}</Message>
                  </small>
                </p>
              </div>
              <div>
                <span>{PRIORITY_WEIGHTS.preferred}</span>
                <p>
                  <strong>
                    <Message>{"Preferensi"}</Message>
                  </strong>
                  <small>
                    <Message>{"Bobot maksimum 1 poin"}</Message>
                  </small>
                </p>
              </div>
            </div>

            <div className="fit-guide-formula" aria-label="Formula Fit Score">
              <div>
                <small>
                  <Message>{"Poin tiap requirement"}</Message>
                </small>
                <strong>
                  <Message>{"Bobot × multiplier status"}</Message>
                </strong>
              </div>
              <div>
                <small>Fit Score</small>
                <strong>
                  <Message>
                    {"Total poin saat ini ÷ total poin maksimum × 100"}
                  </Message>
                </strong>
              </div>
            </div>
          </div>

          <p className="fit-guide-scope-note">
            <Message>
              {
                "Hanya requirement Skill dan Tool yang dihitung. Pendidikan dan pengalaman tetap disimpan sebagai konteks. Hasil dibulatkan ke satu angka desimal, dan AI tidak menentukan skor."
              }
            </Message>
          </p>
        </section>

        <section
          className="fit-guide-section"
          id="contoh"
          aria-labelledby="example-title"
        >
          <div className="fit-guide-section-heading">
            <h2 id="example-title">
              <Message>{"Contoh perhitungan"}</Message>
            </h2>
            <p>
              <Message>
                {
                  "Dua requirement berikut menghasilkan 3,5 dari 4 poin maksimum, sehingga Fit Score akhirnya 87,5%."
                }
              </Message>
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
