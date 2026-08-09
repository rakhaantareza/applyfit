import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createVerifyEmailHandler } from "../../../../server/http/auth-email-verification-handler.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createVerifyEmailHandler(async (input) => {
    const { data, error } = await auth.verifyEmail(input);

    if (error || !data?.user) {
      return {
        status: "error",
        error: {
          code: String(error?.error || "INVALID_VERIFICATION"),
          message: error?.message,
          statusCode: error?.statusCode,
        },
      };
    }

    return { status: "ok" };
  });

  return withSessionCookies(await handler(request));
}
