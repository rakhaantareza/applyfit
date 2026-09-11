"use client";
import { useI18n } from "./LanguageProvider";

/* eslint-disable @next/next/no-img-element -- Account avatars can use user-provided HTTPS hosts. */

import { Settings } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  getAccountInitials,
  getAuthDisplayName,
  useAuthSession,
} from "./AuthSessionProvider";
import {
  appNavigation,
  type AppSidebarActiveItem,
  AppMobileMenuButton,
  AppSidebarToggle,
} from "./AppSidebar";
import { InlineBackLink } from "./InlineBackLink";
import { BrandMotif } from "./BrandMotif";
import { SignOutButton } from "./SignOutButton";
import { LanguagePicker } from "./LanguagePicker";

type AppTopBarProps = {
  activeItem?: AppSidebarActiveItem;
  backHref?: string;
  context?: readonly string[];
  showSidebarControls?: boolean;
  variant?: "app" | "focus";
};

export function AppTopBar({
  activeItem,
  backHref,
  context = [],
  showSidebarControls = false,
  variant = "app",
}: AppTopBarProps) {
  const { t } = useI18n();
  return (
    <header className={`app-topbar app-topbar-${variant}`}>
      <div className="app-topbar-leading">
        <Link
          className="app-topbar-brand"
          href="/beranda"
          prefetch={false}
          aria-label={t("ApplyFit beranda")}
        >
          <BrandMotif className="brand-logo" />
          <span>ApplyFit</span>
        </Link>
        {showSidebarControls ? (
          <div className="app-topbar-navigation-controls">
            <AppSidebarToggle />
          </div>
        ) : null}
      </div>

      {variant === "app" && showSidebarControls ? (
        <nav className="global-navigation" aria-label={t("Navigasi utama")}>
          {appNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-current={activeItem === item.label ? "page" : undefined}
            >
              {t(item.label)}
            </Link>
          ))}
          <Link
            className="global-navigation-guide"
            href="/contoh-perhitungan"
            prefetch={false}
            aria-label={t("Cara Fit Score dihitung")}
            aria-current={
              activeItem === "Cara Fit Score dihitung" ? "page" : undefined
            }
          >
            {t("Panduan")}
          </Link>
        </nav>
      ) : null}

      {context.length > 0 ? (
        <nav className="app-topbar-context" aria-label={t("Konteks halaman")}>
          {context.map((segment, index) => (
            <Fragment key={`${segment}-${index}`}>
              {index > 0 ? (
                <span className="shell-breadcrumb-separator" aria-hidden="true">
                  /
                </span>
              ) : null}
              {index === 0 && backHref ? (
                <InlineBackLink href={backHref}>{t(segment)}</InlineBackLink>
              ) : (
                <span
                  className={
                    index === context.length - 1
                      ? "shell-breadcrumb-current"
                      : undefined
                  }
                >
                  {t(segment)}
                </span>
              )}
            </Fragment>
          ))}
        </nav>
      ) : null}

      <div className="topbar-tools">
        <LanguagePicker />
        <AccountMenu />
        {showSidebarControls ? <AppMobileMenuButton /> : null}
      </div>
    </header>
  );
}

function AccountMenu() {
  const { t } = useI18n();

  const { user, loading } = useAuthSession();
  const accountName = loading ? "Memuat akun…" : getAuthDisplayName(user);
  const accountEmail = user?.email ?? "Sesi belum tersedia";
  const avatarUrl = user?.profile?.avatar_url?.trim() || null;
  const initials = getAccountInitials(accountName);
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="topbar-account" ref={menuRef}>
      <button
        className="topbar-account-trigger"
        type="button"
        aria-label={t(
          `${isOpen ? t("Tutup") : t("Buka")} menu akun ${accountName}`,
        )}
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
        <div
          className="topbar-account-menu"
          id="topbar-account-menu"
          role="menu"
        >
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

          <Link
            href="/pengaturan"
            prefetch={false}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <Settings aria-hidden="true" size={16} strokeWidth={1.8} />
            {t("Pengaturan")}
          </Link>

          <SignOutButton menuItem />
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
  const { t } = useI18n();
  return (
    <span
      className={`avatar${avatarUrl ? " has-image" : ""}`}
      aria-label={avatarUrl ? t(`Foto profil ${name}`) : undefined}
      aria-hidden={avatarUrl ? undefined : true}
    >
      {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
    </span>
  );
}
