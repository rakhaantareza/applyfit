import type { Metadata } from "next";
import { EvidenceMappingPageWorkspace } from "./EvidenceMappingPageWorkspace";
import { AuthenticatedRoute } from "../../../components/AuthenticatedRoute";

type EvidenceMappingPageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Cocokkan Profil",
  description: "Hubungkan requirement lowongan dengan skill dan bukti profil secara transparan.",
};

export default async function EvidenceMappingPage({ params }: EvidenceMappingPageProps) {
  const { id } = await params;
  return <AuthenticatedRoute><EvidenceMappingPageWorkspace jobId={id} /></AuthenticatedRoute>;
}
