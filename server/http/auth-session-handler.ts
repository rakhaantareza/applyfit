import type { SafeAuthUser } from "./auth-sign-up-handler.ts";

export type SignInInput = {
  email: string;
  password: string;
};

type AuthActionError = {
  code: string;
  message: string;
  statusCode?: number;
};

type SignInActionResult =
  | { status: "ok"; data: { user: SafeAuthUser } }
  | { status: "error"; error: AuthActionError };

type SignOutActionResult =
  | { status: "ok" }
  | { status: "error"; error: AuthActionError };

export type SignInAction = (input: SignInInput) => Promise<SignInActionResult>;
export type SignOutAction = () => Promise<SignOutActionResult>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSignInInput(value: unknown): SignInInput | null {
  if (!isRecord(value)) return null;
  const email = typeof value.email === "string"
    ? value.email.trim().toLocaleLowerCase("id-ID")
    : "";
  const password = typeof value.password === "string" ? value.password : "";

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) return null;
  return { email, password };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function clientErrorStatus(statusCode: number | undefined, fallback: number) {
  if (statusCode && statusCode >= 400 && statusCode < 500) return statusCode;
  return fallback;
}

export function createSignInHandler(signIn: SignInAction) {
  return async function POST(request: Request) {
    const input = parseSignInInput(await readJson(request));
    if (!input) {
      return Response.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Masukkan email dan kata sandi yang valid.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const result = await signIn(input);
      if (result.status === "error") {
        return Response.json(
          { error: { code: result.error.code, message: result.error.message } },
          { status: clientErrorStatus(result.error.statusCode, 401) },
        );
      }

      return Response.json({ data: { user: result.data.user } });
    } catch {
      return Response.json(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Layanan masuk belum tersedia. Coba lagi.",
          },
        },
        { status: 503 },
      );
    }
  };
}

export function createSignOutHandler(signOut: SignOutAction) {
  return async function POST() {
    try {
      const result = await signOut();
      if (result.status === "error") {
        return Response.json(
          { error: { code: result.error.code, message: result.error.message } },
          { status: clientErrorStatus(result.error.statusCode, 502) },
        );
      }

      return new Response(null, { status: 204 });
    } catch {
      return Response.json(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Sesi belum dapat diakhiri. Coba lagi.",
          },
        },
        { status: 503 },
      );
    }
  };
}
