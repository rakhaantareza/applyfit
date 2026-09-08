import { createJobHandlers } from "../../../server/http/jobs-handler.ts";
import { protectDemoMutation } from "../../lib/insforge/demo-read-only.ts";
import { jobActions } from "./actions.ts";

const handlers = createJobHandlers(jobActions);
export const GET = handlers.GET_LIST;
export const POST = protectDemoMutation(handlers.POST);
