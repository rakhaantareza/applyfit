import { Message } from "../components/LanguageProvider";
import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/ContentHeaders";
import { EvidenceLibraryWorkspace } from "./EvidenceLibraryWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Portfolio & Pengalaman",
  description:
    "Kumpulkan proyek, pengalaman, sertifikat, repositori, dan portofolio yang mendukung skill di profil ApplyFit.",
};

export default function EvidenceLibraryPage() {
  return (
    <AuthenticatedRoute>
      <AppShell
        activeItem="Portfolio & Pengalaman"
        mainClassName="evidence-main"
      >
        <div className="page-container evidence-library-page">
          <PageHeader
            title={<Message>{"Portfolio & Pengalaman"}</Message>}
            description={
              <>
                <Message>
                  {"Hasil kerja dan pengalaman yang mendukung skillmu."}
                </Message>
              </>
            }
          />
          <EvidenceLibraryWorkspace />
        </div>
      </AppShell>
    </AuthenticatedRoute>
  );
}
