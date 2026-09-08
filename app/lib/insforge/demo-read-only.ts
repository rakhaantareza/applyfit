import {
  createDemoMutationGuard,
  DEMO_SESSION_COOKIE,
  withDemoMutationGuard,
} from "../../../server/http/demo-read-only.ts";
import { cookies } from "next/headers";

export async function isDemoSession() {
  return (await cookies()).get(DEMO_SESSION_COOKIE)?.value === "1";
}

const configuredDemoMutationGuard = createDemoMutationGuard(isDemoSession);

async function guardDemoMutation() {
  try {
    return await configuredDemoMutationGuard();
  } catch {
    return Response.json(
      {
        error: {
          code: "AUTH_UNAVAILABLE",
          message: "Sesi belum dapat diperiksa. Coba lagi.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function rejectDemoMutation() {
  return guardDemoMutation();
}

export function protectDemoMutation<Arguments extends unknown[]>(
  handler: (...args: Arguments) => Response | Promise<Response>,
) {
  return withDemoMutationGuard(handler, guardDemoMutation);
}
