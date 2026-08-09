import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { StableLink as Link } from "../components/StableLink";
import { MockLoginForm } from "./MockLoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke ApplyFit untuk melanjutkan analisis kesiapan kariermu.",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel
        titleId="login-brand-title"
        title="Kenali kesiapanmu sebelum mengirim lamaran."
        description="Masuk untuk melanjutkan alur dari requirement lowongan menuju skill, bukti, dan analisis yang dapat kamu telusuri."
      />

      <section className="auth-form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-heading">
            <p className="eyebrow">Selamat datang kembali</p>
            <h2 id="login-title">Masuk ke ruang kerjamu</h2>
            <p>
              Gunakan email apa pun untuk mencoba alur login pada versi frontend ini.
            </p>
          </div>

          <MockLoginForm />

          <p className="login-switch">
            Belum punya akun? <Link href="/daftar">Buat akun</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
