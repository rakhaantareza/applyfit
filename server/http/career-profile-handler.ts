import {
  CareerProfileQueryError,
  type CareerProfile,
  type CareerTargetInput,
} from "../services/career-profile.ts";

export type CareerProfileResult =
  | { status: "unauthenticated" }
  | { status: "ok"; profile: CareerProfile | null };

export type CareerProfileUpdateResult =
  | { status: "unauthenticated" }
  | { status: "ok"; profile: CareerProfile };

export type CareerProfileLoader = () => Promise<CareerProfileResult>;
export type CareerProfileUpdater = (
  input: CareerTargetInput,
) => Promise<CareerProfileUpdateResult>;

function unauthenticatedResponse() {
  return Response.json(
    {
      error: {
        code: "UNAUTHENTICATED",
        message: "Silakan masuk untuk mengelola profil karier.",
      },
    },
    { status: 401 },
  );
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof CareerProfileQueryError) {
    return Response.json(
      {
        error: {
          code: "CAREER_PROFILE_UNAVAILABLE",
          message: error.message,
        },
      },
      { status: 502 },
    );
  }

  return Response.json(
    {
      error: {
        code: "INSFORGE_UNAVAILABLE",
        message: "Layanan profil karier belum tersedia.",
      },
    },
    { status: 503 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCareerTarget(value: unknown): CareerTargetInput | null {
  if (!isRecord(value)) return null;

  const targetRole =
    typeof value.targetRole === "string" ? value.targetRole.trim() : "";
  const careerField =
    typeof value.careerField === "string" ? value.careerField.trim() : "";

  if (!targetRole || !careerField) return null;

  return { targetRole, careerField };
}

export function createCareerProfileHandlers(
  loadProfile: CareerProfileLoader,
  updateProfile: CareerProfileUpdater,
) {
  async function GET() {
    try {
      const result = await loadProfile();
      if (result.status === "unauthenticated") {
        return unauthenticatedResponse();
      }

      return Response.json({ data: { profile: result.profile } });
    } catch (error) {
      return serviceErrorResponse(error);
    }
  }

  async function PATCH(request: Request) {
    let input: CareerTargetInput | null = null;
    try {
      input = parseCareerTarget(await request.json());
    } catch {
      input = null;
    }

    if (!input) {
      return Response.json(
        {
          error: {
            code: "INVALID_CAREER_TARGET",
            message: "Target role dan bidang karier perlu diisi.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const result = await updateProfile(input);
      if (result.status === "unauthenticated") {
        return unauthenticatedResponse();
      }

      return Response.json({ data: { profile: result.profile } });
    } catch (error) {
      return serviceErrorResponse(error);
    }
  }

  return { GET, PATCH };
}
