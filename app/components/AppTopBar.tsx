"use client";

/* eslint-disable @next/next/no-img-element -- Account avatars can use user-provided HTTPS hosts. */

import {
  ArrowLeft,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  getAccountInitials,
  getAuthDisplayName,
  useAuthSession,
} from "./AuthSessionProvider";
import {
  AppMobileMenuButton,
  AppSidebarToggle,
} from "./AppSidebar";
import {
  type AppearancePreference,
  useAppearance,
} from "./AppearanceProvider";

type AppTopBarProps = {
  backHref?: string;
  context?: readonly string[];
  showSidebarControls?: boolean;
  variant?: "app" | "focus";
};

const appearanceOptions: Array<{
  icon: LucideIcon;
  label: string;
  value: AppearancePreference;
}> = [
  { icon: Monitor, label: "System", value: "system" },
  { icon: Sun, label: "Light", value: "light" },
  { icon: Moon, label: "Dark", value: "dark" },
];

export function AppTopBar({
  backHref,
  context = [],
  showSidebarControls = false,
  variant = "app",
}: AppTopBarProps) {
  return (
    <header className={`app-topbar app-topbar-${variant}`}>
      <div className="app-topbar-leading">
        <Link
          className="app-topbar-brand"
          href="/beranda"
          aria-label="ApplyFit beranda"
        >
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ApplyFit</span>
        </Link>
        {showSidebarControls ? (
          <div className="app-topbar-navigation-controls">
            <AppSidebarToggle />
            <AppMobileMenuButton />
          </div>
        ) : null}
      </div>

      {context.length > 0 ? (
        <nav className="app-topbar-context" aria-label="Konteks halaman">
          {context.map((segment, index) => (
            <Fragment key={`${segment}-${index}`}>
              {index > 0 ? (
                <span className="shell-breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              ) : null}
              {index === 0 && backHref ? (
                <Link className="app-topbar-back" href={backHref}>
                  <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.8} />
                  {segment}
                </Link>
              ) : (
                <span
                  className={index === context.length - 1
                    ? "shell-breadcrumb-current"
                    : undefined}
                >
                  {segment}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
      ) : null}

      <AccountMenu />
    </header>
  );
}

function AccountMenu() {
  const { appearance, setAppearance } = useAppearance();
  const { user, loading } = useAuthSession();
  const accountName = loading ? "Memuat akun…" : getAuthDisplayName(user);
  const accountEmail = user?.email ?? "Sesi belum tersedia";
  const avatarUrl = user?.profile?.avatar_url?.trim() || null;
  const initials = getAccountInitials(accountName);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function closeMenu(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeMenuWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeMenuWithKeyboard);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeMenuWithKeyboard);
    };
  }, [isOpen]);

  async function logOutSession() {
    setAccountError("");
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok && response.status !== 204) {
        throw new Error("Sesi belum dapat diakhiri.");
      }
      window.location.assign("/login");
    } catch (requestError) {
      setAccountError(
        requestError instanceof Error
          ? requestError.message
          : "Sesi belum dapat diakhiri.",
      );
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="topbar-account" ref={menuRef}>
      <button
        className="topbar-account-trigger"
        type="button"
        aria-label={`${isOpen ? "Tutup" : "Buka"} menu akun ${accountName}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="topbar-account-menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <AccountAvatar
          avatarUrl={avatarUrl}
          initials={initials}
          name={accountName}
        />
      </button>

      {isOpen ? (
        <div className="topbar-account-menu" id="topbar-account-menu" role="menu">
          <div className="topbar-account-identity">
            <AccountAvatar
              avatarUrl={avatarUrl}
              initials={initials}
              name={accountName}
            />
            <span>
              <strong>{accountName}</strong>
              <small>{accountEmail}</small>
            </span>
          </div>

          <Link href="/pengaturan" role="menuitem" onClick={() => setIsOpen(false)}>
            <Settings aria-hidden="true" size={16} strokeWidth={1.8} />
            Pengaturan
          </Link>

          <div className="appearance-menu-group" aria-label="Tampilan">
            <span>Tampilan</span>
            <div className="appearance-options">
              {appearanceOptions.map((option) => {
                const Icon = option.icon;
                const isActive = option.value === appearance;
                return (
                  <button
                    className={isActive ? "active" : undefined}
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => setAppearance(option.value)}
                  >
                    <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {accountError ? (
            <p className="topbar-account-error" role="alert">{accountError}</p>
          ) : null}

          <button
            className="topbar-signout"
            type="button"
            role="menuitem"
            disabled={isLoggingOut}
            onClick={logOutSession}
          >
            <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
            {isLoggingOut ? "Mengakhiri sesi…" : "Keluar"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AccountAvatar({
  avatarUrl,
  initials,
  name,
}: {
  avatarUrl: string | null;
  initials: string;
  name: string;
}) {
  return (
    <span
      className={`avatar${avatarUrl ? " has-image" : ""}`}
      aria-label={avatarUrl ? `Foto profil ${name}` : undefined}
      aria-hidden={avatarUrl ? undefined : true}
    >
      {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
    </span>
  );
}
