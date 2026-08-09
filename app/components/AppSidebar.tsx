"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation is intentional: the Sites Vinext client router fails in production. */

import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Gauge,
  House,
  LibraryBig,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const navigation = [
  { label: "Ringkasan", icon: House, href: "/beranda" },
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
const tabletSidebarPreferenceKey = "applyfit-tablet-sidebar-expanded";
const tabletSidebarPreferenceEvent = "applyfit-tablet-sidebar-preference";

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

function subscribeToTabletSidebarPreference(callback: () => void) {
  window.addEventListener(tabletSidebarPreferenceEvent, callback);

  return () => window.removeEventListener(tabletSidebarPreferenceEvent, callback);
}

function getTabletSidebarPreference() {
  return window.sessionStorage.getItem(tabletSidebarPreferenceKey) === "true";
}

export function AppSidebar({ activeItem = "Skor Kecocokan" }: AppSidebarProps) {
  const isDesktopCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    getServerSidebarPreference,
  );
  const isTabletExpanded = useSyncExternalStore(
    subscribeToTabletSidebarPreference,
    getTabletSidebarPreference,
    getServerSidebarPreference,
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isSidebarCollapsed = isTabletViewport
    ? !isTabletExpanded
    : isDesktopCollapsed;

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");

    function syncViewport() {
      setIsMobileViewport(mobileQuery.matches);
      setIsTabletViewport(tabletQuery.matches);
      if (!mobileQuery.matches) setIsMobileOpen(false);
    }

    syncViewport();
    mobileQuery.addEventListener("change", syncViewport);
    tabletQuery.addEventListener("change", syncViewport);

    return () => {
      mobileQuery.removeEventListener("change", syncViewport);
      tabletQuery.removeEventListener("change", syncViewport);
    };
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

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    function closeAccountMenu(event: PointerEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }

    function handleAccountMenuKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeAccountMenu);
    window.addEventListener("keydown", handleAccountMenuKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeAccountMenu);
      window.removeEventListener("keydown", handleAccountMenuKeyDown);
    };
  }, [isAccountMenuOpen]);

  function toggleDesktopSidebar() {
    if (isTabletViewport) {
      window.sessionStorage.setItem(
        tabletSidebarPreferenceKey,
        String(!isTabletExpanded),
      );
      window.dispatchEvent(new Event(tabletSidebarPreferenceEvent));
      return;
    }

    window.localStorage.setItem(sidebarPreferenceKey, String(!isDesktopCollapsed));
    window.dispatchEvent(new Event(sidebarPreferenceEvent));
  }

  function closeMobileNavigation() {
    setIsMobileOpen(false);
    setIsAccountMenuOpen(false);
  }

  function logOutDemoSession() {
    setIsLoggingOut(true);
    window.setTimeout(() => {
      window.localStorage.removeItem("applyfit-demo-session");
      window.sessionStorage.removeItem("applyfit-demo-session");
      window.location.assign("/login");
    }, 450);
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
        className={`sidebar${isSidebarCollapsed ? " sidebar-collapsed" : ""}${
          isTabletViewport && isTabletExpanded ? " sidebar-tablet-expanded" : ""
        }${
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
            aria-label={isSidebarCollapsed ? "Perluas sidebar" : "Ringkas sidebar"}
            aria-pressed={isSidebarCollapsed}
            data-tooltip={isSidebarCollapsed ? "Perluas sidebar" : "Ringkas sidebar"}
            onClick={toggleDesktopSidebar}
          >
            {isSidebarCollapsed ? (
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

        <div className="sidebar-footer" ref={accountMenuRef}>
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

          {isAccountMenuOpen ? (
            <div className="sidebar-account-menu" id="sidebar-account-menu" role="menu">
              <div className="sidebar-account-heading">
                <span className="avatar" aria-hidden="true">AW</span>
                <span>
                  <strong>Aruna Wijaya</strong>
                  <small>Akun demo frontend</small>
                </span>
              </div>
              <a href="/profil-karier" role="menuitem" onClick={closeMobileNavigation}>
                <UserRound aria-hidden="true" size={16} strokeWidth={1.8} />
                Lihat profil karier
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={logOutDemoSession}
                disabled={isLoggingOut}
              >
                <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
                {isLoggingOut ? "Mengakhiri sesi…" : "Keluar dari sesi demo"}
              </button>
            </div>
          ) : null}

          <button
            className="sidebar-user"
            type="button"
            aria-label={isAccountMenuOpen ? "Tutup menu akun Aruna Wijaya" : "Buka menu akun Aruna Wijaya"}
            aria-expanded={isAccountMenuOpen}
            aria-controls="sidebar-account-menu"
            data-tooltip="Akun Aruna Wijaya"
            onClick={() => setIsAccountMenuOpen((current) => !current)}
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
