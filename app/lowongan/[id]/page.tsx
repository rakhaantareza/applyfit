import type { Metadata } from "next";
import { PersistedJobDetail } from "./PersistedJobDetail";
import { AuthenticatedRoute } from "../../components/AuthenticatedRoute";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Detail Lowongan",
  description: "Lihat dan kelola konteks lowongan tersimpan di ApplyFit.",
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  return <AuthenticatedRoute><PersistedJobDetail jobId={id} /></AuthenticatedRoute>;
}
