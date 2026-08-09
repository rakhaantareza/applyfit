"use client";

import {
  ArrowRight,
  CircleCheckBig,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";

type AuthResponse = {
  data?: {
    user?: { id: string; email: string } | null;
    requireEmailVerification?: boolean;
    verified?: boolean;
    accepted?: boolean;
  };
  error?: { code?: string; message?: string };
};

export function RegistrationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim().replace(/\s+/g, " ");
    const normalizedEmail = email.trim().toLocaleLowerCase("id-ID");
    if (normalizedName.length < 2) {
      setError("Masukkan nama lengkap yang dapat dikenali.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi perlu berisi minimal 6 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }
    if (!acceptTerms) {
      setError("Setujui penggunaan data untuk membuat akun ApplyFit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          password,
        }),
      });
      const result = await readAuthResponse(response);
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Akun belum dapat dibuat. Coba lagi.");
      }

      if (result.data?.requireEmailVerification) {
        setVerificationEmail(normalizedEmail);
        setIsSubmitting(false);
        return;
      }

      if (!result.data?.user) {
        throw new Error("Akun dibuat, tetapi sesi belum dapat disiapkan. Silakan masuk.");
      }
      window.location.assign("/beranda");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Akun belum dapat dibuat. Coba lagi.",
      );
      setIsSubmitting(false);
    }
  }

  async function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResendMessage("");
    const code = verificationCode.replace(/\D/g, "");
    if (code.length !== 6) {
      setError("Masukkan kode verifikasi 6 digit dari emailmu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, otp: code }),
      });
      const result = await readAuthResponse(response);
      if (!response.ok || !result.data?.verified) {
        throw new Error(result.error?.message ?? "Kode verifikasi tidak valid.");
      }
      window.location.assign("/beranda");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Email belum dapat diverifikasi. Coba lagi.",
      );
      setIsSubmitting(false);
    }
  }

  async function resendVerification() {
    setError("");
    setResendMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const result = await readAuthResponse(response);
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Kode belum dapat dikirim ulang.");
      }
      setResendMessage("Kode verifikasi baru sudah dikirim ke emailmu.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Kode belum dapat dikirim ulang.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (verificationEmail) {
    return (
      <form className="login-form registration-verification" onSubmit={submitVerification} noValidate>
        <span className="registration-success-icon" aria-hidden="true">
          <CircleCheckBig size={26} strokeWidth={1.8} />
        </span>
        <div className="registration-verification-copy">
          <p className="eyebrow">Satu langkah lagi</p>
          <h3>Verifikasi emailmu</h3>
          <p>
            Masukkan kode 6 digit yang dikirim ke <strong>{verificationEmail}</strong>.
          </p>
        </div>

        <div className="login-field">
          <label htmlFor="registration-verification-code">Kode verifikasi</label>
          <div className="login-input-wrap">
            <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
            <input
              id="registration-verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
              aria-describedby={error ? "registration-error" : undefined}
              required
            />
          </div>
        </div>

        {error ? <p className="login-error" id="registration-error" role="alert">{error}</p> : null}
        {resendMessage ? <p className="registration-success-message" role="status">{resendMessage}</p> : null}

        <button className="login-submit" type="submit" disabled={isSubmitting}>
          <span>{isSubmitting ? "Memverifikasi…" : "Verifikasi dan lanjutkan"}</span>
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
        </button>
        <button
          className="login-secondary-action"
          type="button"
          disabled={isSubmitting}
          onClick={resendVerification}
        >
          <RefreshCw aria-hidden="true" size={15} strokeWidth={1.8} />
          Kirim ulang kode
        </button>
      </form>
    );
  }

  return (
    <form className="login-form registration-form" onSubmit={submitRegistration} noValidate>
      <div className="login-field">
        <label htmlFor="register-name">Nama lengkap</label>
        <div className="login-input-wrap">
          <UserRound aria-hidden="true" size={18} strokeWidth={1.8} />
          <input id="register-name" name="name" autoComplete="name" placeholder="Nama lengkapmu" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="register-email">Email</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <input id="register-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="register-password">Kata sandi</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Minimal 6 karakter" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className="login-password-toggle" type="button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPassword} onClick={() => setShowPassword((current) => !current)}>
            {showPassword ? <EyeOff aria-hidden="true" size={18} strokeWidth={1.8} /> : <Eye aria-hidden="true" size={18} strokeWidth={1.8} />}
          </button>
        </div>
        <small>Gunakan minimal 6 karakter.</small>
      </div>

      <div className="login-field">
        <label htmlFor="register-confirmation">Konfirmasi kata sandi</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input id="register-confirmation" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Ulangi kata sandi" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        </div>
      </div>

      <label className="login-remember registration-consent">
        <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
        <span aria-hidden="true" />
        Saya setuju data akun digunakan untuk menyediakan ruang kerja ApplyFit.
      </label>

      {error ? <p className="login-error" id="registration-error" role="alert">{error}</p> : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Membuat akun…" : "Buat akun ApplyFit"}</span>
        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
      </button>
    </form>
  );
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  try {
    return await response.json() as AuthResponse;
  } catch {
    return {};
  }
}
