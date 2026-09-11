"use client";
import { useI18n } from "../components/LanguageProvider";

import {
  Check,
  CircleCheckBig,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  ActionButton,
  ActionLink,
  CtaArrow,
} from "../components/ActionControl";

type ResetResponse = {
  data?: { updated?: boolean; message?: string };
  error?: { message?: string };
};

export function PasswordResetForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const requirements = [
    { label: "Minimal 6 karakter", met: password.length >= 6 },
  ];

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLocaleLowerCase("id-ID");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Masukkan kode reset 6 digit dari emailmu.");
      return;
    }
    if (requirements.some((requirement) => !requirement.met)) {
      setError("Kata sandi belum memenuhi ketentuan.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          code,
          newPassword: password,
        }),
      });
      const result = await readResetResponse(response);
      if (!response.ok || !result.data?.updated) {
        throw new Error(
          result.error?.message ??
            "Kode reset tidak valid atau sudah kedaluwarsa.",
        );
      }
      setIsComplete(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Kata sandi belum dapat diperbarui. Coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="registration-success reset-success" role="status">
        <span className="registration-success-icon" aria-hidden="true">
          <CircleCheckBig size={28} strokeWidth={1.8} />
        </span>
        <p className="eyebrow">{t("Kata sandi diperbarui")}</p>
        <h3>{t("Kata sandi baru tersimpan")}</h3>
        <p>{t("Masuk kembali ke ApplyFit menggunakan kata sandi barumu.")}</p>
        <ActionLink className="login-submit" href="/login" size="auth">
          {t("Kembali ke Login")}
          <CtaArrow />
        </ActionLink>
      </div>
    );
  }

  return (
    <form className="login-form reset-form" onSubmit={submitReset} noValidate>
      <div className="login-field">
        <label htmlFor="reset-email">Email</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            required
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="reset-code">{t("Kode verifikasi")}</label>
        <div className="login-input-wrap">
          <KeyRound aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            required
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="reset-password">{t("Kata sandi baru")}</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="reset-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("Buat kata sandi baru")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="reset-password-requirements"
            required
          />
          <button
            className="login-password-toggle"
            type="button"
            aria-label={
              showPassword
                ? t("Sembunyikan kata sandi")
                : t("Tampilkan kata sandi")
            }
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} strokeWidth={1.8} />
            ) : (
              <Eye aria-hidden="true" size={18} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      <ul className="reset-requirements" id="reset-password-requirements">
        {requirements.map((requirement) => (
          <li
            className={requirement.met ? "met" : undefined}
            key={requirement.label}
          >
            <span aria-hidden="true">
              {requirement.met ? <Check size={11} strokeWidth={2.4} /> : null}
            </span>
            {t(requirement.label)}
          </li>
        ))}
      </ul>

      <div className="login-field">
        <label htmlFor="reset-confirmation">
          {t("Konfirmasi kata sandi baru")}
        </label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="reset-confirmation"
            name="confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder={t("Ulangi kata sandi baru")}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
        </div>
      </div>

      {t(error) ? (
        <p className="login-error" id="reset-error" role="alert">
          {t(error)}
        </p>
      ) : null}

      <ActionButton
        className="login-submit"
        size="auth"
        type="submit"
        disabled={isSubmitting}
      >
        <span>
          {isSubmitting ? t("Menyimpan kata sandi…") : t("Simpan kata sandi")}
        </span>
        <CtaArrow />
      </ActionButton>
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
