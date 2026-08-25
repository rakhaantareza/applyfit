"use client";

import { ArrowLeft, ArrowRight, CircleCheckBig, Mail, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

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
          Jika akun terdaftar, kode pengaturan ulang sudah dikirim ke
          <strong> {submittedEmail}</strong>.
        </p>
        <Link className="login-submit" href={`/reset-kata-sandi?email=${encodeURIComponent(submittedEmail)}`}>
          Masukkan kode reset
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
          <input id="recovery-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby={error ? "recovery-error" : "recovery-hint"} required />
        </div>
        <small id="recovery-hint">Kode 6 digit akan dikirim ke email akunmu.</small>
      </div>

      {error ? <p className="login-error" id="recovery-error" role="alert">{error}</p> : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Mengirim kode…" : "Kirim kode reset"}</span>
        <Send aria-hidden="true" size={17} strokeWidth={1.9} />
      </button>

      <Link className="recovery-back-link" href="/login">
        <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
        Kembali ke halaman masuk
      </Link>
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
