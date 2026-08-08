import {
  calculateFitScore,
  type FitRequirementInput,
  type RequirementMappingState,
  type RequirementPriority,
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
const EVIDENCE_TYPES = new Set([
  "project",
  "cert",
  "work",
  "internship",
  "github",
  "portfolio",
] as const);

type EvidenceType = typeof EVIDENCE_TYPES extends Set<infer Value> ? Value : never;

type EvidenceInput = {
  id: string;
  title: string;
  type: EvidenceType;
  url: string | null;
};

type RequirementDetailInput = FitRequirementInput & {
  name: string;
  evidences: EvidenceInput[];
};

type RequirementListRequest = {
  jobId: string;
  requirements: RequirementDetailInput[];
};

type ValidationResult =
  | { ok: true; value: RequirementListRequest }
  | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEvidence(
  value: unknown,
  requirementIndex: number,
  evidenceIndex: number,
): EvidenceInput | string {
  const path = `requirements[${requirementIndex}].evidences[${evidenceIndex}]`;
  if (!isRecord(value)) return `${path} harus berupa objek.`;

  const { id, title, type, url } = value;
  if (typeof id !== "string" || id.trim() === "") return `${path}.id wajib diisi.`;
  if (typeof title !== "string" || title.trim() === "") {
    return `${path}.title wajib diisi.`;
  }
  if (typeof type !== "string" || !EVIDENCE_TYPES.has(type as EvidenceType)) {
    return `${path}.type tidak valid.`;
  }
  if (url !== undefined && url !== null && typeof url !== "string") {
    return `${path}.url harus berupa string atau null.`;
  }

  return {
    id: id.trim(),
    title: title.trim(),
    type: type as EvidenceType,
    url: typeof url === "string" && url.trim() !== "" ? url.trim() : null,
  };
}

function parsePayload(payload: unknown): ValidationResult {
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

  const parsedRequirements: RequirementDetailInput[] = [];
  const requirementIds = new Set<string>();

  for (const [index, value] of requirements.entries()) {
    const path = `requirements[${index}]`;
    if (!isRecord(value)) return { ok: false, message: `${path} harus berupa objek.` };

    const { id, name, type, priority, mappings } = value;
    if (typeof id !== "string" || id.trim() === "") {
      return { ok: false, message: `${path}.id wajib diisi.` };
    }
    const normalizedId = id.trim();
    if (requirementIds.has(normalizedId)) {
      return { ok: false, message: `${path}.id tidak boleh duplikat.` };
    }
    if (typeof name !== "string" || name.trim() === "") {
      return { ok: false, message: `${path}.name wajib diisi.` };
    }
    if (typeof type !== "string" || !REQUIREMENT_TYPES.has(type as RequirementType)) {
      return { ok: false, message: `${path}.type tidak valid.` };
    }
    if (
      typeof priority !== "string" ||
      !REQUIREMENT_PRIORITIES.has(priority as RequirementPriority)
    ) {
      return { ok: false, message: `${path}.priority tidak valid.` };
    }
    if (!Array.isArray(mappings)) {
      return { ok: false, message: `${path}.mappings harus berupa array.` };
    }

    const parsedMappings: RequirementMappingState[] = [];
    const evidenceById = new Map<string, EvidenceInput>();
    for (const [mappingIndex, mapping] of mappings.entries()) {
      const mappingPath = `${path}.mappings[${mappingIndex}]`;
      if (!isRecord(mapping)) {
        return { ok: false, message: `${mappingPath} harus berupa objek.` };
      }

      const { skill, evidences } = mapping;
      if (!Array.isArray(evidences)) {
        return { ok: false, message: `${mappingPath}.evidences harus berupa array.` };
      }

      const parsedEvidences: EvidenceInput[] = [];
      for (const [evidenceIndex, evidence] of evidences.entries()) {
        const parsedEvidence = parseEvidence(evidence, index, evidenceIndex);
        if (typeof parsedEvidence === "string") {
          return { ok: false, message: parsedEvidence };
        }
        parsedEvidences.push(parsedEvidence);
        evidenceById.set(parsedEvidence.id, parsedEvidence);
      }

      if (skill === null) {
        if (parsedEvidences.length > 0) {
          return {
            ok: false,
            message: `${mappingPath} tanpa skill tidak boleh memiliki evidence.`,
          };
        }
        parsedMappings.push({ skill: null, linkedEvidenceIds: [] });
        continue;
      }

      if (!isRecord(skill)) {
        return {
          ok: false,
          message: `${mappingPath}.skill harus berupa objek atau null.`,
        };
      }
      if (typeof skill.id !== "string" || skill.id.trim() === "") {
        return { ok: false, message: `${mappingPath}.skill.id wajib diisi.` };
      }
      if (
        typeof skill.status !== "string" ||
        !SKILL_STATUSES.has(skill.status as SkillStatus)
      ) {
        return {
          ok: false,
          message: `${mappingPath}.skill.status tidak valid.`,
        };
      }

      parsedMappings.push({
        skill: {
          id: skill.id.trim(),
          status: skill.status as SkillStatus,
        },
        linkedEvidenceIds: parsedEvidences.map((evidence) => evidence.id),
      });
    }

    const derivedRequirement = withDerivedRequirementStatus({
      id: normalizedId,
      type: type as RequirementType,
      priority: priority as RequirementPriority,
      mappings: parsedMappings,
    });

    requirementIds.add(normalizedId);
    parsedRequirements.push({
      ...derivedRequirement,
      name: name.trim(),
      evidences: [...evidenceById.values()],
    });
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

  const parsed = parsePayload(payload);
  if (!parsed.ok) {
    return Response.json(
      { error: { code: "INVALID_PAYLOAD", message: parsed.message } },
      { status: 400 },
    );
  }

  const score = calculateFitScore(parsed.value.requirements);
  const scoreByRequirementId = new Map(
    score.breakdown.map((requirement) => [requirement.id, requirement]),
  );

  return Response.json({
    data: {
      jobId: parsed.value.jobId,
      requirements: parsed.value.requirements.map((requirement) => {
        const breakdown = scoreByRequirementId.get(requirement.id);
        if (!breakdown) throw new Error("Score breakdown tidak lengkap.");

        return {
          id: requirement.id,
          name: requirement.name,
          type: requirement.type,
          priority: requirement.priority,
          status: requirement.status,
          isInformational: !breakdown.includedInScore,
          evidences: requirement.evidences,
          points: breakdown.includedInScore
            ? {
                weight: breakdown.weight,
                multiplier: breakdown.multiplier,
                earned: breakdown.earned,
                maximum: breakdown.maximum,
              }
            : null,
        };
      }),
    },
  });
}
