import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createSignOutHandler } from "../../../../server/http/auth-session-handler.ts";
import { normalizeAuthProviderError } from "../../../../server/http/auth-provider-error.ts";
import { withDemoSessionCookie } from "../../../../server/http/demo-read-only.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createSignOutHandler(async () => {
    const { error } = await auth.signOut();

    if (error) {
      return {
        status: "error",
        error: normalizeAuthProviderError({
          error: error.error,
          message: error.message,
          statusCode: error.statusCode,
        }, "sign-out"),
      };
    }

    return { status: "ok" };
  });

  const response = withSessionCookies(await handler());
  return response.ok ? withDemoSessionCookie(response, false) : response;
}
