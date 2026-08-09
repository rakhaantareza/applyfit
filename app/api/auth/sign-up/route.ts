import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import {
  createSignUpHandler,
  type SafeAuthUser,
} from "../../../../server/http/auth-sign-up-handler.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createSignUpHandler(async (input) => {
    const { data, error } = await auth.signUp(input);

    if (error) {
      return {
        status: "error",
        error: {
          code: String(error.error || "SIGN_UP_FAILED"),
          message: error.message || "Pendaftaran akun gagal.",
          statusCode: error.statusCode,
        },
      };
    }

    if (!data) {
      return {
        status: "error",
        error: {
          code: "SIGN_UP_FAILED",
          message: "Pendaftaran akun belum dapat diselesaikan.",
          statusCode: 502,
        },
      };
    }

    const user: SafeAuthUser | null = data.user
      ? {
          id: data.user.id,
          email: data.user.email,
          emailVerified: Boolean(data.user.emailVerified),
        }
      : null;

    return {
      status: "ok",
      data: {
        user,
        requireEmailVerification: Boolean(data.requireEmailVerification),
      },
    };
  });

  return withSessionCookies(await handler(request));
}
