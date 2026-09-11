"use client";
import { BrandMotif } from "./BrandMotif";
import { LanguagePicker } from "./LanguagePicker";
import { SignOutButton } from "./SignOutButton";
import { useI18n } from "./LanguageProvider";
import {
  getAuthDisplayName,
  getAccountInitials,
  useAuthSession,
} from "./AuthSessionProvider";

import {
  BriefcaseBusiness,
  CircleHelp,
  House,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  group?: "Karier";
};

export const appNavigation = [
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

const mobileSidebarEvent = "applyfit-mobile-navigation";
type NavigationWindow = Window & { applyfitMobileNavigationOpen?: boolean };

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
  return () =>
    window.removeEventListener(tabletSidebarPreferenceEvent, callback);
}

function getTabletSidebarPreference() {
  return window.sessionStorage.getItem(tabletSidebarPreferenceKey) === "true";
}

function subscribeToMobileSidebar(callback: () => void) {
  window.addEventListener(mobileSidebarEvent, callback);
  return () => window.removeEventListener(mobileSidebarEvent, callback);
}

function getMobileSidebarState() {
  return (window as NavigationWindow).applyfitMobileNavigationOpen ?? false;
}

function setMobileSidebarOpen(isOpen: boolean) {
  (window as NavigationWindow).applyfitMobileNavigationOpen = isOpen;
  window.dispatchEvent(new Event(mobileSidebarEvent));
}

