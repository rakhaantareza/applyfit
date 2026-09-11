"use client";
import { useI18n } from "../components/LanguageProvider";

import { CircleCheckBig, Mail, Send } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  ActionButton,
  ActionLink,
  CtaArrow,
} from "../components/ActionControl";
import { InlineBackLink } from "../components/InlineBackLink";

type ResetResponse = {
  data?: { accepted?: boolean; message?: string };
  error?: { message?: string };
};

export function PasswordRecoveryForm() {
  const { t } = useI18n();
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
        throw new Error(
          result.error?.message ?? "Kode reset belum dapat dikirim.",
        );
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
        <p className="eyebrow">{t("Permintaan diterima")}</p>
        <h3>{t("Periksa emailmu")}</h3>
        <p>
          {t(
            "Jika akun terdaftar, kode untuk membuat kata sandi baru sudah dikirim ke",
          )}
          <strong> {submittedEmail}</strong>.
        </p>
        <ActionLink
          className="login-submit"
          href={`/reset-kata-sandi?email=${encodeURIComponent(submittedEmail)}`}
          size="auth"
        >
          {t("Masukkan kode")}
          <CtaArrow />
        </ActionLink>
        <button type="button" onClick={() => setSubmittedEmail("")}>
          {t("Gunakan email lain")}
        </button>
      </div>
    );
  }

  return (
    <form
      className="login-form recovery-form"
      onSubmit={submitRecovery}
      noValidate
    >
      <div className="login-field">
        <label htmlFor="recovery-email">Email</label>
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
          {t("Kami akan kirim kode 6 digit ke email ini.")}
        </small>
      </div>

      {t(error) ? (
        <p className="login-error" id="recovery-error" role="alert">
          {t(error)}
        </p>
      ) : null}

      <ActionButton
        className="login-submit"
        size="auth"
        type="submit"
        disabled={isSubmitting}
      >
        <span>{isSubmitting ? t("Mengirim kode…") : t("Kirim kode")}</span>
        <Send aria-hidden="true" size={17} strokeWidth={1.9} />
      </ActionButton>

      <InlineBackLink href="/login">{t("Kembali ke Login")}</InlineBackLink>
    </form>
  );
}

async function readResetResponse(response: Response): Promise<ResetResponse> {
  try {
    return (await response.json()) as ResetResponse;
  } catch {
    return {};
  }
}
