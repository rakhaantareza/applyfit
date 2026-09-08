import type { SafeAuthUser } from "./auth-sign-up-handler.ts";

type DemoSignInResult =
  | { status: "ok"; data: { user: SafeAuthUser } }
  | { status: "error" };

export type DemoSignInAction = () => Promise<DemoSignInResult>;

const unavailableResponse = {
  error: {
    code: "DEMO_UNAVAILABLE",
    message: "Demo belum dapat dibuka. Coba lagi.",
  },
} as const;

export function createDemoSignInHandler(signIn: DemoSignInAction) {
  return async function POST() {
    try {
      const result = await signIn();
      if (result.status === "error") {
        return Response.json(unavailableResponse, {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      }

      return Response.json(
        { data: { user: result.data.user } },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return Response.json(unavailableResponse, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
  };
}
