import { createInsForgeServerClient } from "../../../lib/insforge/server.ts";
import { createResendVerificationHandler } from "../../../../server/http/auth-email-verification-handler.ts";

const handler = createResendVerificationHandler(async (email) => {
  const client = await createInsForgeServerClient();
  const { error } = await client.auth.resendVerificationEmail({ email });

  if (error) {
    return {
      status: "error",
      error: {
        code: String(error.error || "VERIFICATION_RESEND_FAILED"),
        message: error.message,
        statusCode: error.statusCode,
      },
    };
  }

  return { status: "ok" };
});

export const POST = handler;
