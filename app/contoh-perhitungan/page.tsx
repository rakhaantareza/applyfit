import type { Metadata } from "next";
import { AppSidebar } from "../components/AppSidebar";
import {
  ExampleRequirementList,
  type ExampleRequirement,
} from "./ExampleRequirementList";
import { FinalScoreCalculation } from "./FinalScoreCalculation";

export const metadata: Metadata = {
  title: "Contoh Perhitungan",
  description: "Pelajari bagaimana ApplyFit menghitung skor secara transparan.",
};

const exampleRequirements: ExampleRequirement[] = [
  {
    label: "Requirement A",
    name: "Menguasai React",
    priority: "Wajib",
    status: "Proven",
    weight: 3,
    multiplier: 100,
    contribution: 3,
    className: "proven",
  },
  {
    label: "Requirement B",
    name: "Terbiasa menggunakan Figma",
    priority: "Preferensi",
    status: "Partial",
    weight: 1,
    multiplier: 50,
    contribution: 0.5,
    className: "partial",
  },
];

const statusMultipliers = [
  { status: "Proven", value: "100%", className: "proven" },
  { status: "Partial", value: "50%", className: "partial" },
  { status: "Learning", value: "20%", className: "learning" },
  { status: "Missing", value: "0%", className: "missing" },
] as const;

export default function CalculationExamplePage() {
  return (
    <div className="app-shell">
      <AppSidebar />
      <main className="main-content calculation-main">
        <div className="page-container calculation-page">
          <a className="back-link" href="/">
            <span aria-hidden="true">←</span> Kembali ke skor kecocokan
          </a>

          <section className="calculation-hero">
            <div>
              <p className="eyebrow">Formula yang transparan</p>
              <h1>Contoh Perhitungan</h1>
              <p>
                Ikuti perjalanan setiap poin dari prioritas requirement sampai menjadi skor
                akhir. Tidak ada keputusan tersembunyi atau angka dari AI.
              </p>
            </div>
            <div className="example-score-card">
              <span>Skor akhir contoh</span>
              <strong>87,5%</strong>
              <small>Contoh hasil formula</small>
            </div>
          </section>

          <div className="calculation-grid">
            <section className="calculation-workspace" aria-labelledby="example-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">2 requirement terhitung</p>
                  <h2 id="example-title">Dari requirement ke poin</h2>
                </div>
                <span className="dummy-badge">Data tiruan</span>
              </div>

              <ExampleRequirementList requirements={exampleRequirements} />
              <FinalScoreCalculation requirements={exampleRequirements} />
            </section>

            <aside className="calculation-reference">
              <div>
                <p className="eyebrow">Referensi cepat</p>
                <h2>Bobot prioritas</h2>
                <div className="reference-weights">
                  <span>
                    <b>3</b>
                    <span>
                      <strong>Wajib</strong>
                      <small>Paling berpengaruh</small>
                    </span>
                  </span>
                  <span>
                    <b>1</b>
                    <span>
                      <strong>Preferensi</strong>
                      <small>Nilai tambah</small>
                    </span>
                  </span>
                </div>
              </div>

              <div className="multiplier-reference">
                <h2>Multiplier status</h2>
                {statusMultipliers.map((item) => (
                  <div key={item.status}>
                    <span className={`status-dot ${item.className}`} />
                    <span>{item.status}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>

              <div className="transparency-note">
                <span aria-hidden="true">i</span>
                <p>Hanya requirement Skill dan Tool yang masuk perhitungan skor MVP.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
