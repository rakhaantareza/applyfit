import assert from "node:assert/strict";
import test from "node:test";
import {
  createAccountProfileHandlers,
  type AccountProfileInput,
} from "../server/http/account-profile-handler.ts";

const account = {
  id: "user-1",
  email: "aruna@example.com",
  emailVerified: true,
  name: "Aruna Wijaya",
  avatarUrl: "https://images.example.com/aruna.jpg",
};

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/account/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("account profile accepts normalized name and HTTPS avatar", async () => {
  let received: AccountProfileInput | null = null;
  const handlers = createAccountProfileHandlers(
    async () => ({ status: "ok", account }),
    async (input) => {
      received = input;
      return { status: "ok", account: { ...account, ...input } };
    },
  );

  const response = await handlers.PATCH(patchRequest({
    name: "  Aruna   Wijaya ",
    avatarUrl: " https://images.example.com/aruna.jpg ",
  }));

  assert.equal(response.status, 200);
  assert.deepEqual(received, {
    name: "Aruna Wijaya",
    avatarUrl: "https://images.example.com/aruna.jpg",
  });
});

test("account profile rejects unsafe avatar URLs and unauthenticated reads", async () => {
  const handlers = createAccountProfileHandlers(
    async () => ({ status: "unauthenticated" }),
    async () => ({ status: "error" }),
  );

  const unsafe = await handlers.PATCH(patchRequest({
    name: "Aruna Wijaya",
    avatarUrl: "javascript:alert(1)",
  }));
  const unauthenticated = await handlers.GET();

  assert.equal(unsafe.status, 400);
  assert.equal(unauthenticated.status, 401);
});
