"use client";
import { useI18n } from "../components/LanguageProvider";

import type { ExampleRequirement } from "./ExampleRequirementList";

type FinalScoreCalculationProps = {
  requirements: ExampleRequirement[];
};

export function calculateExampleScore(requirements: ExampleRequirement[]) {
  const currentPoints = requirements.reduce(
    (total, requirement) => total + requirement.contribution,
    0,
  );
  const maximumPoints = requirements.reduce(
    (total, requirement) => total + requirement.weight,
    0,
  );
  const percentage =
    maximumPoints === 0 ? 0 : (currentPoints / maximumPoints) * 100;

  return { currentPoints, maximumPoints, percentage };
}

function formatNumber(value: number, language = "id") {
  return new Intl.NumberFormat(language === "en" ? "en-GB" : "id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function FinalScoreCalculation({
  requirements,
}: FinalScoreCalculationProps) {
  const { t, language } = useI18n();
  const { currentPoints, maximumPoints, percentage } =
    calculateExampleScore(requirements);

  return (
    <div
      className="final-equation"
      aria-label={t("Rincian perhitungan skor akhir")}
    >
      <div>
        <small>{t("Total poin saat ini")}</small>
        <strong>{formatNumber(currentPoints, language)}</strong>
      </div>
      <span aria-hidden="true">÷</span>
      <div>
        <small>{t("Total poin maksimum")}</small>
        <strong>{formatNumber(maximumPoints, language)}</strong>
      </div>
      <span aria-hidden="true">×</span>
      <div>
        <small>{t("Persentase")}</small>
        <strong>100</strong>
      </div>
      <span aria-hidden="true">=</span>
      <div className="final-score">
        <small>{t("Skor akhir")}</small>
        <strong>{formatNumber(percentage, language)}%</strong>
      </div>
    </div>
  );
}
