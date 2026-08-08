"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation is intentional: the Sites Vinext client router fails in production. */

import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Gauge,
  House,
  LibraryBig,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const navigation = [
  { label: "Ringkasan", icon: House, href: "/#ringkasan" },
  { label: "Profil Karier", icon: UserRound, href: "/profil-karier" },
  { label: "Pustaka Bukti", icon: LibraryBig, href: "/pustaka-bukti" },
  { label: "Lowongan", icon: BriefcaseBusiness, href: "/lowongan" },
  { label: "Skor Kecocokan", icon: Gauge, href: "/" },
] satisfies NavigationItem[];

type AppSidebarProps = {
  activeItem?: (typeof navigation)[number]["label"];
};

const sidebarPreferenceKey = "applyfit-sidebar-collapsed";
const sidebarPreferenceEvent = "applyfit-sidebar-preference";

function subscribeToSidebarPreference(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(sidebarPreferenceEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(sidebarPreferenceEvent, callback);
  };
}

function getSidebarPreference() {
  return window.localStorage.getItem(sidebarPreferenceKey) === "true";
}

function getServerSidebarPreference() {
  return false;
}

export function AppSidebar({ activeItem = "Skor Kecocokan" }: AppSidebarProps) {
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    getServerSidebarPreference,
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 760px)");

    function syncViewport(event: MediaQueryListEvent | MediaQueryList) {
      setIsMobileViewport(event.matches);
      if (!event.matches) setIsMobileOpen(false);
    }

    syncViewport(mobileQuery);
    mobileQuery.addEventListener("change", syncViewport);

    return () => mobileQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  function toggleDesktopSidebar() {
    window.localStorage.setItem(sidebarPreferenceKey, String(!isCollapsed));
    window.dispatchEvent(new Event(sidebarPreferenceEvent));
  }

  function closeMobileNavigation() {
    setIsMobileOpen(false);
  }

  return (
    <>
      <header className="mobile-shell-header">
        <button
          className="mobile-menu-button"
          type="button"
          aria-label="Buka navigasi utama"
          aria-expanded={isMobileOpen}
          aria-controls="app-navigation"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu aria-hidden="true" size={21} strokeWidth={1.9} />
        </button>
        <a className="mobile-brand" href="/" aria-label="ApplyFit beranda">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ApplyFit</span>
        </a>
        <span className="mobile-page-label">{activeItem}</span>
      </header>

      <button
        className={`sidebar-backdrop${isMobileOpen ? " visible" : ""}`}
        type="button"
        aria-label="Tutup navigasi utama"
        tabIndex={isMobileOpen ? 0 : -1}
        onClick={closeMobileNavigation}
      />

      <aside
        className={`sidebar${isCollapsed ? " sidebar-collapsed" : ""}${
          isMobileOpen ? " sidebar-mobile-open" : ""
        }`}
        id="app-navigation"
        aria-label="Navigasi aplikasi"
        aria-hidden={isMobileViewport && !isMobileOpen ? true : undefined}
        inert={isMobileViewport && !isMobileOpen ? true : undefined}
      >
        <div className="sidebar-header">
          <a
            className="brand"
            href="/"
            aria-label="ApplyFit beranda"
            data-tooltip="ApplyFit"
            onClick={closeMobileNavigation}
          >
            <span className="brand-mark" aria-hidden="true">A</span>
            <span className="brand-name">ApplyFit</span>
          </a>

          <button
            className="sidebar-toggle"
            type="button"
            aria-label={isCollapsed ? "Perluas sidebar" : "Ringkas sidebar"}
            aria-pressed={isCollapsed}
            data-tooltip={isCollapsed ? "Perluas sidebar" : "Ringkas sidebar"}
            onClick={toggleDesktopSidebar}
          >
            {isCollapsed ? (
              <PanelLeftOpen aria-hidden="true" size={18} strokeWidth={1.8} />
            ) : (
              <PanelLeftClose aria-hidden="true" size={18} strokeWidth={1.8} />
            )}
          </button>

          <button
            className="mobile-drawer-close"
            type="button"
            aria-label="Tutup navigasi utama"
            onClick={closeMobileNavigation}
          >
            <X aria-hidden="true" size={20} strokeWidth={1.9} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Navigasi utama">
          <p className="nav-label">Workspace</p>
          {navigation.map((item) => {
            const isActive = item.label === activeItem;
            const Icon = item.icon;

            return (
              <a
                className={`nav-item${isActive ? " active" : ""}`}
                href={item.href}
                key={item.label}
                aria-current={isActive ? "page" : undefined}
                data-tooltip={item.label}
                onClick={closeMobileNavigation}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={19} strokeWidth={1.8} />
                </span>
                <span className="nav-text">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <a
            className="profile-readiness"
            href="/profil-karier"
            data-tooltip="Profil 80% lengkap"
            onClick={closeMobileNavigation}
          >
            <span className="readiness-rail" aria-hidden="true">
              <ChartNoAxesCombined size={18} strokeWidth={1.8} />
            </span>
            <span className="readiness-expanded">
              <span className="readiness-heading">
                <span>Kelengkapan profil</span>
                <strong>80%</strong>
              </span>
              <span className="readiness-track" aria-label="Kelengkapan profil 80 persen">
                <span />
              </span>
              <span className="readiness-copy">4 dari 5 bagian profil sudah terisi.</span>
            </span>
          </a>

          <button
            className="sidebar-user"
            type="button"
            aria-label="Buka menu akun Aruna Wijaya"
            data-tooltip="Akun Aruna Wijaya"
          >
            <span className="avatar">AW</span>
            <span className="sidebar-user-copy">
              <strong>Aruna Wijaya</strong>
              <small>aruna@example.com</small>
            </span>
            <MoreHorizontal
              className="sidebar-user-more"
              aria-hidden="true"
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
