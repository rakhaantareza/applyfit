type PasswordResetRequestActionResult =
  | { status: "ok" }
  | { status: "error"; statusCode?: number };

export type PasswordResetRequestAction = (
  email: string,
) => Promise<PasswordResetRequestActionResult>;

export type PasswordResetConfirmInput = {
  email: string;
  code: string;
  newPassword: string;
};

type PasswordResetConfirmActionResult =
  | { status: "ok" }
  | { status: "error"; statusCode?: number };

export type PasswordResetConfirmAction = (
  input: PasswordResetConfirmInput,
) => Promise<PasswordResetConfirmActionResult>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readEmail(request: Request) {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value) || typeof value.email !== "string") return null;
    const email = value.email.trim().toLocaleLowerCase("id-ID");
    return /^\S+@\S+\.\S+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}

export function createPasswordResetRequestHandler(
  requestPasswordReset: PasswordResetRequestAction,
) {
  return async function POST(request: Request) {
    const email = await readEmail(request);
    if (!email) {
      return Response.json(
        {
          error: {
            code: "INVALID_EMAIL",
            message: "Masukkan alamat email yang valid.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const result = await requestPasswordReset(email);
      if (result.status === "error") {
        const isRateLimited = result.statusCode === 429;
        return Response.json(
          {
            error: {
              code: isRateLimited ? "RESET_RATE_LIMITED" : "RESET_REQUEST_FAILED",
              message: isRateLimited
                ? "Tunggu sebentar sebelum meminta kode baru."
                : "Permintaan reset belum dapat dikirim. Coba lagi.",
            },
          },
          { status: isRateLimited ? 429 : 502 },
        );
      }

      return Response.json(
        {
          data: {
            accepted: true,
            message: "Jika akun terdaftar, instruksi reset akan dikirim ke email tersebut.",
          },
        },
        { status: 202 },
      );
    } catch {
      return Response.json(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Layanan reset kata sandi belum tersedia. Coba lagi.",
          },
        },
        { status: 503 },
      );
    }
  };
}

async function readConfirmation(request: Request): Promise<PasswordResetConfirmInput | null> {
  try {
    const value: unknown = await request.json();
    if (!isRecord(value)) return null;

    const email = typeof value.email === "string"
      ? value.email.trim().toLocaleLowerCase("id-ID")
      : "";
    const code = typeof value.code === "string" ? value.code.trim() : "";
    const newPassword = typeof value.newPassword === "string" ? value.newPassword : "";

    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code) || newPassword.length < 6) {
      return null;
    }

    return { email, code, newPassword };
  } catch {
    return null;
  }
}

export function createPasswordResetConfirmHandler(
  confirmPasswordReset: PasswordResetConfirmAction,
) {
  return async function POST(request: Request) {
    const input = await readConfirmation(request);
    if (!input) {
      return Response.json(
        {
          error: {
            code: "INVALID_RESET",
            message: "Masukkan email, kode 6 digit, dan kata sandi baru minimal 6 karakter.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const result = await confirmPasswordReset(input);
      if (result.status === "error") {
        return Response.json(
          {
            error: {
              code: "INVALID_OR_EXPIRED_RESET",
              message: "Kode reset tidak valid atau sudah kedaluwarsa.",
            },
          },
          {
            status: result.statusCode && result.statusCode >= 400 && result.statusCode < 500
              ? result.statusCode
              : 502,
          },
        );
      }

      return Response.json({
        data: {
          updated: true,
          message: "Kata sandi berhasil diperbarui. Silakan masuk kembali.",
        },
      });
    } catch {
      return Response.json(
        {
          error: {
            code: "AUTH_UNAVAILABLE",
            message: "Kata sandi belum dapat diperbarui. Coba lagi.",
          },
        },
        { status: 503 },
      );
    }
  };
}
