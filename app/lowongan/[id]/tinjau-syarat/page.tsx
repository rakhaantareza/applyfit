import { redirect } from "next/navigation";

type LegacyRequirementReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyRequirementReviewPage({
  params,
}: LegacyRequirementReviewPageProps) {
  const { id } = await params;
  redirect(`/lowongan/${encodeURIComponent(id)}/persyaratan`);
}