export function AppSidebar({ activeItem = null }: AppSidebarProps) {
  const { t } = useI18n();
  const { user } = useAuthSession();
  const accountName = getAuthDisplayName(user);
  const sidebarRef = useRef<HTMLElement>(null);
  const isDesktopCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    getSidebarPreference,
    getServerSidebarPreference,
  );
  const isMobileOpen = useSyncExternalStore(
    subscribeToMobileSidebar,
    getMobileSidebarState,
    getServerSidebarPreference,
  );
  const [isMobileViewport, isTabletViewport] = useSidebarViewport();
  const isSidebarCollapsed = isTabletViewport ? true : isDesktopCollapsed;

  useEffect(() => {
    if (!isMobileViewport) setMobileSidebarOpen(false);
  }, [isMobileViewport]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const body = document.body;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const background = [
      ...document.querySelectorAll<HTMLElement>(
        ".app-shell > header, .app-shell > main, .job-focus-shell > header, .job-focus-shell > main, .mobile-bottom-nav",
      ),
    ];
    const inertStates = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    Object.assign(body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      width: "100%",
      overflow: "hidden",
    });
    const focusFrame = requestAnimationFrame(() => {
      sidebarRef.current
        ?.querySelector<HTMLButtonElement>(".mobile-drawer-close")
        ?.focus({ preventScroll: true });
    });

    function closeWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileSidebarOpen(false);
      if (event.key === "Tab") {
        const items = [
          ...(sidebarRef.current?.querySelectorAll<HTMLElement>(
            "a[href], button",
          ) ?? []),
        ].filter((element) => element.getClientRects().length > 0);
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    window.addEventListener("keydown", closeWithKeyboard);
    return () => {
      cancelAnimationFrame(focusFrame);
      Object.assign(body.style, previous);
      background.forEach((element, index) => {
        element.inert = inertStates[index];
      });
      window.scrollTo({ top: scrollY, behavior: "instant" });
      if (opener?.isConnected) opener.focus({ preventScroll: true });
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
        aria-label={t("Tutup navigasi utama")}
        tabIndex={-1}
        onClick={closeMobileNavigation}
      />

      <aside
        ref={sidebarRef}
        role={isMobileViewport && isMobileOpen ? "dialog" : undefined}
        aria-modal={isMobileViewport && isMobileOpen ? true : undefined}
        className={`sidebar${isSidebarCollapsed ? " sidebar-collapsed" : ""}${isMobileOpen ? " sidebar-mobile-open" : ""}`}
        id="app-navigation"
        aria-label={t("Navigasi aplikasi")}
        aria-hidden={isMobileViewport && !isMobileOpen ? true : undefined}
        inert={isMobileViewport && !isMobileOpen ? true : undefined}
      >
        <div className="sidebar-mobile-heading">
          <span className="sidebar-brand">
            <BrandMotif className="brand-logo" />
            ApplyFit
          </span>
          <button
            className="mobile-drawer-close"
            type="button"
            aria-label={t("Tutup navigasi utama")}
            onClick={closeMobileNavigation}
          >
            <X aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="sidebar-links">
          <Link
            className="mobile-menu-profile"
            href="/profil-karier"
            prefetch={false}
            onClick={closeMobileNavigation}
          >
            <span className="avatar" aria-hidden="true">
              {getAccountInitials(accountName)}
            </span>
            <span>
              <strong>{accountName}</strong>
              <small>{t("Profil")}</small>
            </span>
          </Link>
          <div className="mobile-menu-language">
            <LanguagePicker />
          </div>
          <nav className="main-nav" aria-label={t("Navigasi utama")}>
            {appNavigation.map((item) => {
              const isActive = item.label === activeItem;
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  className={`nav-item${isActive ? " active" : ""}`}
                  href={item.href}
                  prefetch={false}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={t(item.label)}
                  data-tooltip={item.label}
                  onClick={closeMobileNavigation}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon size={17} strokeWidth={1.7} />
                  </span>
                  <span className="nav-text">{t(item.label)}</span>
                  <span className="nav-compact-text" aria-hidden="true">
                    {item.label === "Portfolio & Pengalaman"
                      ? "Portfolio"
                      : t(item.label)}
                  </span>
                </Link>
              );
            })}
          </nav>

          <nav className="sidebar-utility" aria-label={t("Navigasi utilitas")}>
            <Link
              className={`nav-item${
                activeItem === "Cara Fit Score dihitung" ? " active" : ""
              }`}
              href="/contoh-perhitungan"
              prefetch={false}
              aria-label={t("Cara Fit Score dihitung")}
              aria-current={
                activeItem === "Cara Fit Score dihitung" ? "page" : undefined
              }
              data-tooltip="Cara Fit Score dihitung"
              onClick={closeMobileNavigation}
            >
              <span className="nav-icon" aria-hidden="true">
                <CircleHelp size={18} strokeWidth={1.7} />
              </span>
              <span className="nav-text">{t("Panduan Fit Score")}</span>
              <span className="nav-compact-text" aria-hidden="true">
                {t("Panduan")}
              </span>
            </Link>
            <Link
              className={
                activeItem === utilityNavigation.label
                  ? "nav-item active"
                  : "nav-item"
              }
              href={utilityNavigation.href}
              prefetch={false}
              aria-current={
                activeItem === utilityNavigation.label ? "page" : undefined
              }
              data-tooltip={utilityNavigation.label}
              aria-label={t(utilityNavigation.label)}
              onClick={closeMobileNavigation}
            >
              <span className="nav-icon" aria-hidden="true">
                <Settings size={17} strokeWidth={1.7} />
              </span>
              <span className="nav-text">{t(utilityNavigation.label)}</span>
              <span className="nav-compact-text" aria-hidden="true">
                {t("Pengaturan")}
              </span>
            </Link>
          </nav>
          <div className="mobile-menu-signout">
            <SignOutButton />
          </div>
        </div>
      </aside>
      <nav className="mobile-bottom-nav" aria-label={t("Navigasi utama")}>
        {appNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              aria-label={t(item.label)}
              aria-current={activeItem === item.label ? "page" : undefined}
            >
              <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
              <span>
                {item.label === "Portfolio & Pengalaman"
                  ? "Portfolio"
                  : t(item.label)}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AppSidebarToggle() {
  const { t } = useI18n();
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
      aria-label={
        isSidebarCollapsed ? t("Perluas sidebar") : t("Ringkas sidebar")
      }
      aria-pressed={isSidebarCollapsed}
      title={isSidebarCollapsed ? t("Perluas sidebar") : t("Ringkas sidebar")}
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
  const { t } = useI18n();
  const isOpen = useSyncExternalStore(
    subscribeToMobileSidebar,
    getMobileSidebarState,
    getServerSidebarPreference,
  );

  return (
    <button
      className="app-topbar-mobile-menu"
      type="button"
      aria-label={t("Buka navigasi utama")}
      aria-expanded={isOpen}
      aria-controls="app-navigation"
      onClick={() => setMobileSidebarOpen(true)}
    >
      <svg
        className="mobile-menu-icon"
        width="28"
        height="24"
        viewBox="0 0 28 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 4h26M7 12h20M17 20h10"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
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
