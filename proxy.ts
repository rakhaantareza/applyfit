import { updateSession } from "@insforge/sdk/ssr/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedApiRoute,
  UNAUTHENTICATED_API_ERROR,
} from "./server/http/api-route-protection.ts";
import { shouldRedirectAuthenticatedUserFromAuthPage } from "./server/http/auth-page-access.ts";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const session = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const pathname = request.nextUrl.pathname;
  const protectedApi = isProtectedApiRoute(pathname);
  const protectedPage = isProtectedAppRoute(pathname);

  if (shouldRedirectAuthenticatedUserFromAuthPage(pathname, session.accessToken)) {
    const redirect = NextResponse.redirect(new URL("/beranda", request.url));
    copyResponseCookies(response, redirect);
    return redirect;
  }

  if ((!protectedApi && !protectedPage) || session.accessToken) {
    return response;
  }

  if (protectedPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    const redirect = NextResponse.redirect(loginUrl);
    copyResponseCookies(response, redirect);
    return redirect;
  }

  const unauthorized = NextResponse.json(UNAUTHENTICATED_API_ERROR, { status: 401 });
  copyResponseCookies(response, unauthorized);
  return unauthorized;
}

export const config = {
  matcher: [
    "/",
    "/api/:path*",
    "/beranda/:path*",
    "/daftar/:path*",
    "/login/:path*",
    "/lowongan/:path*",
    "/pengaturan/:path*",
    "/profil-karier/:path*",
    "/pustaka-bukti/:path*",
    "/skor-kecocokan/:path*",
  ],
};

function isProtectedAppRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/beranda" || pathname.startsWith("/beranda/") ||
    pathname === "/lowongan" || pathname.startsWith("/lowongan/") ||
    pathname === "/pengaturan" || pathname.startsWith("/pengaturan/") ||
    pathname === "/profil-karier" || pathname.startsWith("/profil-karier/") ||
    pathname === "/pustaka-bukti" || pathname.startsWith("/pustaka-bukti/") ||
    pathname === "/skor-kecocokan" || pathname.startsWith("/skor-kecocokan/")
  );
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}
