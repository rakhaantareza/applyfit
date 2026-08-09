import { createJobHandlers } from "../../../server/http/jobs-handler.ts";
import { jobActions } from "./actions.ts";

const handlers = createJobHandlers(jobActions);
export const GET = handlers.GET_LIST;
export const POST = handlers.POST;
