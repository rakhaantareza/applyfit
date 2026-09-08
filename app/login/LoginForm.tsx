"use client";

import { Eye, EyeOff, LockKeyhole, Mail, Play } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ActionButton, CtaArrow } from "../components/ActionControl";
import { StableLink as Link } from "../components/StableLink";

type AuthResponse = {
  data?: { user?: { id: string; email: string } };
  error?: { code?: string; message?: string };
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<"account" | "demo" | null>(null);
  const [error, setError] = useState("");

  async function openDemo() {
    setError("");
    setPendingAction("demo");

    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      const result = await readAuthResponse(response);
      if (!response.ok || !result.data?.user) {
        throw new Error(result.error?.message ?? "Demo belum dapat dibuka. Coba lagi.");
      }

      window.location.assign(getLoginDestination());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Demo belum dapat dibuka. Coba lagi.",
      );
      setPendingAction(null);
    }
  }

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

    setPendingAction("account");
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
      setPendingAction(null);
    }
  }

  return (
    <form className="login-form" onSubmit={submitLogin} noValidate>
      <ActionButton
        className="login-demo-button"
        size="auth"
        type="button"
        variant="secondary"
        disabled={pendingAction !== null}
        onClick={openDemo}
      >
        <Play aria-hidden="true" size={15} strokeWidth={1.9} />
        <span>{pendingAction === "demo" ? "Membuka demo…" : "Coba demo"}</span>
      </ActionButton>

      <div className="login-demo-divider"><span>atau masuk dengan akunmu</span></div>

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
        <label htmlFor="login-password">Kata sandi</label>
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

      <ActionButton className="login-submit" size="auth" type="submit" disabled={pendingAction !== null}>
        <span>{pendingAction === "account" ? "Masuk…" : "Masuk"}</span>
        <CtaArrow />
      </ActionButton>

      <Link className="login-forgot-link" href="/lupa-kata-sandi">
        Lupa kata sandi?
      </Link>
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
