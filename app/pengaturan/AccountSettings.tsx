"use client";

/* eslint-disable @next/next/no-img-element -- Auth profile photos may come from user-provided HTTPS hosts. */

import {
  BadgeCheck,
  Camera,
  KeyRound,
  LoaderCircle,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  getAccountInitials,
  getAuthDisplayName,
  useAuthSession,
} from "../components/AuthSessionProvider";
import { StableLink as Link } from "../components/StableLink";

type AccountResponse = {
  data?: {
    account?: {
      name: string;
      avatarUrl: string | null;
      email: string;
      emailVerified: boolean;
    };
    accepted?: boolean;
  };
  error?: { message?: string };
};

export function AccountSettings() {
  const { user, loading, refresh } = useAuthSession();
  const [name, setName] = useState(() => getAuthDisplayName(user));
  const [avatarUrl, setAvatarUrl] = useState(() => user?.profile?.avatar_url?.trim() || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");

  const displayName = name.trim() || getAuthDisplayName(user);
  const initials = getAccountInitials(displayName);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, avatarUrl }),
      });
      const result = await readAccountResponse(response);
      if (!response.ok || !result.data?.account) {
        throw new Error(result.error?.message ?? "Profil akun belum dapat disimpan.");
      }
      setName(result.data.account.name);
      setAvatarUrl(result.data.account.avatarUrl ?? "");
      await refresh();
      setProfileMessage("Identitas akun berhasil diperbarui.");
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Profil akun belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function requestPasswordReset() {
    if (!user?.email) return;
    setSecurityError("");
    setSecurityMessage("");
    setIsRequestingReset(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const result = await readAccountResponse(response);
      if (!response.ok) {
        throw new Error(result.error?.message ?? "Kode reset belum dapat dikirim.");
      }
      setSecurityMessage("Kode 6 digit sudah dikirim. Lanjutkan ke formulir perubahan kata sandi.");
    } catch (requestError) {
      setSecurityError(
        requestError instanceof Error
          ? requestError.message
          : "Kode reset belum dapat dikirim.",
      );
    } finally {
      setIsRequestingReset(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="account-settings-loading" aria-live="polite">
        <LoaderCircle className="spin" aria-hidden="true" size={22} />
        Memuat pengaturan akun…
      </div>
    );
  }

  return (
    <div className="account-settings-stack">
      <section className="account-settings-card" aria-labelledby="account-profile-title">
        <div className="account-settings-heading">
          <span aria-hidden="true"><UserRound size={19} strokeWidth={1.8} /></span>
          <div>
            <p className="eyebrow">Identitas akun</p>
            <h2 id="account-profile-title">Nama dan foto profil</h2>
            <p>Informasi ini tampil di menu akun tanpa mengubah data Profil Karier.</p>
          </div>
        </div>

        <form className="account-profile-form" onSubmit={saveProfile}>
          <div className="account-avatar-preview" aria-label={`Pratinjau foto profil ${displayName}`}>
            {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{initials}</span>}
          </div>
          <div className="account-profile-fields">
            <label>
              <span>Nama lengkap</span>
              <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={80} required />
            </label>
            <label>
              <span>URL foto profil</span>
              <div className="account-input-with-icon">
                <Camera aria-hidden="true" size={17} strokeWidth={1.8} />
                <input type="url" inputMode="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://…" />
              </div>
              <small>Gunakan URL HTTPS. Kosongkan untuk memakai inisial nama.</small>
            </label>
            <div className="account-form-footer">
              <span aria-live="polite">
                {profileError ? <em className="account-message error">{profileError}</em> : null}
                {profileMessage ? <em className="account-message success">{profileMessage}</em> : null}
              </span>
              <button className="career-button primary" type="submit" disabled={isSaving}>
                {isSaving ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : <Save aria-hidden="true" size={16} strokeWidth={1.9} />}
                {isSaving ? "Menyimpan…" : "Simpan identitas"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="account-settings-card account-security-card" aria-labelledby="account-security-title">
        <div className="account-settings-heading">
          <span aria-hidden="true"><ShieldCheck size={19} strokeWidth={1.8} /></span>
          <div>
            <p className="eyebrow">Akses dan keamanan</p>
            <h2 id="account-security-title">Email dan kata sandi</h2>
            <p>Identitas login dikelola langsung oleh InsForge Auth.</p>
          </div>
        </div>

        <div className="account-security-rows">
          <div className="account-security-row">
            <span className="account-security-icon" aria-hidden="true"><Mail size={18} strokeWidth={1.8} /></span>
            <div>
              <small>Email akun</small>
              <strong>{user.email}</strong>
              <span className="account-verified-status">
                <BadgeCheck aria-hidden="true" size={14} strokeWidth={1.9} />
                {user.emailVerified ? "Terverifikasi" : "Belum terverifikasi"}
              </span>
            </div>
            <span className="account-readonly-label">Identitas login</span>
          </div>

          <div className="account-security-row password-row">
            <span className="account-security-icon" aria-hidden="true"><KeyRound size={18} strokeWidth={1.8} /></span>
            <div>
              <small>Kata sandi</small>
              <strong>Ubah dengan kode email</strong>
              <p>Kode reset dikirim ke email terverifikasi agar perubahan tetap aman.</p>
            </div>
            <button className="career-button secondary" type="button" disabled={isRequestingReset} onClick={requestPasswordReset}>
              {isRequestingReset ? "Mengirim…" : "Kirim kode"}
            </button>
          </div>
        </div>

        {securityError ? <p className="account-message error" role="alert">{securityError}</p> : null}
        {securityMessage ? (
          <div className="account-security-next" role="status">
            <span>{securityMessage}</span>
            <Link href={`/reset-kata-sandi?email=${encodeURIComponent(user.email)}`}>Masukkan kode</Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

async function readAccountResponse(response: Response): Promise<AccountResponse> {
  try {
    return await response.json() as AccountResponse;
  } catch {
    return {};
  }
}
