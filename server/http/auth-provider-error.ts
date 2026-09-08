export type AuthProviderFlow =
  | "sign-in"
  | "sign-out"
  | "sign-up"
  | "verify-email"
  | "refresh";

type AuthProviderError = {
  error?: unknown;
  message?: unknown;
  statusCode?: unknown;
};

export type NormalizedAuthProviderError = {
  code: string;
  message: string;
  statusCode?: number;
};

const messages = {
  invalidCredentials: "Email atau kata sandi salah.",
  existingAccount: "Email ini sudah terdaftar. Coba masuk atau gunakan email lain.",
  invalidVerification: "Kode verifikasi tidak valid atau sudah kedaluwarsa.",
  unknown: "Terjadi kesalahan. Coba lagi.",
} as const;

export function normalizeAuthProviderError(
  error: AuthProviderError | null | undefined,
  flow: AuthProviderFlow,
): NormalizedAuthProviderError {
  const statusCode = typeof error?.statusCode === "number"
    ? error.statusCode
    : undefined;
  const fingerprint = [error?.error, error?.message]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("en-US");

  if (
    flow === "sign-in" &&
    /invalid[_ ]credentials|invalid[_ ]login|wrong[_ ]password/.test(fingerprint)
  ) {
    return withStatus({
      code: "INVALID_CREDENTIALS",
      message: messages.invalidCredentials,
    }, statusCode);
  }

  if (
    flow === "sign-up" &&
    /already[_ ](exists|registered)|user[_ ]exists|duplicate/.test(fingerprint)
  ) {
    return withStatus({
      code: "USER_ALREADY_EXISTS",
      message: messages.existingAccount,
    }, statusCode);
  }

  if (
    flow === "verify-email" &&
    /invalid[_ ](input|verification|code)|expired[_ ](verification|code)|verification.*(invalid|expired)|code.*(invalid|expired)/.test(fingerprint)
  ) {
    return withStatus({
      code: "INVALID_VERIFICATION",
      message: messages.invalidVerification,
    }, statusCode);
  }

  return withStatus({
    code: "AUTH_FAILED",
    message: messages.unknown,
  }, statusCode);
}

export function normalizeAuthProviderResponse(
  response: Response,
  flow: AuthProviderFlow,
) {
  if (response.ok) return response;

  const normalized = normalizeAuthProviderError(
    { statusCode: response.status },
    flow,
  );
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");
  headers.set("Cache-Control", "no-store");

  return Response.json(
    { error: { code: normalized.code, message: normalized.message } },
    { status: response.status, headers },
  );
}

function withStatus(
  error: Omit<NormalizedAuthProviderError, "statusCode">,
  statusCode: number | undefined,
): NormalizedAuthProviderError {
  return statusCode === undefined ? error : { ...error, statusCode };
}
