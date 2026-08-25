"use client";

import {
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  House,
  LibraryBig,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Fragment,
  useEffect,
  useSyncExternalStore,
} from "react";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  group?: "Karier";
};

const navigation = [
  { label: "Ringkasan", icon: House, href: "/beranda" },
  {
    label: "Profil",
    icon: UserRound,
    href: "/profil-karier",
    group: "Karier",
  },
  {
    label: "Portfolio & Pengalaman",
    icon: LibraryBig,
    href: "/portfolio-pengalaman",
  },
  {
    label: "Lowongan",
    icon: BriefcaseBusiness,
    href: "/lowongan",
  },
] satisfies NavigationItem[];

const utilityNavigation = {
  label: "Pengaturan",
  icon: Settings,
  href: "/pengaturan",
} satisfies NavigationItem;

export type AppSidebarActiveItem =
  | "Ringkasan"
  | "Profil"
  | "Portfolio & Pengalaman"
  | "Lowongan"
  | "Cara Fit Score dihitung"
  | "Pengaturan"
  | null;

type AppSidebarProps = {
  activeItem?: AppSidebarActiveItem;
};

const sidebarPreferenceKey = "applyfit-sidebar-collapsed";
const sidebarPreferenceEvent = "applyfit-sidebar-preference";
const tabletSidebarPreferenceKey = "applyfit-tablet-sidebar-expanded";
const tabletSidebarPreferenceEvent = "applyfit-tablet-sidebar-preference";

let mobileSidebarOpen = false;
const mobileSidebarListeners = new Set<() => void>();

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

function subscribeToMobileSidebar(callback: () => void) {
  mobileSidebarListeners.add(callback);
  return () => mobileSidebarListeners.delete(callback);
}

function getMobileSidebarState() {
  return mobileSidebarOpen;
}

function setMobileSidebarOpen(isOpen: boolean) {
  mobileSidebarOpen = isOpen;
  mobileSidebarListeners.forEach((listener) => listener());
}

