import type { Metadata } from "next";
import { AuthenticatedRoute } from "../../../components/AuthenticatedRoute";
import { FitScoreWorkspace } from "../../../components/FitScoreWorkspace";

type JobAnalysisPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Analisis",
  description: "Pahami kesiapan profil untuk lowongan ini melalui Fit Score yang transparan.",
};

export default async function JobAnalysisPage({ params }: JobAnalysisPageProps) {
  const { id } = await params;

  return <AuthenticatedRoute><FitScoreWorkspace jobId={id} /></AuthenticatedRoute>;
}
