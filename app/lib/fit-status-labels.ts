import type { RequirementStatus } from "../types/fit-analysis";

export const requirementStatusLabels: Record<RequirementStatus, string> = {
  Proven: "Terbukti",
  Partial: "Belum terbukti",
  Learning: "Sedang dipelajari",
  Missing: "Belum ada kecocokan",
};

export const fitScoreStatusLabels = {
  proven: "Terbukti",
  partial: "Belum terbukti",
  learning: "Sedang dipelajari",
  missing: "Belum ada kecocokan",
} as const;
