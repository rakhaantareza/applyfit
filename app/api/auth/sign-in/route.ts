import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createSignInHandler } from "../../../../server/http/auth-session-handler.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createSignInHandler(async (input) => {
    const { data, error } = await auth.signInWithPassword(input);

    if (error || !data?.user) {
      return {
        status: "error",
        error: {
          code: String(error?.error || "INVALID_CREDENTIALS"),
          message: error?.message || "Email atau kata sandi tidak sesuai.",
          statusCode: error?.statusCode ?? 401,
        },
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

  return withSessionCookies(await handler(request));
}
