import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { StableLink as Link } from "../components/StableLink";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke ApplyFit untuk melanjutkan analisis kesiapan kariermu.",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel titleId="login-brand-title" />

      <section className="auth-form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-heading">
            <h2 id="login-title">Masuk ke ApplyFit</h2>
            <p>Lanjutkan dari tempat terakhir kamu berhenti.</p>
          </div>

          <LoginForm />

          <p className="login-switch">
            Belum punya akun? <Link href="/daftar">Buat akun</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
