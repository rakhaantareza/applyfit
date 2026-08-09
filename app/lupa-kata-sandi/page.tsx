import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { MockPasswordRecoveryForm } from "./MockPasswordRecoveryForm";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Siapkan instruksi pemulihan kata sandi akun ApplyFit.",
};

export default function PasswordRecoveryPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel
        titleId="recovery-brand-title"
        title="Kembali ke analisis tanpa kehilangan alurmu."
        description="Pulihkan akses untuk melanjutkan profil karier, pustaka bukti, dan lowongan yang sedang kamu analisis."
      />

      <section className="auth-form-panel" aria-labelledby="recovery-title">
        <div className="login-card">
          <div className="login-heading">
            <p className="eyebrow">Pulihkan akses</p>
            <h2 id="recovery-title">Lupa kata sandi?</h2>
            <p>
              Masukkan email akunmu. Kami akan menyimulasikan langkah pemulihan
              tanpa mengirim data ke server.
            </p>
          </div>

          <MockPasswordRecoveryForm />
        </div>
      </section>
    </main>
  );
}
