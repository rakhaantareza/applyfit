import { createEvidenceHandlers } from "../../../server/http/evidences-handler.ts";
import { protectDemoMutation } from "../../lib/insforge/demo-read-only.ts";
import { evidenceActions } from "./actions.ts";

const handlers = createEvidenceHandlers(evidenceActions);
export const GET = handlers.GET;
export const POST = protectDemoMutation(handlers.POST);
