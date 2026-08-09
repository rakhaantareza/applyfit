"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { type FormEvent, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

type AuthResponse = {
  data?: { user?: { id: string; email: string } };
  error?: { code?: string; message?: string };
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
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
    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const result = await readAuthResponse(response);
      if (!response.ok || !result.data?.user) {
        throw new Error(result.error?.message ?? "Email atau kata sandi tidak sesuai.");
      }

      window.location.assign(getLoginDestination());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "ApplyFit belum dapat memproses proses masuk. Coba lagi.",
      );
      setIsSubmitting(false);
    }
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

      {error ? (
        <p className="login-error" id="login-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Memeriksa akunmu…" : "Masuk ke ApplyFit"}</span>
        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
      </button>
    </form>
  );
}

function getLoginDestination() {
  const requestedPath = new URLSearchParams(window.location.search).get("next");
  if (!requestedPath?.startsWith("/") || requestedPath.startsWith("//")) {
    return "/beranda";
  }

  const destination = new URL(requestedPath, window.location.origin);
  if (destination.origin !== window.location.origin) return "/beranda";
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  try {
    return await response.json() as AuthResponse;
  } catch {
    return {};
  }
}
