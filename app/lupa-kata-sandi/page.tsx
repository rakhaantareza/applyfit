import { Message } from "../components/LanguageProvider";
import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { PasswordRecoveryForm } from "./PasswordRecoveryForm";

export const metadata: Metadata = {
  title: "Lupa Kata Sandi",
  description: "Siapkan instruksi pemulihan kata sandi akun ApplyFit.",
};

export default function PasswordRecoveryPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel titleId="recovery-brand-title" />

      <section className="auth-form-panel" aria-labelledby="recovery-title">
        <div className="login-card">
          <div className="login-heading">
            <h2 id="recovery-title">
              <Message>{"Lupa kata sandi?"}</Message>
            </h2>
            <p>
              <Message>
                {
                  "Masukkan email akunmu. Kami akan kirim kode untuk membuat kata sandi baru."
                }
              </Message>
            </p>
          </div>

          <PasswordRecoveryForm />
        </div>
      </section>
    </main>
  );
}
