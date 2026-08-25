import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { EvidenceLibraryWorkspace } from "./EvidenceLibraryWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Portfolio & Pengalaman",
  description:
    "Kumpulkan proyek, pengalaman, sertifikat, repositori, dan portofolio yang mendukung skill di profil ApplyFit.",
};

export default function EvidenceLibraryPage() {
  return (
    <AuthenticatedRoute><AppShell activeItem="Portfolio & Pengalaman" mainClassName="evidence-main">
        <div className="page-container evidence-library-page">
          <header className="evidence-page-header responsive-page-header">
            <div>
              <p className="eyebrow">Portfolio & Pengalaman</p>
              <h1>Bukti nyata di balik setiap skill</h1>
              <p>
                Simpan hasil kerja, pengalaman, dan kredensial dalam satu tempat agar
                setiap klaim kemampuan dapat ditelusuri dengan jelas.
              </p>
            </div>
          </header>
          <EvidenceLibraryWorkspace />
        </div>
    </AppShell></AuthenticatedRoute>
  );
}
