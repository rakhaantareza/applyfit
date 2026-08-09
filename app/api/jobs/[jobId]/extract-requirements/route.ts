import { createInsForgeServerClient } from "../../../../lib/insforge/server.ts";
import { createRequirementExtractionHandler } from "../../../../../server/http/requirement-extraction-handler.ts";
import { extractRequirementsFromDescription } from "../../../../../server/services/requirement-extraction.ts";
import { getJobPosting } from "../../../../../server/services/saved-jobs.ts";

const handler = createRequirementExtractionHandler(async (jobId) => {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) throw new Error("InsForge authentication unavailable");
  if (!data.user) return { status: "unauthenticated" };

  const job = await getJobPosting(client, data.user.id, jobId);
  return {
    status: "ok",
    data: await extractRequirementsFromDescription(job.rawDescription),
  };
});

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handler(jobId);
}
