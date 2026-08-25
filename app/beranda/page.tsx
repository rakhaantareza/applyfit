import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";
import { AdaptiveHomeDashboard } from "./AdaptiveHomeDashboard";

export const metadata: Metadata = {
  title: "Ringkasan",
  description: "Lanjutkan lowongan terakhir dan lihat langkah berikutnya di ApplyFit.",
};

export default function HomeDashboardPage() {
  return (
    <AuthenticatedRoute>
      <AppShell activeItem="Ringkasan" mainClassName="home-main">
        <div className="page-container home-page summary-page">
          <AdaptiveHomeDashboard />
        </div>
      </AppShell>
    </AuthenticatedRoute>
  );
}
