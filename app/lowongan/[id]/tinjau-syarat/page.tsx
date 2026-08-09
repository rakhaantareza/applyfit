import type { Metadata } from "next";
import { AppSidebar } from "../../../components/AppSidebar";
import { RequirementReviewWorkspace } from "./RequirementReviewWorkspace";
import { AuthenticatedRoute } from "../../../components/AuthenticatedRoute";

type RequirementReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Tinjau Syarat",
  description: "Periksa requirement hasil ekstraksi sebelum dipakai dalam analisis ApplyFit.",
};

export default async function RequirementReviewPage({ params }: RequirementReviewPageProps) {
  const { id } = await params;
  return (
    <AuthenticatedRoute><div className="app-shell">
      <AppSidebar activeItem="Lowongan" />
      <main className="main-content requirement-review-main">
        <RequirementReviewWorkspace jobId={id} />
      </main>
    </div></AuthenticatedRoute>
  );
}
