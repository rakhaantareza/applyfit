import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import {
  type CareerCatalog,
  CareerCatalogQueryError,
  getCareerCatalog,
} from "../../../server/services/career-catalog.ts";

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
let cachedCatalog: { data: CareerCatalog; expiresAt: number } | null = null;
let catalogRequest: Promise<CareerCatalog> | null = null;

export async function GET() {
  try {
    const client = await createInsForgeServerClient();
    const { data, error } = await client.auth.getCurrentUser();
    if (error) throw error;
    if (!data.user) {
      return Response.json(
        { error: { code: "UNAUTHENTICATED", message: "Silakan masuk untuk melihat katalog karier." } },
        { status: 401 },
      );
    }

    return Response.json({ data: { catalog: await loadCareerCatalog(client) } });
  } catch (error) {
    const message = error instanceof CareerCatalogQueryError
      ? error.message
      : "Katalog karier belum tersedia.";
    return Response.json(
      { error: { code: "CAREER_CATALOG_UNAVAILABLE", message } },
      { status: 503 },
    );
  }
}

async function loadCareerCatalog(
  client: Awaited<ReturnType<typeof createInsForgeServerClient>>,
) {
  if (cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.data;
  }

  catalogRequest ??= getCareerCatalog(client)
    .then((catalog) => {
      cachedCatalog = {
        data: catalog,
        expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
      };
      return catalog;
    })
    .finally(() => {
      catalogRequest = null;
    });

  return catalogRequest;
}
