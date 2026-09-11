import { Message } from "../components/LanguageProvider";
import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/ContentHeaders";
import { CareerProfileWorkspace } from "./CareerProfileWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Profil",
  description: "Atur bidang karier, target role, dan skillmu.",
};

export default function CareerProfilePage() {
  return (
    <AuthenticatedRoute>
      <AppShell activeItem="Profil" mainClassName="profile-main">
        <div className="page-container career-profile-page">
          <PageHeader
            title={<Message>{"Profil"}</Message>}
            description={
              <Message>
                {"Atur bidang karier, target role, dan skillmu."}
              </Message>
            }
          />
          <CareerProfileWorkspace />
        </div>
      </AppShell>
    </AuthenticatedRoute>
  );
}
