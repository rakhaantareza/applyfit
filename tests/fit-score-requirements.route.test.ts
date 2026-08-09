import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/fit-score/requirements/route.ts";

function createRequest(payload: unknown) {
  return new Request("http://localhost/api/fit-score/requirements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("returns requirements with supporting evidence and point contribution", async () => {
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [
        {
          id: "react",
          name: "React & Next.js",
          type: "skill",
          priority: "required",
          status: "missing",
          mappings: [
            {
              skill: { id: "react-skill", status: "active" },
              evidences: [
                {
                  id: "portfolio-dashboard",
                  title: "Dasbor Analitik",
                  type: "portfolio",
                  url: "https://portfolio.example/dashboard",
                },
              ],
            },
          ],
        },
      ],
    }),
  );
  const payload = (await response.json()) as {
    data: { requirements: Array<Record<string, unknown>> };
  };

  assert.equal(response.status, 200);
  assert.deepEqual(payload.data.requirements[0], {
    id: "react",
    name: "React & Next.js",
    type: "skill",
    priority: "required",
    status: "proven",
    isInformational: false,
    evidences: [
      {
        id: "portfolio-dashboard",
        title: "Dasbor Analitik",
        type: "portfolio",
        url: "https://portfolio.example/dashboard",
      },
    ],
    points: { weight: 3, multiplier: 100, earned: 3, maximum: 3 },
  });
});

test("keeps non-skill requirements visible with no point contribution", async () => {
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [
        {
          id: "experience",
          name: "Pengalaman kerja 2 tahun",
          type: "experience",
          priority: "required",
          mappings: [],
        },
      ],
    }),
  );
  const payload = (await response.json()) as {
    data: {
      requirements: Array<{
        isInformational: boolean;
        status: unknown;
        points: unknown;
      }>;
    };
  };

  assert.equal(response.status, 200);
  assert.equal(payload.data.requirements[0]?.isInformational, true);
  assert.equal(payload.data.requirements[0]?.status, null);
  assert.equal(payload.data.requirements[0]?.points, null);
});

test("rejects invalid evidence data", async () => {
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [
        {
          id: "react",
          name: "React",
          type: "skill",
          priority: "required",
          mappings: [
            {
              skill: { id: "react-skill", status: "active" },
              evidences: [{ id: "evidence", title: "", type: "project" }],
            },
          ],
        },
      ],
    }),
  );
  const payload = (await response.json()) as {
    error: { code: string; message: string };
  };

  assert.equal(response.status, 400);
  assert.equal(payload.error.code, "INVALID_PAYLOAD");
  assert.match(payload.error.message, /title/);
});

test("rejects duplicate requirement identifiers", async () => {
  const requirement = {
    id: "react",
    name: "React",
    type: "skill",
    priority: "required",
    mappings: [],
  };
  const response = await POST(
    createRequest({
      jobId: "job-frontend",
      requirements: [requirement, requirement],
    }),
  );

  assert.equal(response.status, 400);
  assert.match((await response.json()).error.message, /duplikat/);
});
