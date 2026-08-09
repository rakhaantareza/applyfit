import { createInsForgeServerClient } from "../../../../lib/insforge/server.ts";
import { createPasswordResetConfirmHandler } from "../../../../../server/http/auth-password-reset-handler.ts";

const handler = createPasswordResetConfirmHandler(async (input) => {
  const client = await createInsForgeServerClient();
  const exchangeResult = await client.auth.exchangeResetPasswordToken({
    email: input.email,
    code: input.code,
  });

  if (exchangeResult.error || !exchangeResult.data?.token) {
    return {
      status: "error",
      statusCode: exchangeResult.error?.statusCode ?? 400,
    };
  }

  const resetResult = await client.auth.resetPassword({
    newPassword: input.newPassword,
    otp: exchangeResult.data.token,
  });

  if (resetResult.error) {
    return { status: "error", statusCode: resetResult.error.statusCode };
  }

  return { status: "ok" };
});

export const POST = handler;
