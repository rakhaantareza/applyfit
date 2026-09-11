"use client";
import { useI18n } from "../components/LanguageProvider";

import { requirementStatusLabels } from "../lib/fit-status-labels";

export type ExampleRequirement = {
  label: string;
  name: string;
  priority: "Wajib" | "Preferensi";
  status: "Proven" | "Partial" | "Learning" | "Missing";
  weight: 1 | 3;
  multiplier: 0 | 20 | 50 | 100;
  contribution: number;
  className: "proven" | "partial" | "learning" | "missing";
};

type ExampleRequirementListProps = {
  requirements: ExampleRequirement[];
};

function formatContribution(value: number, language = "id") {
  return new Intl.NumberFormat(language === "en" ? "en-GB" : "id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

function getStatusLabel(status: ExampleRequirement["status"]) {
  return requirementStatusLabels[status];
}

export function ExampleRequirementList({
  requirements,
}: ExampleRequirementListProps) {
  const { t, language } = useI18n();
  return (
    <div className="example-requirements">
      {requirements.map((requirement, index) => (
        <article className="example-requirement" key={requirement.label}>
          <span className="step-number">{index + 1}</span>
          <div className="example-requirement-copy">
            <small>{t(requirement.label)}</small>
            <h3>{t(requirement.name)}</h3>
            <div>
              <span
                className={`priority-pill ${
                  requirement.priority === "Wajib" ? "required" : ""
                }`}
              >
                {t(requirement.priority)}
              </span>
              <span className={`status-badge ${requirement.className}`}>
                {t(getStatusLabel(requirement.status))}
              </span>
            </div>
          </div>
          <div
            className="example-equation"
            aria-label={t(
              `${requirement.weight} dikali ${requirement.multiplier} persen sama dengan ${requirement.contribution}`,
            )}
          >
            <span>
              <small>{t("Bobot")}</small>
              <strong>{requirement.weight}</strong>
            </span>
            <b>×</b>
            <span>
              <small>Multiplier</small>
              <strong>{requirement.multiplier}%</strong>
            </span>
            <b>=</b>
            <span className="equation-result">
              <small>{t("Kontribusi")}</small>
              <strong>
                {formatContribution(requirement.contribution, language)}
              </strong>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
