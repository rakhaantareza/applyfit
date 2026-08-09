import { createJobHandlers } from "../../../../server/http/jobs-handler.ts";
import { jobActions } from "../actions.ts";

const handlers = createJobHandlers(jobActions);
type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.GET_ITEM(jobId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.PATCH(request, jobId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  return handlers.DELETE(jobId);
}
