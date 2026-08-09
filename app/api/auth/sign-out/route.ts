import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createSignOutHandler } from "../../../../server/http/auth-session-handler.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createSignOutHandler(async () => {
    const { error } = await auth.signOut();

    if (error) {
      return {
        status: "error",
        error: {
          code: String(error.error || "SIGN_OUT_FAILED"),
          message: error.message || "Sesi belum dapat diakhiri.",
          statusCode: error.statusCode,
        },
      };
    }

    return { status: "ok" };
  });

  return withSessionCookies(await handler());
}
