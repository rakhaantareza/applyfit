"use client";

import { CircleCheckBig, Mail, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ActionButton, ActionLink, CtaArrow } from "../components/ActionControl";
import { InlineBackLink } from "../components/InlineBackLink";

type ResetResponse = {
  data?: { accepted?: boolean; message?: string };
  error?: { message?: string };
};

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLocaleLowerCase("id-ID");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = await readResetResponse(response);
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Kode reset belum dapat dikirim.");
      }
      setSubmittedEmail(normalizedEmail);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Kode reset belum dapat dikirim. Coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="registration-success recovery-success" role="status">
        <span className="registration-success-icon" aria-hidden="true">
          <CircleCheckBig size={28} strokeWidth={1.8} />
        </span>
        <p className="eyebrow">Permintaan diterima</p>
        <h3>Periksa emailmu</h3>
        <p>
          Jika akun terdaftar, kode untuk membuat kata sandi baru sudah dikirim ke
          <strong> {submittedEmail}</strong>.
        </p>
        <ActionLink className="login-submit" href={`/reset-kata-sandi?email=${encodeURIComponent(submittedEmail)}`} size="auth">
          Masukkan kode
          <CtaArrow />
        </ActionLink>
        <button type="button" onClick={() => setSubmittedEmail("")}>
          Gunakan email lain
        </button>
      </div>
    );
  }

  return (
    <form className="login-form recovery-form" onSubmit={submitRecovery} noValidate>
      <div className="login-field">
        <label htmlFor="recovery-email">Email</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <input id="recovery-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby={error ? "recovery-error" : "recovery-hint"} required />
        </div>
        <small id="recovery-hint">Kami akan kirim kode 6 digit ke email ini.</small>
      </div>

      {error ? <p className="login-error" id="recovery-error" role="alert">{error}</p> : null}

      <ActionButton className="login-submit" size="auth" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Mengirim kode…" : "Kirim kode"}</span>
        <Send aria-hidden="true" size={17} strokeWidth={1.9} />
      </ActionButton>

      <InlineBackLink href="/login">
        Kembali ke Login
      </InlineBackLink>
    </form>
  );
}

async function readResetResponse(response: Response): Promise<ResetResponse> {
  try {
    return await response.json() as ResetResponse;
  } catch {
    return {};
  }
}
