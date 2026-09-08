import {
  CareerProfileRequiredError,
  SkillConflictError,
  SkillNotFoundError,
  SkillQueryError,
  type CreateSkillInput,
  type Skill,
  type SkillStatus,
  type UpdateSkillInput,
} from "../services/skills.ts";

type AuthResult<T> = { status: "unauthenticated" } | { status: "ok"; data: T };

type SkillListOptions = {
  includeEvidenceCount?: boolean;
};

export type SkillsActions = {
  list: (
    options?: SkillListOptions,
  ) => Promise<AuthResult<Array<Skill & { evidenceCount?: number }>>>;
  create: (input: CreateSkillInput) => Promise<AuthResult<Skill>>;
  update: (skillId: string, input: UpdateSkillInput) => Promise<AuthResult<Skill>>;
  remove: (skillId: string) => Promise<AuthResult<null>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSkillStatus(value: unknown): value is SkillStatus {
  return value === "active" || value === "learning";
}

function parseLevel(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const level = value.trim();
  return level || null;
}

function parseCreateInput(value: unknown): CreateSkillInput | null {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const level = parseLevel(value.level);
  const catalogSkillId = parseOptionalId(value.catalogSkillId);
  if (!name || !isSkillStatus(value.status) || level === undefined || catalogSkillId === undefined) return null;
  return { name, catalogSkillId, status: value.status, level };
}

function parseUpdateInput(value: unknown): UpdateSkillInput | null {
  if (!isRecord(value)) return null;
  const input: UpdateSkillInput = {};

  if ("name" in value) {
    if (typeof value.name !== "string" || !value.name.trim()) return null;
    input.name = value.name.trim();
  }
  if ("catalogSkillId" in value) {
    const catalogSkillId = parseOptionalId(value.catalogSkillId);
    if (catalogSkillId === undefined || !("name" in value)) return null;
    input.catalogSkillId = catalogSkillId;
  }
  if ("status" in value) {
    if (!isSkillStatus(value.status)) return null;
    input.status = value.status;
  }
  if ("level" in value) {
    const level = parseLevel(value.level);
    if (level === undefined) return null;
    input.level = level;
  }

  return Object.keys(input).length > 0 ? input : null;
}

function parseOptionalId(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.trim();
}

function unauthenticatedResponse() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengelola skill." } },
    { status: 401 },
  );
}

function actionErrorResponse(error: unknown) {
  if (error instanceof CareerProfileRequiredError) {
    return Response.json(
      { error: { code: "CAREER_PROFILE_REQUIRED", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof SkillConflictError) {
    return Response.json(
      { error: { code: "SKILL_ALREADY_EXISTS", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof SkillNotFoundError) {
    return Response.json(
      { error: { code: "SKILL_NOT_FOUND", message: error.message } },
      { status: 404 },
    );
  }
  if (error instanceof SkillQueryError) {
    return Response.json(
      { error: { code: "SKILLS_UNAVAILABLE", message: error.message } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan skill belum tersedia." } },
    { status: 503 },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function createSkillsHandlers(actions: SkillsActions) {
  async function GET(
    request = new Request("http://localhost/api/career-profile/skills"),
  ) {
    try {
      const includeEvidenceCount =
        new URL(request.url).searchParams.get("includeEvidenceCount") === "true";
      const result = await actions.list({ includeEvidenceCount });
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { skills: result.data, total: result.data.length } });
    } catch (error) {
      return actionErrorResponse(error);
    }
  }

  async function POST(request: Request) {
    const input = parseCreateInput(await readJson(request));
    if (!input) {
      return Response.json(
        { error: { code: "INVALID_SKILL", message: "Nama, status, dan level skill tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.create(input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { skill: result.data } }, { status: 201 });
    } catch (error) {
      return actionErrorResponse(error);
    }
  }

  async function PATCH(request: Request, skillId: string) {
    const input = parseUpdateInput(await readJson(request));
    if (!skillId || !input) {
      return Response.json(
        { error: { code: "INVALID_SKILL", message: "Perubahan skill tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.update(skillId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { skill: result.data } });
    } catch (error) {
      return actionErrorResponse(error);
    }
  }

  async function DELETE(skillId: string) {
    if (!skillId) {
      return Response.json(
        { error: { code: "INVALID_SKILL", message: "ID skill tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.remove(skillId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return new Response(null, { status: 204 });
    } catch (error) {
      return actionErrorResponse(error);
    }
  }

  return { GET, POST, PATCH, DELETE };
}
