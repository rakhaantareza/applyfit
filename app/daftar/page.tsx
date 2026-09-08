import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { StableLink as Link } from "../components/StableLink";
import { RegistrationForm } from "./RegistrationForm";

export const metadata: Metadata = {
  title: "Buat Akun",
  description: "Buat akun ApplyFit untuk mulai menyusun profil karier dan bukti.",
};

export default function RegistrationPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel titleId="registration-brand-title" />

      <section className="auth-form-panel registration-panel" aria-labelledby="registration-title">
        <div className="login-card">
          <div className="login-heading">
            <h2 id="registration-title">Buat akun ApplyFit</h2>
            <p>Buat profilmu, tambahkan skill, lalu mulai cek lowongan yang kamu incar.</p>
          </div>

          <RegistrationForm />

          <p className="login-switch">
            Sudah punya akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
