import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Skor Kecocokan",
  description:
    "Pahami kesiapan profil untuk lowongan tertentu melalui requirement dan bukti yang transparan.",
};

export default async function FitScorePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;
  redirect(job ? `/lowongan/${encodeURIComponent(job)}/analisis` : "/lowongan");
}
