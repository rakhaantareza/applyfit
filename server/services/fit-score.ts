export const PRIORITY_WEIGHTS = {
  required: 3,
  preferred: 1,
} as const;

export const STATUS_MULTIPLIERS = {
  proven: 100,
  partial: 50,
  learning: 20,
  missing: 0,
} as const;

export type RequirementType = "skill" | "tool" | "education" | "experience";
export type RequirementPriority = keyof typeof PRIORITY_WEIGHTS;
export type RequirementStatus = keyof typeof STATUS_MULTIPLIERS;

export type FitRequirementInput = {
  id: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
};

type IncludedRequirementBreakdown = FitRequirementInput & {
  includedInScore: true;
  weight: (typeof PRIORITY_WEIGHTS)[RequirementPriority];
  multiplier: (typeof STATUS_MULTIPLIERS)[RequirementStatus];
  earned: number;
  maximum: number;
};

type ExcludedRequirementBreakdown = FitRequirementInput & {
  includedInScore: false;
  exclusionReason: "unsupported_requirement_type";
  weight: null;
  multiplier: null;
  earned: 0;
  maximum: 0;
};

export type RequirementScoreBreakdown =
  | IncludedRequirementBreakdown
  | ExcludedRequirementBreakdown;

export type FitScoreResult = {
  score: number;
  currentPoints: number;
  maximumPoints: number;
  includedRequirementCount: number;
  excludedRequirementCount: number;
  breakdown: RequirementScoreBreakdown[];
};

function roundToSingleDecimal(value: number) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

function isScoreableRequirement(type: RequirementType) {
  return type === "skill" || type === "tool";
}

export function calculateFitScore(
  requirements: readonly FitRequirementInput[],
): FitScoreResult {
  const breakdown = requirements.map<RequirementScoreBreakdown>((requirement) => {
    if (!isScoreableRequirement(requirement.type)) {
      return {
        ...requirement,
        includedInScore: false,
        exclusionReason: "unsupported_requirement_type",
        weight: null,
        multiplier: null,
        earned: 0,
        maximum: 0,
      };
    }

    const weight = PRIORITY_WEIGHTS[requirement.priority];
    const multiplier = STATUS_MULTIPLIERS[requirement.status];

    return {
      ...requirement,
      includedInScore: true,
      weight,
      multiplier,
      earned: roundToSingleDecimal(weight * (multiplier / 100)),
      maximum: weight,
    };
  });

  const currentPoints = roundToSingleDecimal(
    breakdown.reduce((total, requirement) => total + requirement.earned, 0),
  );
  const maximumPoints = breakdown.reduce(
    (total, requirement) => total + requirement.maximum,
    0,
  );
  const includedRequirementCount = breakdown.filter(
    (requirement) => requirement.includedInScore,
  ).length;

  return {
    score:
      maximumPoints === 0
        ? 0
        : roundToSingleDecimal((currentPoints / maximumPoints) * 100),
    currentPoints,
    maximumPoints,
    includedRequirementCount,
    excludedRequirementCount: breakdown.length - includedRequirementCount,
    breakdown,
  };
}
