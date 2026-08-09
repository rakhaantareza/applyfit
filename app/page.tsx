import type { Metadata } from "next";
import { AppSidebar } from "./components/AppSidebar";
import { FitScoreWorkspace } from "./components/FitScoreWorkspace";
import { AuthenticatedRoute } from "./components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Skor Kecocokan",
  description: "Pahami kesiapan profil untuk lowongan tertentu melalui requirement dan bukti yang transparan.",
};

export default function Home() {
  return (
    <AuthenticatedRoute>
      <div className="app-shell">
        <AppSidebar />
        <main className="main-content" id="top"><FitScoreWorkspace /></main>
      </div>
    </AuthenticatedRoute>
  );
}
