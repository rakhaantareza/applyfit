import {
  calculateFitScore,
  type FitRequirementInput,
  type RequirementMappingState,
  type RequirementPriority,
  type RequirementStatus,
  type RequirementType,
  type SkillStatus,
  withDerivedRequirementStatus,
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
const SKILL_STATUSES = new Set<SkillStatus>(["active", "learning"]);

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

function parseMapping(
  value: unknown,
  requirementIndex: number,
  mappingIndex: number,
): RequirementMappingState | string {
  const path = `requirements[${requirementIndex}].mappings[${mappingIndex}]`;
  if (!isRecord(value)) return `${path} harus berupa objek.`;

  const { skill, linkedEvidenceIds } = value;
  if (!Array.isArray(linkedEvidenceIds)) {
    return `${path}.linkedEvidenceIds harus berupa array.`;
  }

  const normalizedEvidenceIds: string[] = [];
  for (const [evidenceIndex, evidenceId] of linkedEvidenceIds.entries()) {
    if (typeof evidenceId !== "string" || evidenceId.trim() === "") {
      return `${path}.linkedEvidenceIds[${evidenceIndex}] wajib berupa string.`;
    }
    normalizedEvidenceIds.push(evidenceId.trim());
  }

  if (skill === null) {
    if (normalizedEvidenceIds.length > 0) {
      return `${path} tanpa skill tidak boleh memiliki evidence.`;
    }
    return { skill: null, linkedEvidenceIds: [] };
  }

  if (!isRecord(skill)) return `${path}.skill harus berupa objek atau null.`;
  if (typeof skill.id !== "string" || skill.id.trim() === "") {
    return `${path}.skill.id wajib diisi.`;
  }
  if (
    typeof skill.status !== "string" ||
    !SKILL_STATUSES.has(skill.status as SkillStatus)
  ) {
    return `${path}.skill.status tidak valid.`;
  }

  return {
    skill: {
      id: skill.id.trim(),
      status: skill.status as SkillStatus,
    },
    linkedEvidenceIds: [...new Set(normalizedEvidenceIds)],
  };
}

function parseRequirement(
  value: unknown,
  index: number,
): RequirementValidationResult {
  if (!isRecord(value)) {
    return { ok: false, message: `requirements[${index}] harus berupa objek.` };
  }

  const { id, type, priority, mappings } = value;
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
  if (!Array.isArray(mappings)) {
    return { ok: false, message: `requirements[${index}].mappings harus berupa array.` };
  }

  const parsedMappings: RequirementMappingState[] = [];
  for (const [mappingIndex, mapping] of mappings.entries()) {
    const parsedMapping = parseMapping(mapping, index, mappingIndex);
    if (typeof parsedMapping === "string") {
      return { ok: false, message: parsedMapping };
    }
    parsedMappings.push(parsedMapping);
  }

  return {
    ok: true,
    value: withDerivedRequirementStatus({
      id: id.trim(),
      type: type as RequirementType,
      priority: priority as RequirementPriority,
      mappings: parsedMappings,
    }),
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
    if (requirement.type !== "skill" && requirement.type !== "tool") continue;
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
