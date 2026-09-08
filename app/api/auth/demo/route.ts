import type { NextRequest } from "next/server";
import { createAuthRouteContext } from "../../../lib/insforge/auth-route";
import { createDemoSignInHandler } from "../../../../server/http/auth-demo-handler.ts";
import { withDemoSessionCookie } from "../../../../server/http/demo-read-only.ts";

export async function POST(request: NextRequest) {
  const { auth, withSessionCookies } = createAuthRouteContext(request);
  const handler = createDemoSignInHandler(async () => {
    const email = process.env.DEMO_EMAIL?.trim().toLocaleLowerCase("id-ID") ?? "";
    const password = process.env.DEMO_PASSWORD ?? "";

    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return { status: "error" };
    }

    const { data, error } = await auth.signInWithPassword({ email, password });
    if (error || !data?.user || !data.user.emailVerified) {
      return { status: "error" };
    }

    return {
      status: "ok",
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          emailVerified: true,
        },
      },
    };
  });

  const response = withSessionCookies(await handler());
  return response.ok ? withDemoSessionCookie(response, true) : response;
}
