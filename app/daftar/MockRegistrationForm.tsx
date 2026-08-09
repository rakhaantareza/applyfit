"use client";

import {
  ArrowRight,
  CircleCheckBig,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

type RegistrationPreview = {
  name: string;
  email: string;
};

export function MockRegistrationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState<RegistrationPreview | null>(null);

  function submitRegistration(event: FormEvent<HTMLFormElement>) {
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
    if (password.length < 8) {
      setError("Kata sandi perlu berisi minimal 8 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }
    if (!acceptTerms) {
      setError("Setujui penggunaan data demo untuk melanjutkan.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      const preview = { name: normalizedName, email: normalizedEmail };
      window.sessionStorage.setItem(
        "applyfit-demo-registration",
        JSON.stringify(preview),
      );
      setRegistration(preview);
      setIsSubmitting(false);
    }, 700);
  }

  if (registration) {
    return (
      <div className="registration-success" role="status">
        <span className="registration-success-icon" aria-hidden="true">
          <CircleCheckBig size={28} strokeWidth={1.8} />
        </span>
        <p className="eyebrow">Akun demo siap</p>
        <h3>Selamat datang, {registration.name}</h3>
        <p>
          Profil tiruan untuk <strong>{registration.email}</strong> sudah disiapkan
          di perangkat ini. Lanjutkan ke halaman masuk untuk mencoba alurnya.
        </p>
        <Link className="login-submit" href="/login">
          Lanjut ke halaman masuk
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
        </Link>
        <button type="button" onClick={() => setRegistration(null)}>
          Ubah data pendaftaran
        </button>
      </div>
    );
  }

  return (
    <form className="login-form registration-form" onSubmit={submitRegistration} noValidate>
      <div className="login-field">
        <label htmlFor="register-name">Nama lengkap</label>
        <div className="login-input-wrap">
          <UserRound aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Nama lengkapmu"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={error ? "registration-error" : undefined}
            required
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="register-email">Email</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? "registration-error" : undefined}
            required
          />
        </div>
      </div>

      <div className="login-field">
        <label htmlFor="register-password">Kata sandi</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="register-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="registration-password-hint"
            required
          />
          <button
            className="login-password-toggle"
            type="button"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
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
        <small id="registration-password-hint">Gunakan minimal 8 karakter.</small>
      </div>

      <div className="login-field">
        <label htmlFor="register-confirmation">Konfirmasi kata sandi</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="register-confirmation"
            name="confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ulangi kata sandi"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-describedby={error ? "registration-error" : undefined}
            required
          />
        </div>
      </div>

      <label className="login-remember registration-consent">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
        />
        <span aria-hidden="true" />
        Saya memahami bahwa akun ini hanya simulasi frontend dan datanya disimpan sementara.
      </label>

      {error ? (
        <p className="login-error" id="registration-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Menyiapkan akun demo…" : "Buat akun demo"}</span>
        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
      </button>
    </form>
  );
}