export function AppSidebar({ activeItem = null }: AppSidebarProps) {
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
  const isMobileOpen = useSyncExternalStore(
    subscribeToMobileSidebar,
    getMobileSidebarState,
    getServerSidebarPreference,
  );
  const [isMobileViewport, isTabletViewport] = useSidebarViewport();
  const isSidebarCollapsed = isTabletViewport
    ? !isTabletExpanded
    : isDesktopCollapsed;

  useEffect(() => {
    if (!isMobileViewport) setMobileSidebarOpen(false);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    }

    window.addEventListener("keydown", closeWithKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [isMobileOpen]);

  function closeMobileNavigation() {
    setMobileSidebarOpen(false);
  }

  return (
    <>
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
        }${isMobileOpen ? " sidebar-mobile-open" : ""}`}
        id="app-navigation"
        aria-label="Navigasi aplikasi"
        aria-hidden={isMobileViewport && !isMobileOpen ? true : undefined}
        inert={isMobileViewport && !isMobileOpen ? true : undefined}
      >
        <div className="sidebar-mobile-heading">
          <span>Navigasi</span>
          <button
            className="mobile-drawer-close"
            type="button"
            aria-label="Tutup navigasi utama"
            onClick={closeMobileNavigation}
          >
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Navigasi utama">
          {navigation.map((item) => {
            const isActive = item.label === activeItem;
            const Icon = item.icon;

            return (
              <Fragment key={item.label}>
                {item.group ? <p className="nav-label">{item.group}</p> : null}
                <Link
                  className={`nav-item${isActive ? " active" : ""}`}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  data-tooltip={item.label}
                  onClick={closeMobileNavigation}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon size={17} strokeWidth={1.7} />
                  </span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </Fragment>
            );
          })}
        </nav>

        <section
          className={`sidebar-fit-guide${
            activeItem === "Cara Fit Score dihitung" ? " active" : ""
          }`}
          aria-label="Panduan Fit Score"
        >
          <div className="sidebar-fit-guide-expanded">
            <div className="sidebar-fit-guide-meta">
              <span>Fit Score</span>
              <CircleHelp aria-hidden="true" size={14} strokeWidth={1.7} />
            </div>
            <Link
              className="sidebar-fit-guide-title"
              href="/contoh-perhitungan"
              aria-current={activeItem === "Cara Fit Score dihitung" ? "page" : undefined}
              onClick={closeMobileNavigation}
            >
              Cara Fit Score dihitung
            </Link>
            <p>Pahami status, bobot, dan formula yang membentuk skor.</p>
            <div className="sidebar-fit-guide-statuses" aria-label="Status Fit Score">
              {[
                ["Proven", "proven"],
                ["Partial", "partial"],
                ["Learning", "learning"],
                ["Missing", "missing"],
              ].map(([label, className]) => (
                <span key={label}>
                  <i className={`status-dot ${className}`} aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
            <Link
              className="sidebar-fit-guide-link"
              href="/contoh-perhitungan"
              onClick={closeMobileNavigation}
            >
              Pelajari selengkapnya
              <ArrowRight aria-hidden="true" size={14} strokeWidth={1.7} />
            </Link>
          </div>

          <Link
            className={`sidebar-fit-guide-collapsed nav-item${
              activeItem === "Cara Fit Score dihitung" ? " active" : ""
            }`}
            href="/contoh-perhitungan"
            aria-label="Cara Fit Score dihitung"
            aria-current={activeItem === "Cara Fit Score dihitung" ? "page" : undefined}
            data-tooltip="Cara Fit Score dihitung"
            onClick={closeMobileNavigation}
          >
            <span className="nav-icon" aria-hidden="true">
              <CircleHelp size={18} strokeWidth={1.7} />
            </span>
          </Link>
        </section>

        <nav className="sidebar-utility" aria-label="Navigasi utilitas">
          <Link
            className={activeItem === utilityNavigation.label ? "nav-item active" : "nav-item"}
            href={utilityNavigation.href}
            aria-current={activeItem === utilityNavigation.label ? "page" : undefined}
            data-tooltip={utilityNavigation.label}
            onClick={closeMobileNavigation}
          >
            <span className="nav-icon" aria-hidden="true">
              <Settings size={17} strokeWidth={1.7} />
            </span>
            <span className="nav-text">{utilityNavigation.label}</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

export function AppSidebarToggle() {
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
  const [, isTabletViewport] = useSidebarViewport();
  const isSidebarCollapsed = isTabletViewport
    ? !isTabletExpanded
    : isDesktopCollapsed;

  function toggleSidebar() {
    if (isTabletViewport) {
      window.sessionStorage.setItem(
        tabletSidebarPreferenceKey,
        String(!isTabletExpanded),
      );
      window.dispatchEvent(new Event(tabletSidebarPreferenceEvent));
      return;
    }

    window.localStorage.setItem(
      sidebarPreferenceKey,
      String(!isDesktopCollapsed),
    );
    window.dispatchEvent(new Event(sidebarPreferenceEvent));
  }

  return (
    <button
      className="sidebar-context-toggle"
      type="button"
      aria-controls="app-navigation"
      aria-label={isSidebarCollapsed ? "Perluas sidebar" : "Ringkas sidebar"}
      aria-pressed={isSidebarCollapsed}
      title={isSidebarCollapsed ? "Perluas sidebar" : "Ringkas sidebar"}
      onClick={toggleSidebar}
    >
      {isSidebarCollapsed ? (
        <PanelLeftOpen aria-hidden="true" size={16} strokeWidth={1.75} />
      ) : (
        <PanelLeftClose aria-hidden="true" size={16} strokeWidth={1.75} />
      )}
    </button>
  );
}

export function AppMobileMenuButton() {
  const isOpen = useSyncExternalStore(
    subscribeToMobileSidebar,
    getMobileSidebarState,
    getServerSidebarPreference,
  );

  return (
    <button
      className="app-topbar-mobile-menu"
      type="button"
      aria-label="Buka navigasi utama"
      aria-expanded={isOpen}
      aria-controls="app-navigation"
      onClick={() => setMobileSidebarOpen(true)}
    >
      <Menu aria-hidden="true" size={18} strokeWidth={1.8} />
    </button>
  );
}

function useSidebarViewport() {
  const isMobileViewport = useViewportMatch("(max-width: 767px)");
  const isTabletViewport = useViewportMatch(
    "(min-width: 768px) and (max-width: 1023px)",
  );

  return [isMobileViewport, isTabletViewport] as const;
}

function useViewportMatch(query: string) {
  return useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    getServerSidebarPreference,
  );
}
