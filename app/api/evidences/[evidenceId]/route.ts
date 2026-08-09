import { createEvidenceHandlers } from "../../../../server/http/evidences-handler.ts";
import { evidenceActions } from "../actions.ts";

const handlers = createEvidenceHandlers(evidenceActions);
type RouteContext = { params: Promise<{ evidenceId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { evidenceId } = await context.params;
  return handlers.PATCH(request, evidenceId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { evidenceId } = await context.params;
  return handlers.DELETE(evidenceId);
}
