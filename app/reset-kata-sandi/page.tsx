import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { PasswordResetForm } from "./PasswordResetForm";

export const metadata: Metadata = {
  title: "Reset Kata Sandi",
  description: "Atur kata sandi baru untuk akun ApplyFit.",
};

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialEmail = typeof params.email === "string" ? params.email : "";
  return (
    <main className="auth-page">
      <AuthBrandPanel titleId="reset-brand-title" />

      <section className="auth-form-panel" aria-labelledby="reset-title">
        <div className="login-card">
          <div className="login-heading">
            <h2 id="reset-title">Buat kata sandi baru</h2>
            <p>Masukkan kode dari emailmu, lalu buat kata sandi baru.</p>
          </div>

          <PasswordResetForm initialEmail={initialEmail} />
        </div>
      </section>
    </main>
  );
}
