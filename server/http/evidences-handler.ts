import {
  EvidenceNotFoundError,
  EvidenceQueryError,
  type CreateEvidenceInput,
  type Evidence,
  type EvidenceFilters,
  type EvidenceType,
  type UpdateEvidenceInput,
} from "../services/evidences.ts";
import { CareerProfileRequiredError } from "../services/skills.ts";

type AuthResult<T> = { status: "unauthenticated" } | { status: "ok"; data: T };

export type EvidenceActions = {
  list: (filters: EvidenceFilters) => Promise<AuthResult<Evidence[]>>;
  create: (input: CreateEvidenceInput) => Promise<AuthResult<Evidence>>;
  update: (evidenceId: string, input: UpdateEvidenceInput) => Promise<AuthResult<Evidence>>;
  remove: (evidenceId: string) => Promise<AuthResult<null>>;
};

const EVIDENCE_TYPES = new Set<EvidenceType>([
  "project", "cert", "work", "internship", "github", "portfolio",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEvidenceType(value: unknown): value is EvidenceType {
  return typeof value === "string" && EVIDENCE_TYPES.has(value as EvidenceType);
}

function parseFilters(request: Request): EvidenceFilters | null {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || undefined;
  const typeValue = url.searchParams.get("type")?.trim() || undefined;
  const skillId = url.searchParams.get("skillId")?.trim() || undefined;
  if (typeValue && !isEvidenceType(typeValue)) return null;
  return { query, type: typeValue, skillId };
}

function parseOptionalUrl(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function parseCreateInput(value: unknown): CreateEvidenceInput | null {
  if (!isRecord(value)) return null;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  const description =
    typeof value.description === "string" ? value.description.trim() : "";
  const url = parseOptionalUrl(value.url);
  if (!title || !description || !isEvidenceType(value.type) || url === undefined) {
    return null;
  }
  return { title, type: value.type, url, description };
}

function parseUpdateInput(value: unknown): UpdateEvidenceInput | null {
  if (!isRecord(value)) return null;
  const input: UpdateEvidenceInput = {};

  if ("title" in value) {
    if (typeof value.title !== "string" || !value.title.trim()) return null;
    input.title = value.title.trim();
  }
  if ("description" in value) {
    if (typeof value.description !== "string" || !value.description.trim()) return null;
    input.description = value.description.trim();
  }
  if ("type" in value) {
    if (!isEvidenceType(value.type)) return null;
    input.type = value.type;
  }
  if ("url" in value) {
    const url = parseOptionalUrl(value.url);
    if (url === undefined) return null;
    input.url = url;
  }

  return Object.keys(input).length ? input : null;
}

function unauthenticatedResponse() {
  return Response.json(
    { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk mengelola bukti." } },
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
  if (error instanceof EvidenceNotFoundError) {
    return Response.json(
      { error: { code: "EVIDENCE_NOT_FOUND", message: error.message } },
      { status: 404 },
    );
  }
  if (error instanceof EvidenceQueryError) {
    return Response.json(
      { error: { code: "EVIDENCES_UNAVAILABLE", message: error.message } },
      { status: 502 },
    );
  }
  return Response.json(
    { error: { code: "INSFORGE_UNAVAILABLE", message: "Layanan bukti belum tersedia." } },
    { status: 503 },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

export function createEvidenceHandlers(actions: EvidenceActions) {
  async function GET(
    request = new Request("http://localhost/api/evidences"),
  ) {
    const filters = parseFilters(request);
    if (!filters) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE_FILTER", message: "Filter jenis bukti tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.list(filters);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({
        data: { evidences: result.data, total: result.data.length },
        filters,
      });
    } catch (error) { return errorResponse(error); }
  }

  async function POST(request: Request) {
    const input = parseCreateInput(await readJson(request));
    if (!input) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE", message: "Judul, jenis, dan deskripsi bukti tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.create(input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { evidence: result.data } }, { status: 201 });
    } catch (error) { return errorResponse(error); }
  }

  async function PATCH(request: Request, evidenceId: string) {
    const input = parseUpdateInput(await readJson(request));
    if (!evidenceId || !input) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE", message: "Perubahan bukti tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.update(evidenceId, input);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return Response.json({ data: { evidence: result.data } });
    } catch (error) { return errorResponse(error); }
  }

  async function DELETE(evidenceId: string) {
    if (!evidenceId) {
      return Response.json(
        { error: { code: "INVALID_EVIDENCE", message: "ID bukti tidak valid." } },
        { status: 400 },
      );
    }
    try {
      const result = await actions.remove(evidenceId);
      if (result.status === "unauthenticated") return unauthenticatedResponse();
      return new Response(null, { status: 204 });
    } catch (error) { return errorResponse(error); }
  }

  return { GET, POST, PATCH, DELETE };
}
