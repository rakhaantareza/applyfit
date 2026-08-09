import type { Metadata } from "next";
import { AppSidebar } from "../components/AppSidebar";
import { EvidenceLibraryWorkspace } from "./EvidenceLibraryWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Pustaka Bukti",
  description:
    "Kumpulkan proyek, pengalaman, sertifikat, repositori, dan portofolio yang mendukung skill di profil ApplyFit.",
};

export default function EvidenceLibraryPage() {
  return (
    <AuthenticatedRoute><div className="app-shell">
      <AppSidebar activeItem="Pustaka Bukti" />

      <main className="main-content evidence-main">
        <div className="page-container evidence-library-page">
          <header className="evidence-page-header responsive-page-header">
            <div>
              <p className="eyebrow">Pustaka bukti</p>
              <h1>Bukti nyata di balik setiap skill</h1>
              <p>
                Simpan hasil kerja, pengalaman, dan kredensial dalam satu tempat agar
                setiap klaim kemampuan dapat ditelusuri dengan jelas.
              </p>
            </div>
          </header>
          <EvidenceLibraryWorkspace />
        </div>
      </main>
    </div></AuthenticatedRoute>
  );
}
