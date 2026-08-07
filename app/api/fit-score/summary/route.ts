import {
  calculateFitScore,
  type FitRequirementInput,
  type RequirementPriority,
  type RequirementStatus,
  type RequirementType,
} from "../../../../server/services/fit-score.ts";

const REQUIREMENT_TYPES = new Set<RequirementType>([
  "skill",
  "tool",
  "education",
  "experience",
]);
const REQUIREMENT_PRIORITIES = new Set<RequirementPriority>([
  "required",
  "preferred",
]);
const REQUIREMENT_STATUSES = new Set<RequirementStatus>([
  "proven",
  "partial",
  "learning",
  "missing",
]);

type FitScoreSummaryRequest = {
  jobId: string;
  requirements: FitRequirementInput[];
};

type ValidationResult =
  | { ok: true; value: FitScoreSummaryRequest }
  | { ok: false; message: string };

type RequirementValidationResult =
  | { ok: true; value: FitRequirementInput }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRequirement(
  value: unknown,
  index: number,
): RequirementValidationResult {
  if (!isRecord(value)) {
    return { ok: false, message: `requirements[${index}] harus berupa objek.` };
  }

  const { id, type, priority, status } = value;
  if (typeof id !== "string" || id.trim() === "") {
    return { ok: false, message: `requirements[${index}].id wajib diisi.` };
  }
  if (typeof type !== "string" || !REQUIREMENT_TYPES.has(type as RequirementType)) {
    return { ok: false, message: `requirements[${index}].type tidak valid.` };
  }
  if (
    typeof priority !== "string" ||
    !REQUIREMENT_PRIORITIES.has(priority as RequirementPriority)
  ) {
    return { ok: false, message: `requirements[${index}].priority tidak valid.` };
  }
  if (
    typeof status !== "string" ||
    !REQUIREMENT_STATUSES.has(status as RequirementStatus)
  ) {
    return { ok: false, message: `requirements[${index}].status tidak valid.` };
  }

  return {
    ok: true,
    value: {
      id: id.trim(),
      type: type as RequirementType,
      priority: priority as RequirementPriority,
      status: status as RequirementStatus,
    },
  };
}

function parseRequestPayload(payload: unknown): ValidationResult {
  if (!isRecord(payload)) {
    return { ok: false, message: "Payload harus berupa objek." };
  }

  const { jobId, requirements } = payload;
  if (typeof jobId !== "string" || jobId.trim() === "") {
    return { ok: false, message: "jobId wajib diisi." };
  }
  if (!Array.isArray(requirements)) {
    return { ok: false, message: "requirements harus berupa array." };
  }

  const parsedRequirements: FitRequirementInput[] = [];
  for (const [index, requirement] of requirements.entries()) {
    const parsed = parseRequirement(requirement, index);
    if (!parsed.ok) return parsed;
    parsedRequirements.push(parsed.value);
  }

  return {
    ok: true,
    value: { jobId: jobId.trim(), requirements: parsedRequirements },
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: { code: "INVALID_JSON", message: "Body JSON tidak valid." } },
      { status: 400 },
    );
  }

  const parsed = parseRequestPayload(payload);
  if (!parsed.ok) {
    return Response.json(
      { error: { code: "INVALID_PAYLOAD", message: parsed.message } },
      { status: 400 },
    );
  }

  const result = calculateFitScore(parsed.value.requirements);
  const statusCounts: Record<RequirementStatus, number> = {
    proven: 0,
    partial: 0,
    learning: 0,
    missing: 0,
  };

  for (const requirement of parsed.value.requirements) {
    statusCounts[requirement.status] += 1;
  }

  return Response.json({
    data: {
      jobId: parsed.value.jobId,
      score: result.score,
      currentPoints: result.currentPoints,
      maximumPoints: result.maximumPoints,
      totalRequirements: parsed.value.requirements.length,
      includedRequirements: result.includedRequirementCount,
      excludedRequirements: result.excludedRequirementCount,
      statusCounts,
    },
  });
}
