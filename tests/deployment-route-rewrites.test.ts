import assert from "node:assert/strict";
import test from "node:test";
import nextConfig, { deploymentRouteRewrites } from "../next.config.ts";

test("deployment rewrites preserve public skill API paths", async () => {
  assert.equal(typeof nextConfig.rewrites, "function");
  assert.deepEqual(await nextConfig.rewrites?.(), deploymentRouteRewrites);
  assert.deepEqual(deploymentRouteRewrites, [
    {
      source: "/api/career-profile/skills/:skillId",
      destination: "/api/career-profile-skill-items/:skillId",
    },
    {
      source: "/api/career-profile/skills",
      destination: "/api/career-profile-skill-items",
    },
    {
      source: "/api/evidences/:evidenceId/skills/:skillId",
      destination: "/api/evidence-skill-links/:evidenceId/:skillId",
    },
    {
      source: "/api/evidences/:evidenceId/skills",
      destination: "/api/evidence-skill-links/:evidenceId",
    },
  ]);
});
