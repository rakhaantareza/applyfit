import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/fit-score/route.ts";

test("POST exposes the baseline score through the canonical endpoint", async () => {
  const response = await POST(
    new Request("http://localhost/api/fit-score", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jobId: "job-frontend",
        requirements: [
          {
            id: "typescript",
            type: "skill",
            priority: "required",
            status: "proven",
          },
          {
            id: "figma",
            type: "tool",
            priority: "preferred",
            status: "partial",
          },
        ],
      }),
    }),
  );
  const payload = (await response.json()) as {
    data: { jobId: string; score: number };
  };

  assert.equal(response.status, 200);
  assert.equal(payload.data.jobId, "job-frontend");
  assert.equal(payload.data.score, 87.5);
});
