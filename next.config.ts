import type { NextConfig } from "next";

export const deploymentRouteRewrites = [
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
];

const nextConfig: NextConfig = {
  async rewrites() {
    return deploymentRouteRewrites;
  },
};

export default nextConfig;
