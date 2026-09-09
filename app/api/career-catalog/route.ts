import { createInsForgeServerClient } from "../../lib/insforge/server.ts";
import {
  CareerCatalogQueryError,
  getCachedCareerCatalog,
} from "../../../server/services/career-catalog.ts";

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

    return Response.json({ data: { catalog: await getCachedCareerCatalog(client) } });
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
