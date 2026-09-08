import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createSignInHandler } from "../../../../server/http/auth-session-handler.ts";
import { normalizeAuthProviderError } from "../../../../server/http/auth-provider-error.ts";
import { withDemoSessionCookie } from "../../../../server/http/demo-read-only.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createSignInHandler(async (input) => {
    const { data, error } = await auth.signInWithPassword(input);

    if (error || !data?.user) {
      return {
        status: "error",
        error: normalizeAuthProviderError(
          error ? {
            error: error.error,
            message: error.message,
            statusCode: error.statusCode,
          } : { error: "INVALID_CREDENTIALS", statusCode: 401 },
          "sign-in",
        ),
      };
    }

    return {
      status: "ok",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailVerified: Boolean(data.user.emailVerified),
        },
      },
    };
  });

  const response = withSessionCookies(await handler(request));
  return response.ok ? withDemoSessionCookie(response, false) : response;
}
