const PUBLIC_AUTH_ROUTES = new Set([
  "/api/auth/password-reset/confirm",
  "/api/auth/password-reset/request",
  "/api/auth/refresh",
  "/api/auth/resend-verification",
  "/api/auth/sign-in",
  "/api/auth/sign-out",
  "/api/auth/sign-up",
  "/api/auth/verify-email",
]);

export const UNAUTHENTICATED_API_ERROR = {
  error: {
    code: "UNAUTHENTICATED",
    message: "Silakan masuk untuk mengakses data ApplyFit.",
  },
} as const;

export function isProtectedApiRoute(pathname: string) {
  if (!pathname.startsWith("/api/")) return false;
  return !PUBLIC_AUTH_ROUTES.has(normalizePathname(pathname));
}

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function unauthenticatedApiResponse(headers?: Headers) {
  return Response.json(UNAUTHENTICATED_API_ERROR, { status: 401, headers });
}
