import assert from "node:assert/strict";
import test from "node:test";
import { createCareerProfileHandlers } from "../server/http/career-profile-handler.ts";
import { CareerProfileQueryError } from "../server/services/career-profile.ts";

const profile = {
  id: "profile-1",
  targetRole: "Frontend Developer",
  careerField: "Software Engineering",
  createdAt: "2026-08-09T09:00:00.000Z",
  updatedAt: "2026-08-09T10:00:00.000Z",
};

test("GET returns the current user's career target", async () => {
  const { GET } = createCareerProfileHandlers(
    async () => ({ status: "ok", profile }),
    async () => ({ status: "ok", profile }),
  );

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { profile } });
});

test("GET returns null when the user has not created a career profile", async () => {
  const { GET } = createCareerProfileHandlers(
    async () => ({ status: "ok", profile: null }),
    async () => ({ status: "ok", profile }),
  );

  const response = await GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { profile: null } });
});

test("PATCH trims and saves a complete career target", async () => {
  let receivedInput: unknown;
  const { PATCH } = createCareerProfileHandlers(
    async () => ({ status: "ok", profile }),
    async (input) => {
      receivedInput = input;
      return { status: "ok", profile };
    },
  );

  const response = await PATCH(
    new Request("http://localhost/api/career-profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetRole: "  Frontend Developer ",
        careerField: " Software Engineering  ",
      }),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(receivedInput, {
    targetRole: "Frontend Developer",
    careerField: "Software Engineering",
  });
  assert.deepEqual(await response.json(), { data: { profile } });
});

test("PATCH rejects incomplete career target data", async () => {
  const { PATCH } = createCareerProfileHandlers(
    async () => ({ status: "ok", profile }),
    async () => ({ status: "ok", profile }),
  );

  const response = await PATCH(
    new Request("http://localhost/api/career-profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetRole: "Frontend Developer" }),
    }),
  );

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_CAREER_TARGET");
});

test("GET and PATCH reject unauthenticated requests", async () => {
  const { GET, PATCH } = createCareerProfileHandlers(
    async () => ({ status: "unauthenticated" }),
    async () => ({ status: "unauthenticated" }),
  );

  const getResponse = await GET();
  const patchResponse = await PATCH(
    new Request("http://localhost/api/career-profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetRole: "Frontend Developer",
        careerField: "Software Engineering",
      }),
    }),
  );

  assert.equal(getResponse.status, 401);
  assert.equal(patchResponse.status, 401);
});

test("GET exposes a stable error when the profile query fails", async () => {
  const { GET } = createCareerProfileHandlers(
    async () => {
      throw new CareerProfileQueryError();
    },
    async () => ({ status: "ok", profile }),
  );

  const response = await GET();

  assert.equal(response.status, 502);
  assert.equal(
    (await response.json()).error.code,
    "CAREER_PROFILE_UNAVAILABLE",
  );
});
