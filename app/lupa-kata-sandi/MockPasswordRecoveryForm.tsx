"use client";

import { ArrowLeft, ArrowRight, CircleCheckBig, Mail, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

export function MockPasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLocaleLowerCase("id-ID");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setSubmittedEmail(normalizedEmail);
      setIsSubmitting(false);
    }, 650);
  }

  if (submittedEmail) {
    return (
      <div className="registration-success recovery-success" role="status">
        <span className="registration-success-icon" aria-hidden="true">
          <CircleCheckBig size={28} strokeWidth={1.8} />
        </span>
        <p className="eyebrow">Instruksi demo disiapkan</p>
        <h3>Periksa emailmu</h3>
        <p>
          Pada alur nyata, instruksi pengaturan ulang akan dikirim ke
          <strong> {submittedEmail}</strong>. Versi frontend ini tidak mengirim email.
        </p>
        <Link className="login-submit" href="/reset-kata-sandi">
          Buka formulir reset demo
          <ArrowRight aria-hidden="true" size={17} strokeWidth={1.9} />
        </Link>
        <button type="button" onClick={() => setSubmittedEmail("")}>
          Gunakan email lain
        </button>
      </div>
    );
  }

  return (
    <form className="login-form recovery-form" onSubmit={submitRecovery} noValidate>
      <div className="login-field">
        <label htmlFor="recovery-email">Email akun</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? "recovery-error" : "recovery-hint"}
            required
          />
        </div>
        <small id="recovery-hint">
          Gunakan email yang terhubung dengan akun ApplyFit.
        </small>
      </div>

      {error ? (
        <p className="login-error" id="recovery-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Menyiapkan instruksi…" : "Kirim instruksi demo"}</span>
        <Send aria-hidden="true" size={17} strokeWidth={1.9} />
      </button>

      <Link className="recovery-back-link" href="/login">
        <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
        Kembali ke halaman masuk
      </Link>
    </form>
  );
}
