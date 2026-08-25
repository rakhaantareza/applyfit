import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { CareerProfileWorkspace } from "./CareerProfileWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Profil Karier",
  description:
    "Lihat target karier, bidang pekerjaan, dan keahlian yang menjadi dasar analisis ApplyFit.",
};

export default function CareerProfilePage() {
  return (
    <AuthenticatedRoute><AppShell activeItem="Profil" mainClassName="profile-main">
        <div className="page-container career-profile-page">
          <header className="profile-page-header responsive-page-header">
            <div>
              <p className="eyebrow">Profil karier</p>
              <h1>Arah karier dan keahlianmu</h1>
              <p>
                Profil ini menjadi konteks utama saat ApplyFit membaca requirement
                lowongan dan menelusuri bukti yang relevan.
              </p>
            </div>
          </header>
          <CareerProfileWorkspace />
        </div>
    </AppShell></AuthenticatedRoute>
  );
}
