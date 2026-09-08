export const DEMO_READ_ONLY_ERROR = {
  error: {
    code: "DEMO_READ_ONLY",
    message: "Ruang demo hanya untuk dilihat. Perubahan tidak dapat disimpan.",
  },
} as const;

export const DEMO_SESSION_COOKIE = "applyfit_demo_view";

export type DemoMutationGuard = () => Promise<Response | null>;

type DemoSessionResolver = () => Promise<boolean>;

export function createDemoMutationGuard(
  resolveDemoSession: DemoSessionResolver,
): DemoMutationGuard {
  return async function guardDemoMutation() {
    if (!await resolveDemoSession()) return null;

    return Response.json(DEMO_READ_ONLY_ERROR, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  };
}

export function withDemoSessionCookie(response: Response, enabled: boolean) {
  const headers = new Headers(response.headers);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const value = enabled ? "1" : "";
  const lifetime = enabled ? "; Max-Age=86400" : "; Max-Age=0";
  headers.append(
    "Set-Cookie",
    `${DEMO_SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax${lifetime}${secure}`,
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function withDemoMutationGuard<Arguments extends unknown[]>(
  handler: (...args: Arguments) => Response | Promise<Response>,
  guard: DemoMutationGuard,
) {
  return async (...args: Arguments) => {
    const rejection = await guard();
    return rejection ?? handler(...args);
  };
}
