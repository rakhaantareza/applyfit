import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createVerifyEmailHandler } from "../../../../server/http/auth-email-verification-handler.ts";
import { normalizeAuthProviderError } from "../../../../server/http/auth-provider-error.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createVerifyEmailHandler(async (input) => {
    const { data, error } = await auth.verifyEmail(input);

    if (error || !data?.user) {
      return {
        status: "error",
        error: normalizeAuthProviderError(
          error ? {
            error: error.error,
            message: error.message,
            statusCode: error.statusCode,
          } : { error: "INVALID_VERIFICATION", statusCode: 400 },
          "verify-email",
        ),
      };
    }

    return { status: "ok" };
  });

  return withSessionCookies(await handler(request));
}
