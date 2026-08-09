import { createInsForgeServerClient } from "../../../../lib/insforge/server.ts";
import { createPasswordResetRequestHandler } from "../../../../../server/http/auth-password-reset-handler.ts";

const handler = createPasswordResetRequestHandler(async (email) => {
  const client = await createInsForgeServerClient();
  const { error } = await client.auth.sendResetPasswordEmail({ email });

  if (error) {
    return { status: "error", statusCode: error.statusCode };
  }

  return { status: "ok" };
});

export const POST = handler;
