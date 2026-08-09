import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { StableLink as Link } from "../components/StableLink";
import { MockRegistrationForm } from "./MockRegistrationForm";

export const metadata: Metadata = {
  title: "Buat Akun",
  description: "Buat akun ApplyFit untuk mulai menyusun profil karier dan bukti.",
};

export default function RegistrationPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel
        titleId="registration-brand-title"
        title="Bangun profil yang dapat menjelaskan kesiapanmu."
        description="Mulai dari arah karier, catat skill yang benar-benar kamu miliki, lalu hubungkan bukti yang mendukung setiap klaim."
      />

      <section className="auth-form-panel registration-panel" aria-labelledby="registration-title">
        <div className="login-card">
          <div className="login-heading">
            <p className="eyebrow">Mulai dengan profilmu</p>
            <h2 id="registration-title">Buat akun ApplyFit</h2>
            <p>
              Isi data dasar untuk mencoba alur pendaftaran pada versi frontend ini.
            </p>
          </div>

          <MockRegistrationForm />

          <p className="login-switch">
            Sudah punya akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
