import type { Metadata } from "next";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";
import { AppSidebar } from "../components/AppSidebar";
import { AdaptiveHomeDashboard } from "./AdaptiveHomeDashboard";

export const metadata: Metadata = {
  title: "Ringkasan",
  description: "Ruang kerja awal ApplyFit untuk memulai analisis kesiapan karier.",
};

export default function HomeDashboardPage() {
  return (
    <AuthenticatedRoute>
      <div className="app-shell">
        <AppSidebar activeItem="Ringkasan" />

        <main className="main-content home-main">
          <div className="page-container home-page">
            <AdaptiveHomeDashboard />
          </div>
        </main>
      </div>
    </AuthenticatedRoute>
  );
}
