const AUTH_ENTRY_PAGES = new Set(["/login", "/daftar"]);

export function shouldRedirectAuthenticatedUserFromAuthPage(
  pathname: string,
  accessToken: string | null | undefined,
) {
  return Boolean(accessToken) && AUTH_ENTRY_PAGES.has(pathname);
}
