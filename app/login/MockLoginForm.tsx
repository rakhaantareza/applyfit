"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

const demoAccount = {
  email: "aruna@example.com",
  password: "applyfit-demo",
};

export function MockLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function useDemoAccount() {
    setEmail(demoAccount.email);
    setPassword(demoAccount.password);
    setError("");
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLocaleLowerCase("id-ID");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi perlu berisi minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      const storage = remember ? window.localStorage : window.sessionStorage;
      storage.setItem(
        "applyfit-demo-session",
        JSON.stringify({ email: normalizedEmail, signedInAt: new Date().toISOString() }),
      );
      window.location.assign("/beranda");
    }, 650);
  }

  return (
    <form className="login-form" onSubmit={submitLogin} noValidate>
      <div className="login-field">
        <label htmlFor="login-email">Email</label>
        <div className="login-input-wrap">
          <Mail aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
        </div>
      </div>

      <div className="login-field">
        <div className="login-field-heading">
          <label htmlFor="login-password">Kata sandi</label>
          <Link href="/lupa-kata-sandi">Lupa kata sandi?</Link>
        </div>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? "login-error" : undefined}
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
      </div>

      <label className="login-remember">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
        <span aria-hidden="true" />
        Ingat sesi demo di perangkat ini
      </label>

      {error ? (
        <p className="login-error" id="login-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Menyiapkan ruang kerjamu…" : "Masuk ke ApplyFit"}</span>
        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
      </button>

      <div className="login-demo-divider"><span>atau</span></div>

      <button
        className="login-demo-button"
        type="button"
        onClick={useDemoAccount}
        disabled={isSubmitting}
      >
        Gunakan akun demo
      </button>

      <p className="login-mock-note">
        Simulasi frontend—data login tidak dikirim ke server.
      </p>
    </form>
  );
}
