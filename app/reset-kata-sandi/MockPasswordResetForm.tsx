"use client";

import {
  ArrowRight,
  Check,
  CircleCheckBig,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { StableLink as Link } from "../components/StableLink";

export function MockPasswordResetForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const requirements = [
    { label: "Minimal 8 karakter", met: password.length >= 8 },
    { label: "Memiliki huruf", met: /[A-Za-z]/.test(password) },
    { label: "Memiliki angka", met: /\d/.test(password) },
  ];

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (requirements.some((requirement) => !requirement.met)) {
      setError("Kata sandi belum memenuhi semua ketentuan.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
    }, 650);
  }

  if (isComplete) {
    return (
      <div className="registration-success reset-success" role="status">
        <span className="registration-success-icon" aria-hidden="true">
          <CircleCheckBig size={28} strokeWidth={1.8} />
        </span>
        <p className="eyebrow">Reset demo selesai</p>
        <h3>Kata sandi berhasil diperbarui</h3>
        <p>
          Perubahan ini hanya disimulasikan di browser. Kamu dapat kembali ke halaman
          masuk dan melanjutkan eksplorasi ApplyFit.
        </p>
        <Link className="login-submit" href="/login">
          Masuk dengan kata sandi baru
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
        </Link>
      </div>
    );
  }

  return (
    <form className="login-form reset-form" onSubmit={submitReset} noValidate>
      <div className="login-field">
        <label htmlFor="reset-password">Kata sandi baru</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="reset-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Buat kata sandi baru"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="reset-password-requirements"
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

      <ul className="reset-requirements" id="reset-password-requirements">
        {requirements.map((requirement) => (
          <li className={requirement.met ? "met" : undefined} key={requirement.label}>
            <span aria-hidden="true">
              {requirement.met ? <Check size={11} strokeWidth={2.4} /> : null}
            </span>
            {requirement.label}
          </li>
        ))}
      </ul>

      <div className="login-field">
        <label htmlFor="reset-confirmation">Konfirmasi kata sandi baru</label>
        <div className="login-input-wrap">
          <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.8} />
          <input
            id="reset-confirmation"
            name="confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Ulangi kata sandi baru"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-describedby={error ? "reset-error" : undefined}
            required
          />
        </div>
      </div>

      {error ? (
        <p className="login-error" id="reset-error" role="alert">
          {error}
        </p>
      ) : null}

      <button className="login-submit" type="submit" disabled={isSubmitting}>
        <span>{isSubmitting ? "Memperbarui kata sandi…" : "Simpan kata sandi baru"}</span>
        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.9} />
      </button>
    </form>
  );
}
