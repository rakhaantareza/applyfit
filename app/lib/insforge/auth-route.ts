import { createAuthActions } from "@insforge/sdk/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Creates InsForge auth actions for a Route Handler.
 *
 * Route Handlers have separate request and response cookie stores. Using
 * `cookies()` as a combined store can make authentication succeed upstream
 * without forwarding the new session cookies to the browser (notably in
 * Vinext dev). Keep the SDK's cookie mutations on a response and copy them to
 * the handler's real response before returning it.
 */
export function createAuthRouteContext(request: NextRequest) {
  const cookieCarrier = new NextResponse(null);
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: cookieCarrier.cookies,
  });

  function withSessionCookies(response: Response) {
    const headers = new Headers(response.headers);

    // Vinext's ResponseCookies#getAll() exposes only name/value and drops the
    // security and lifetime attributes attached by the InsForge SSR helpers.
    // Copy the serialized values so the refresh token stays httpOnly.
    for (const cookie of cookieCarrier.headers.getSetCookie()) {
      headers.append("Set-Cookie", cookie);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return { auth, withSessionCookies };
}
