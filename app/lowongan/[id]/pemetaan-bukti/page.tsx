import { redirect } from "next/navigation";

type LegacyProfileMatchingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyProfileMatchingPage({
  params,
}: LegacyProfileMatchingPageProps) {
  const { id } = await params;
  redirect(`/lowongan/${encodeURIComponent(id)}/cocokkan-profil`);
}
