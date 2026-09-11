import { Message } from "../components/LanguageProvider";
import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { PageHeader } from "../components/ContentHeaders";
import { AccountSettings } from "./AccountSettings";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Pengaturan Akun",
  description: "Kelola identitas dan keamanan akun ApplyFit.",
};

export default function AccountSettingsPage() {
  return (
    <AuthenticatedRoute>
      <AppShell activeItem="Pengaturan" mainClassName="account-settings-main">
        <div className="page-container account-settings-page">
          <PageHeader
            title={<Message>{"Pengaturan"}</Message>}
            description={
              <Message>{"Nama, foto, dan keamanan akunmu."}</Message>
            }
          />
          <AccountSettings />
        </div>
      </AppShell>
    </AuthenticatedRoute>
  );
}
