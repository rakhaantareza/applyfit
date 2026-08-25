import type { Metadata } from "next";
import { RequirementReviewWorkspace } from "./RequirementReviewWorkspace";
import { AuthenticatedRoute } from "../../../components/AuthenticatedRoute";

type RequirementReviewPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Persyaratan",
  description: "Periksa requirement hasil ekstraksi sebelum dipakai dalam analisis ApplyFit.",
};

export default async function RequirementReviewPage({ params }: RequirementReviewPageProps) {
  const { id } = await params;
  return <AuthenticatedRoute><RequirementReviewWorkspace jobId={id} /></AuthenticatedRoute>;
}
