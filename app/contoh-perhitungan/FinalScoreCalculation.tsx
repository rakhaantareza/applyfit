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

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function FinalScoreCalculation({
  requirements,
}: FinalScoreCalculationProps) {
  const { currentPoints, maximumPoints, percentage } =
    calculateExampleScore(requirements);

  return (
    <div className="final-equation" aria-label="Rincian perhitungan skor akhir">
      <div>
        <small>Total poin saat ini</small>
        <strong>{formatNumber(currentPoints)}</strong>
      </div>
      <span aria-hidden="true">÷</span>
      <div>
        <small>Total poin maksimum</small>
        <strong>{formatNumber(maximumPoints)}</strong>
      </div>
      <span aria-hidden="true">×</span>
      <div>
        <small>Persentase</small>
        <strong>100</strong>
      </div>
      <span aria-hidden="true">=</span>
      <div className="final-score">
        <small>Skor akhir</small>
        <strong>{formatNumber(percentage)}%</strong>
      </div>
    </div>
  );
}
