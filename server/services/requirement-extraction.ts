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

const COMPETENCY_STATEMENT_PATTERNS = [
  /\bexperience\s+(?:working\s+)?with\b/i,
  /\bexperience\s+(?:in\s+)?using\b/i,
  /\b(?:knowledge|understanding)\s+of\b/i,
  /\bfamili(?:ar\s+with|arity\s+with)\b/i,
  /\bpengalaman\s+(?:bekerja\s+)?dengan\b/i,
  /\bpengalaman\s+menggunakan\b/i,
  /\bpengetahuan\s+(?:mengenai|tentang)\b/i,
  /\bfamiliar\s+dengan\b/i,
] as const;

const EXPERIENCE_DURATION_PATTERN =
  /\b(?:\d+(?:[.,]\d+)?\s*\+?|one|two|three|four|five|six|seven|eight|nine|ten|several|multiple|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|beberapa)\s*(?:years?|yrs?|months?|tahun|bulan)\b/i;

const EXPERIENCE_CONTEXT_PATTERN =
  /\b(?:industry|sector|domain|market|professional environment|industri|sektor|ranah|pasar|lingkungan profesional)\b/i;

function classifyRequirementByMeaning(
  name: string,
  proposedType: RequirementType,
): RequirementType {
  // Keep the model's skill/tool distinction. This safeguard only prevents
  // competency-shaped statements from becoming non-scoreable context.
  if (proposedType === "skill" || proposedType === "tool") return proposedType;
  if (EXPERIENCE_DURATION_PATTERN.test(name) || EXPERIENCE_CONTEXT_PATTERN.test(name)) {
    return proposedType;
  }

  return COMPETENCY_STATEMENT_PATTERNS.some((pattern) => pattern.test(name))
    ? "skill"
    : proposedType;
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
    const type = classifyRequirementByMeaning(name, item.type);
    const key = `${type}:${item.priority}:${name.toLocaleLowerCase("id-ID")}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ name, type, priority: item.priority }];
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
            type: {
              type: "string",
              enum: ["skill", "tool", "education", "experience"],
              description:
                "Klasifikasikan makna syaratnya: skill/tool untuk kompetensi atau teknologi yang harus dikuasai; education untuk pendidikan formal; experience hanya untuk durasi, riwayat, peran, atau konteks/domain kerja.",
            },
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
            "Ekstrak hanya syarat eksplisit dari job description. Klasifikasikan berdasarkan hal yang dinilai, bukan kata pembukanya. Kemampuan atau penguasaan teknis adalah skill/tool walaupun ditulis sebagai 'experience with', 'experience using', 'knowledge of', atau 'familiar with'. Contoh: 'Experience with React', 'Experience using TypeScript', dan 'Experience working with REST APIs' adalah skill/tool; 'Knowledge of PostgreSQL' dan 'Familiar with Docker' juga skill/tool. Gunakan experience hanya untuk durasi atau konteks riwayat kerja, misalnya '3+ years of professional experience' atau pengalaman dalam industri/domain tertentu. Gunakan education untuk pendidikan formal. Gunakan required hanya untuk syarat wajib dan preferred hanya untuk nilai tambah. Jangan menambah rekomendasi, inferred skill, status kecocokan, atau keputusan apakah pengguna sebaiknya melamar. Hasil ini adalah draft yang wajib direview pengguna.",
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
