export type WorkspaceScope = "dashboard" | "profile" | "portfolio" | "jobs";

type WorkspaceLoaders = Record<WorkspaceScope, () => Promise<unknown>>;

const scopes = new Set<WorkspaceScope>(["dashboard", "profile", "portfolio", "jobs"]);

export function createWorkspaceHandler(loaders: WorkspaceLoaders) {
  return async function GET(request: Request) {
    const scope = new URL(request.url).searchParams.get("scope");
    if (!scope || !scopes.has(scope as WorkspaceScope)) {
      return Response.json(
        { error: { code: "INVALID_SCOPE", message: "Halaman yang diminta tidak valid." } },
        { status: 400 },
      );
    }
    try {
      return Response.json({ data: await loaders[scope as WorkspaceScope]() });
    } catch {
      return Response.json(
        { error: { code: "WORKSPACE_UNAVAILABLE", message: "Data halaman belum dapat dimuat." } },
        { status: 503 },
      );
    }
  };
}
