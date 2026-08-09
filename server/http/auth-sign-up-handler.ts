export type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};

export type SafeAuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
};

type SignUpActionResult =
  | {
      status: "ok";
      data: {
        user: SafeAuthUser | null;
        requireEmailVerification: boolean;
      };
    }
  | {
      status: "error";
      error: {
        code: string;
        message: string;
        statusCode?: number;
      };
    };

export type SignUpAction = (input: SignUpInput) => Promise<SignUpActionResult>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSignUpInput(value: unknown): SignUpInput | null {
  if (!isRecord(value)) return null;

  const email = typeof value.email === "string"
    ? value.email.trim().toLocaleLowerCase("id-ID")
    : "";
  const password = typeof value.password === "string" ? value.password : "";
  const name = typeof value.name === "string"
    ? value.name.trim().replace(/\s+/g, " ")
    : undefined;

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) return null;
  if (name !== undefined && name.length < 2) return null;

  return { email, password, ...(name ? { name } : {}) };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function safeErrorStatus(statusCode: number | undefined) {
  if (statusCode && statusCode >= 400 && statusCode < 500) return statusCode;
  return 502;
}

export function createSignUpHandler(signUp: SignUpAction) {
  return async function POST(request: Request) {
    const input = parseSignUpInput(await readJson(request));
    if (!input) {
      return Response.json(
        {
          error: {
            code: "INVALID_SIGN_UP",
            message: "Masukkan email valid dan kata sandi minimal 6 karakter.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const result = await signUp(input);
      if (result.status === "error") {
        return Response.json(
          { error: { code: result.error.code, message: result.error.message } },
          { status: safeErrorStatus(result.error.statusCode) },
        );
      }

      return Response.json(
        {
          data: {
            user: result.data.user,
            requireEmailVerification: result.data.requireEmailVerification,
          },
        },
        { status: 201 },
      );
    } catch {
      return Response.json(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Pendaftaran akun belum tersedia. Coba lagi.",
          },
        },
        { status: 503 },
      );
    }
  };
}
