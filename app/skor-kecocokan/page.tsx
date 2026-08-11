import type { Metadata } from "next";
import { AppSidebar } from "../components/AppSidebar";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";
import { FitScoreWorkspace } from "../components/FitScoreWorkspace";

export const metadata: Metadata = {
  title: "Skor Kecocokan",
  description:
    "Pahami kesiapan profil untuk lowongan tertentu melalui requirement dan bukti yang transparan.",
};

export default function FitScorePage() {
  return (
    <AuthenticatedRoute>
      <div className="app-shell">
        <AppSidebar activeItem="Skor Kecocokan" />
        <main className="main-content" id="top">
          <FitScoreWorkspace />
        </main>
      </div>
    </AuthenticatedRoute>
  );
}
