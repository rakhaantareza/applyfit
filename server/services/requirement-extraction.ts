import OpenAI from "openai";

export type RequirementType = "skill" | "tool" | "education" | "experience";
export type RequirementPriority = "required" | "preferred";

export type ExtractedRequirement = {
  name: string;
  type: RequirementType;
  priority: RequirementPriority;
};

export type RequirementExtractionResult = {
  requirements: ExtractedRequirement[];
  model: string;
};

export class RequirementExtractionError extends Error {
  constructor() {
    super("Syarat lowongan belum dapat diekstrak.");
    this.name = "RequirementExtractionError";
  }
}

export class EmptyJobDescriptionError extends Error {
  constructor() {
    super("Tambahkan deskripsi lowongan sebelum mengekstrak syarat.");
    this.name = "EmptyJobDescriptionError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequirementType(value: unknown): value is RequirementType {
  return value === "skill" || value === "tool" || value === "education" || value === "experience";
}

function isRequirementPriority(value: unknown): value is RequirementPriority {
  return value === "required" || value === "preferred";
}

export function parseExtractedRequirements(value: unknown): ExtractedRequirement[] {
  if (!isRecord(value) || !Array.isArray(value.requirements)) {
    throw new RequirementExtractionError();
  }

  const seen = new Set<string>();
  return value.requirements.flatMap((item) => {
    if (!isRecord(item)) throw new RequirementExtractionError();
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name || !isRequirementType(item.type) || !isRequirementPriority(item.priority)) {
      throw new RequirementExtractionError();
    }
    const key = `${item.type}:${item.priority}:${name.toLocaleLowerCase("id-ID")}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ name, type: item.type, priority: item.priority }];
  });
}

const REQUIREMENT_SCHEMA = {
  name: "applyfit_job_requirements",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      requirements: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string", description: "Satu syarat lowongan yang ringkas dan spesifik." },
            type: { type: "string", enum: ["skill", "tool", "education", "experience"] },
            priority: { type: "string", enum: ["required", "preferred"] },
          },
          required: ["name", "type", "priority"],
        },
      },
    },
    required: ["requirements"],
  },
} as const;

export async function extractRequirementsFromDescription(
  rawDescription: string,
): Promise<RequirementExtractionResult> {
  const description = rawDescription.trim();
  if (!description) throw new EmptyJobDescriptionError();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new RequirementExtractionError();
  const model = process.env.OPENROUTER_CHAT_MODEL ?? "openai/gpt-4o-mini";
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Ekstrak hanya syarat eksplisit dari job description. Pisahkan menjadi skill, tool, education, atau experience. Gunakan required hanya untuk syarat wajib dan preferred hanya untuk nilai tambah. Jangan menambah rekomendasi, inferred skill, status kecocokan, atau keputusan apakah pengguna sebaiknya melamar. Hasil ini adalah draft yang wajib direview pengguna.",
        },
        { role: "user", content: description },
      ],
      response_format: { type: "json_schema", json_schema: REQUIREMENT_SCHEMA },
      temperature: 0,
      max_completion_tokens: 1400,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new RequirementExtractionError();
    return {
      requirements: parseExtractedRequirements(JSON.parse(content)),
      model: completion.model || model,
    };
  } catch (error) {
    if (error instanceof EmptyJobDescriptionError) throw error;
    throw new RequirementExtractionError();
  }
}
