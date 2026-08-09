type AuthActionError = {
  code?: string;
  message?: string;
  statusCode?: number;
};

type VerifyEmailResult =
  | { status: "ok" }
  | { status: "error"; error?: AuthActionError };

type ResendVerificationResult =
  | { status: "ok" }
  | { status: "error"; error?: AuthActionError };

export type VerifyEmailAction = (input: {
  email: string;
  otp: string;
}) => Promise<VerifyEmailResult>;

export type ResendVerificationAction = (
  email: string,
) => Promise<ResendVerificationResult>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}

function readEmail(value: unknown) {
  if (!isRecord(value) || typeof value.email !== "string") return null;
  const email = value.email.trim().toLocaleLowerCase("id-ID");
  return /^\S+@\S+\.\S+$/.test(email) ? email : null;
}

function safeStatus(statusCode: number | undefined, fallback = 400) {
  return statusCode && statusCode >= 400 && statusCode < 500
    ? statusCode
    : fallback;
}

export function createVerifyEmailHandler(verifyEmail: VerifyEmailAction) {
  return async function POST(request: Request) {
    const value = await readJson(request);
    const email = readEmail(value);
    const otp = isRecord(value) && typeof value.otp === "string"
      ? value.otp.trim()
      : "";

    if (!email || !/^\d{6}$/.test(otp)) {
      return Response.json(
        {
          error: {
            code: "INVALID_VERIFICATION",
            message: "Masukkan email dan kode verifikasi 6 digit yang valid.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const result = await verifyEmail({ email, otp });
      if (result.status === "error") {
        return Response.json(
          {
            error: {
              code: result.error?.code ?? "INVALID_VERIFICATION",
              message: result.error?.message ?? "Kode verifikasi tidak valid atau sudah kedaluwarsa.",
            },
          },
          { status: safeStatus(result.error?.statusCode) },
        );
      }

      return Response.json({ data: { verified: true } });
    } catch {
      return Response.json(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Email belum dapat diverifikasi. Coba lagi.",
          },
        },
        { status: 503 },
      );
    }
  };
}

export function createResendVerificationHandler(
  resendVerification: ResendVerificationAction,
) {
  return async function POST(request: Request) {
    const email = readEmail(await readJson(request));
    if (!email) {
      return Response.json(
        { error: { code: "INVALID_EMAIL", message: "Masukkan email yang valid." } },
        { status: 400 },
      );
    }

    try {
      const result = await resendVerification(email);
      if (result.status === "error") {
        const isRateLimited = result.error?.statusCode === 429;
        return Response.json(
          {
            error: {
              code: isRateLimited ? "VERIFICATION_RATE_LIMITED" : "VERIFICATION_RESEND_FAILED",
              message: isRateLimited
                ? "Tunggu sebentar sebelum meminta kode baru."
                : "Kode verifikasi belum dapat dikirim ulang.",
            },
          },
          { status: isRateLimited ? 429 : safeStatus(result.error?.statusCode, 502) },
        );
      }

      return Response.json({ data: { accepted: true } }, { status: 202 });
    } catch {
      return Response.json(
        { error: { code: "AUTH_UNAVAILABLE", message: "Kode verifikasi belum dapat dikirim ulang." } },
        { status: 503 },
      );
    }
  };
}
