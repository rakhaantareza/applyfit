import { createInsForgeServerClient } from "../../../../../lib/insforge/server.ts";
import { createRequirementAutoMatchHandler } from "../../../../../../server/http/requirement-auto-match-handler.ts";
import { autoMatchJobRequirements } from "../../../../../../server/services/requirement-mappings.ts";

const handler = createRequirementAutoMatchHandler(async (jobId) => {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return { status: "unauthenticated" };
  return {
    status: "ok",
    data: await autoMatchJobRequirements(client, data.user.id, jobId),
  };
});

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handler(jobId);
}
