import type { Metadata } from "next";
import { AppSidebar } from "../../../components/AppSidebar";
import { EvidenceMappingPageWorkspace } from "./EvidenceMappingPageWorkspace";
import { AuthenticatedRoute } from "../../../components/AuthenticatedRoute";

type EvidenceMappingPageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Pemetaan Bukti",
  description: "Hubungkan requirement lowongan dengan skill dan bukti profil secara transparan.",
};

export default async function EvidenceMappingPage({ params }: EvidenceMappingPageProps) {
  const { id } = await params;
  return (
    <AuthenticatedRoute><div className="app-shell">
      <AppSidebar activeItem="Lowongan" />
      <main className="main-content evidence-mapping-main">
        <EvidenceMappingPageWorkspace jobId={id} />
      </main>
    </div></AuthenticatedRoute>
  );
}
