import assert from "node:assert/strict";
import test from "node:test";
import { createRequirementExtractionHandler } from "../server/http/requirement-extraction-handler.ts";
import {
  EmptyJobDescriptionError,
  RequirementExtractionError,
} from "../server/services/requirement-extraction.ts";

const extraction = {
  requirements: [
    { name: "TypeScript", type: "skill" as const, priority: "required" as const },
  ],
  model: "openai/gpt-4o-mini",
};

test("POST returns reviewable requirement drafts", async () => {
  const response = await createRequirementExtractionHandler(async () => ({
    status: "ok", data: extraction,
  }))("job-1");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { ...extraction, reviewRequired: true },
  });
});

test("POST requires authentication", async () => {
  const response = await createRequirementExtractionHandler(async () => ({
    status: "unauthenticated",
  }))("job-1");
  assert.equal(response.status, 401);
});

test("POST requires a saved job description", async () => {
  const response = await createRequirementExtractionHandler(async () => {
    throw new EmptyJobDescriptionError();
  })("job-1");
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error.code, "JOB_DESCRIPTION_REQUIRED");
});

test("POST exposes a stable extraction error", async () => {
  const response = await createRequirementExtractionHandler(async () => {
    throw new RequirementExtractionError();
  })("job-1");
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error.code, "EXTRACTION_UNAVAILABLE");
});
