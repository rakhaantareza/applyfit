import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/fit-score/summary/route.ts";

function createRequest(payload: unknown) {
  return new Request("http://localhost/api/fit-score/summary", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("returns a fit score summary for a job", async () => {
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [
        {
          id: "react",
          type: "skill",
          priority: "required",
          status: "missing",
          mappings: [
            {
              skill: { id: "react-skill", status: "active" },
              linkedEvidenceIds: ["react-project"],
            },
          ],
        },
        {
          id: "figma",
          type: "tool",
          priority: "preferred",
          status: "proven",
          mappings: [
            {
              skill: { id: "figma-skill", status: "active" },
              linkedEvidenceIds: [],
            },
          ],
        },
      ],
    }),
  );
  const payload = (await response.json()) as { data: Record<string, unknown> };

  assert.equal(response.status, 200);
  assert.deepEqual(payload.data, {
    jobId: "job-frontend",
    score: 87.5,
    currentPoints: 3.5,
    maximumPoints: 4,
    totalRequirements: 2,
    includedRequirements: 2,
    excludedRequirements: 0,
    statusCounts: { proven: 1, partial: 1, learning: 0, missing: 0 },
  });
});

test("reports excluded non-skill requirements without scoring them", async () => {
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [
        {
          id: "react",
          type: "skill",
          priority: "required",
          mappings: [
            {
              skill: { id: "react-skill", status: "active" },
              linkedEvidenceIds: ["react-project"],
            },
          ],
        },
        {
          id: "experience",
          type: "experience",
          priority: "required",
          mappings: [],
        },
      ],
    }),
  );
  const payload = (await response.json()) as {
    data: {
      score: number;
      includedRequirements: number;
      excludedRequirements: number;
      statusCounts: Record<string, number>;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(payload.data.score, 100);
  assert.equal(payload.data.includedRequirements, 1);
  assert.equal(payload.data.excludedRequirements, 1);
  assert.deepEqual(payload.data.statusCounts, {
    proven: 1,
    partial: 0,
    learning: 0,
    missing: 0,
  });
});

test("rejects an invalid requirement payload", async () => {
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [
        {
          id: "react",
          type: "skill",
          priority: "urgent",
          mappings: [],
        },
      ],
    }),
  );
  const payload = (await response.json()) as {
    error: { code: string; message: string };
  };

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "INVALID_PAYLOAD");
  assert.match(payload.error.message, /priority/);
});

test("rejects malformed JSON", async () => {
  const response = await POST(
    new Request("http://localhost/api/fit-score/summary", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    }),
  );

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_JSON");
});
