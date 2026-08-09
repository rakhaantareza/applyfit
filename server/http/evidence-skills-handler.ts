import {
  EvidenceSkillConflictError,
  EvidenceSkillLinkNotFoundError,
  EvidenceSkillQueryError,
  EvidenceSkillTargetNotFoundError,
  type EvidenceSkillLink,
} from "../services/evidence-skills.ts";
import { CareerProfileRequiredError } from "../services/skills.ts";

type AuthResult<T> = { status: "unauthenticated" } | { status: "ok"; data: T };

export type EvidenceSkillActions = {
  list: (evidenceId: string) => Promise<AuthResult<EvidenceSkillLink[]>>;
  link: (evidenceId: string, skillId: string) => Promise<AuthResult<EvidenceSkillLink>>;
  unlink: (evidenceId: string, skillId: string) => Promise<AuthResult<null>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unauthenticatedResponse() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk menghubungkan bukti dan skill." } },
    { status: 401 },
  );
}

function errorResponse(error: unknown) {
  if (error instanceof CareerProfileRequiredError) {
    return Response.json(
      { error: { code: "CAREER_PROFILE_REQUIRED", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof EvidenceSkillTargetNotFoundError) {
    return Response.json(
      { error: { code: "EVIDENCE_SKILL_TARGET_NOT_FOUND", message: error.message } },
      { status: 404 },
    );
  }
  if (error instanceof EvidenceSkillLinkNotFoundError) {
    return Response.json(
      { error: { code: "EVIDENCE_SKILL_LINK_NOT_FOUND", message: error.message } },
      { status: 404 },
    );
  }
  if (error instanceof EvidenceSkillConflictError) {
    return Response.json(
      { error: { code: "EVIDENCE_SKILL_ALREADY_LINKED", message: error.message } },
      { status: 409 },
    );
  }
  if (error instanceof EvidenceSkillQueryError) {
    return Response.json(
      { error: { code: "EVIDENCE_SKILLS_UNAVAILABLE", message: error.message } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan relasi bukti dan skill belum tersedia." } },
    { status: 503 },
  );
}

async function readSkillId(request: Request): Promise<string | null> {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value) || typeof value.skillId !== "string") return null;
    return value.skillId.trim() || null;
  } catch {
    return null;
  }
}

export function createEvidenceSkillHandlers(actions: EvidenceSkillActions) {
  async function GET(evidenceId: string) {
    if (!evidenceId) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE_SKILL", message: "ID bukti tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.list(evidenceId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { links: result.data, total: result.data.length } });
    } catch (error) { return errorResponse(error); }
  }

  async function POST(request: Request, evidenceId: string) {
    const skillId = await readSkillId(request);
    if (!evidenceId || !skillId) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE_SKILL", message: "ID bukti dan skill perlu diisi." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.link(evidenceId, skillId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { link: result.data } }, { status: 201 });
    } catch (error) { return errorResponse(error); }
  }

  async function DELETE(evidenceId: string, skillId: string) {
    if (!evidenceId || !skillId) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE_SKILL", message: "ID bukti dan skill perlu diisi." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.unlink(evidenceId, skillId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return new Response(null, { status: 204 });
    } catch (error) { return errorResponse(error); }
  }

  return { GET, POST, DELETE };
}
