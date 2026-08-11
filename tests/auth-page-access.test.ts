import assert from "node:assert/strict";
import test from "node:test";
import { shouldRedirectAuthenticatedUserFromAuthPage } from "../server/http/auth-page-access.ts";

test("authenticated users leave login and registration on direct navigation or refresh", () => {
  for (const accessToken of ["current-access-token", "refreshed-access-token"]) {
    assert.equal(
      shouldRedirectAuthenticatedUserFromAuthPage("/login", accessToken),
      true,
    );
    assert.equal(
      shouldRedirectAuthenticatedUserFromAuthPage("/daftar", accessToken),
      true,
    );
  }
});

test("unauthenticated users can still open auth pages", () => {
  for (const accessToken of [null, undefined, ""]) {
    assert.equal(
      shouldRedirectAuthenticatedUserFromAuthPage("/login", accessToken),
      false,
    );
    assert.equal(
      shouldRedirectAuthenticatedUserFromAuthPage("/daftar", accessToken),
      false,
    );
  }
});

test("authenticated users are not redirected away from unrelated public pages", () => {
  assert.equal(
    shouldRedirectAuthenticatedUserFromAuthPage("/lupa-kata-sandi", "access-token"),
    false,
  );
});
