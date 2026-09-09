import { createWorkspaceHandler } from "../../../server/http/workspace-handler.ts";
import {
  loadDashboardWorkspace,
  loadJobsWorkspace,
  loadPortfolioWorkspace,
  loadProfileWorkspace,
} from "../../../server/services/workspace-data.ts";
import { createInsForgeServerClient } from "../../lib/insforge/server.ts";

export async function GET(request: Request) {
  const client = await createInsForgeServerClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error) {
    return Response.json(
      { error: { code: "AUTH_UNAVAILABLE", message: "Sesi akun belum dapat diperiksa." } },
      { status: 503 },
    );
  }
  if (!data.user) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk membuka halaman ini." } },
      { status: 401 },
    );
  }
  const userId = data.user.id;
  return createWorkspaceHandler({
    dashboard: () => loadDashboardWorkspace(client, userId),
    profile: () => loadProfileWorkspace(client, userId),
    portfolio: () => loadPortfolioWorkspace(client, userId),
    jobs: () => loadJobsWorkspace(client, userId),
  })(request);
}
