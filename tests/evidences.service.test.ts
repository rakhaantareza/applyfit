import assert from "node:assert/strict";
import test from "node:test";
import {
  EvidenceQueryError,
  filterEvidencesByQuery,
  normalizeEvidence,
  normalizeEvidences,
} from "../server/services/evidences.ts";

const databaseEvidence = {
  id: "evidence-1",
  profile_id: "profile-1",
  title: "Dashboard analytics",
  type: "project",
  url: "https://github.com/example/dashboard",
  description: "Membangun dashboard dengan React dan TypeScript.",
  created_at: "2026-08-09T09:00:00.000Z",
  updated_at: "2026-08-09T10:00:00.000Z",
};

test("normalizeEvidence maps the persisted evidence model", () => {
  assert.deepEqual(normalizeEvidence(databaseEvidence), {
    id: "evidence-1",
    profileId: "profile-1",
    title: "Dashboard analytics",
    type: "project",
    url: "https://github.com/example/dashboard",
    description: "Membangun dashboard dengan React dan TypeScript.",
    createdAt: "2026-08-09T09:00:00.000Z",
    updatedAt: "2026-08-09T10:00:00.000Z",
  });
});

test("normalizeEvidences accepts evidence without a URL", () => {
  const [evidence] = normalizeEvidences([{ ...databaseEvidence, url: null }]);
  assert.equal(evidence.url, null);
});

test("normalizeEvidence rejects unsupported types", () => {
  assert.throws(
    () => normalizeEvidence({ ...databaseEvidence, type: "course" }),
    EvidenceQueryError,
  );
});

test("filterEvidencesByQuery searches title, description, URL, and type", () => {
  const evidences = normalizeEvidences([
    databaseEvidence,
    {
      ...databaseEvidence,
      id: "evidence-2",
      title: "Sertifikasi frontend",
      type: "cert",
      url: null,
      description: "Sertifikat penyelesaian kelas web.",
    },
  ]);

  assert.deepEqual(
    filterEvidencesByQuery(evidences, "GITHUB").map((item) => item.id),
    ["evidence-1"],
  );
  assert.deepEqual(
    filterEvidencesByQuery(evidences, "cert").map((item) => item.id),
    ["evidence-2"],
  );
});
