import { createRefreshAuthRouter } from "@insforge/sdk/ssr";
import { normalizeAuthProviderResponse } from "../../../../server/http/auth-provider-error.ts";

const refresh = createRefreshAuthRouter();

export async function POST(request: Request) {
  return normalizeAuthProviderResponse(await refresh.POST(request), "refresh");
}
