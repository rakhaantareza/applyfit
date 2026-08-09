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
      <AuthBrandPanel
        titleId="reset-brand-title"
        title="Amankan kembali akses ke ruang kerjamu."
        description="Tetapkan kata sandi baru untuk kembali ke profil, bukti, dan analisis lowongan yang tersimpan."
      />

      <section className="auth-form-panel" aria-labelledby="reset-title">
        <div className="login-card">
          <div className="login-heading">
            <p className="eyebrow">Pulihkan akses akun</p>
            <h2 id="reset-title">Buat kata sandi baru</h2>
            <p>
              Pilih kata sandi yang mudah kamu ingat dan memenuhi ketentuan dasar
              di bawah ini.
            </p>
          </div>

          <PasswordResetForm initialEmail={initialEmail} />
        </div>
      </section>
    </main>
  );
}
