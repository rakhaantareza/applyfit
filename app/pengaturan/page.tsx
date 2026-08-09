import type { Metadata } from "next";
import { AppSidebar } from "../components/AppSidebar";
import { AccountSettings } from "./AccountSettings";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Pengaturan Akun",
  description: "Kelola identitas dan keamanan akun ApplyFit.",
};

export default function AccountSettingsPage() {
  return (
    <AuthenticatedRoute><div className="app-shell">
      <AppSidebar activeItem={null} />
      <main className="main-content account-settings-main">
        <div className="page-container account-settings-page">
          <header className="account-settings-page-header">
            <div>
              <p className="eyebrow">Akun dan keamanan</p>
              <h1>Pengaturan akun</h1>
              <p>Kelola identitas login secara terpisah dari arah dan profil kariermu.</p>
            </div>
          </header>
          <AccountSettings />
        </div>
      </main>
    </div></AuthenticatedRoute>
  );
}
