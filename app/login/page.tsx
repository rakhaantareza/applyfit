import { Message } from "../components/LanguageProvider";
import type { Metadata } from "next";
import { AuthBrandPanel } from "../components/AuthBrandPanel";
import { StableLink as Link } from "../components/StableLink";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke ApplyFit untuk melanjutkan analisis kesiapan kariermu.",
};

export default function LoginPage() {
  return (
    <main className="auth-page">
      <AuthBrandPanel titleId="login-brand-title" />

      <section className="auth-form-panel" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-heading">
            <h2 id="login-title">
              <Message>{"Masuk ke ApplyFit"}</Message>
            </h2>
            <p>
              <Message>
                {"Lanjutkan dari tempat terakhir kamu berhenti."}
              </Message>
            </p>
          </div>

          <LoginForm />

          <p className="login-switch">
            <Message>{"Belum punya akun?"}</Message>{" "}
            <Link href="/daftar">
              <Message>{"Buat akun"}</Message>
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
