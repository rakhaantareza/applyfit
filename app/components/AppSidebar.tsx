"use client";

/* eslint-disable @next/next/no-img-element -- Account avatars can use user-provided HTTPS hosts. */

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
  Settings,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getAccountInitials,
  getAuthDisplayName,
  useAuthSession,
} from "./AuthSessionProvider";

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
  { label: "Skor Kecocokan", icon: Gauge, href: "/skor-kecocokan" },
] satisfies NavigationItem[];

type AppSidebarProps = {
  activeItem?: (typeof navigation)[number]["label"] | null;
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
  const { user, loading: isAccountLoading } = useAuthSession();
  const activeAccountName = isAccountLoading ? "Memuat akun…" : getAuthDisplayName(user);
  const activeAccountEmail = user?.email ?? "Sesi belum tersedia";
  const accountInitials = getAccountInitials(activeAccountName);
  const accountAvatarUrl = user?.profile?.avatar_url?.trim() || null;
  const accountDescription = user?.emailVerified
    ? "Email terverifikasi"
    : "Akun ApplyFit";
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [profileReadiness, setProfileReadiness] = useState<{ percent: number; complete: number; total: number } | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isTabletViewport, setIsTabletViewport] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const isSidebarCollapsed = isTabletViewport
    ? !isTabletExpanded
    : isDesktopCollapsed;

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function loadReadiness() {
      try {
        const [profileResponse, skillsResponse, evidencesResponse] = await Promise.all([
          fetch("/api/career-profile", { cache: "no-store" }),
          fetch("/api/career-profile/skills", { cache: "no-store" }),
          fetch("/api/evidences", { cache: "no-store" }),
        ]);
        if (!profileResponse.ok || !skillsResponse.ok || !evidencesResponse.ok) return;
        const [profileResult, skillsResult, evidencesResult] = await Promise.all([
          readSidebarJson(profileResponse),
          readSidebarJson(skillsResponse),
          readSidebarJson(evidencesResponse),
        ]);
        const profile = profileResult.data?.profile;
        const complete = [
          Boolean(profile?.targetRole?.trim()),
          Boolean(profile?.careerField?.trim()),
          (skillsResult.data?.skills?.length ?? 0) > 0,
          (evidencesResult.data?.evidences?.length ?? 0) > 0,
        ].filter(Boolean).length;
        if (active) setProfileReadiness({ percent: Math.round((complete / 4) * 100), complete, total: 4 });
      } catch {
        // The full page owns actionable API errors; the shell keeps its neutral fallback.
      }
    }
    void loadReadiness();
    return () => { active = false; };
  }, [user]);

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
        <Link
          className="mobile-brand"
          href="/beranda"
          aria-label="ApplyFit beranda"
          onClick={closeMobileNavigation}
        >
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ApplyFit</span>
        </Link>
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
          <Link
            className="brand"
            href="/beranda"
            aria-label="ApplyFit beranda"
            data-tooltip="ApplyFit"
            onClick={closeMobileNavigation}
          >
            <span className="brand-mark" aria-hidden="true">A</span>
            <span className="brand-name">ApplyFit</span>
          </Link>

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
              <Link
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
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer" ref={accountMenuRef}>
          <Link
            className="profile-readiness"
            href="/profil-karier"
            data-tooltip={profileReadiness ? `Profil ${profileReadiness.percent}% lengkap` : "Lihat kelengkapan profil"}
            onClick={closeMobileNavigation}
          >
            <span className="readiness-rail" aria-hidden="true">
              <ChartNoAxesCombined size={18} strokeWidth={1.8} />
            </span>
            <span className="readiness-expanded">
              <span className="readiness-heading">
                <span>Kelengkapan profil</span>
                <strong>{profileReadiness ? `${profileReadiness.percent}%` : "—"}</strong>
              </span>
              <span className="readiness-track" aria-label={profileReadiness ? `Kelengkapan profil ${profileReadiness.percent} persen` : "Kelengkapan profil sedang dimuat"}>
                <span style={{ width: `${profileReadiness?.percent ?? 0}%` }} />
              </span>
              <span className="readiness-copy">{profileReadiness ? `${profileReadiness.complete} dari ${profileReadiness.total} dasar profil sudah tersedia.` : "Memuat dasar profil…"}</span>
            </span>
          </Link>

          {isAccountMenuOpen ? (
            <div className="sidebar-account-menu" id="sidebar-account-menu" role="menu">
              <div className="sidebar-account-heading">
                <AccountAvatar
                  avatarUrl={accountAvatarUrl}
                  initials={accountInitials}
                  name={activeAccountName}
                />
                <span>
                  <strong>{activeAccountName}</strong>
                  <small>{accountDescription}</small>
                </span>
              </div>
              <Link href="/pengaturan" role="menuitem" onClick={closeMobileNavigation}>
                <Settings aria-hidden="true" size={16} strokeWidth={1.8} />
                Pengaturan akun
              </Link>
              {accountError ? <p className="sidebar-account-error" role="alert">{accountError}</p> : null}
              <button
                type="button"
                role="menuitem"
                onClick={logOutSession}
                disabled={isLoggingOut}
              >
                <LogOut aria-hidden="true" size={16} strokeWidth={1.8} />
                {isLoggingOut ? "Mengakhiri sesi…" : "Keluar dari akun"}
              </button>
            </div>
          ) : null}

          <button
            className="sidebar-user"
            type="button"
            aria-label={`${isAccountMenuOpen ? "Tutup" : "Buka"} menu akun ${activeAccountName}`}
            aria-expanded={isAccountMenuOpen}
            aria-controls="sidebar-account-menu"
            data-tooltip={`Akun ${activeAccountName}`}
            onClick={() => setIsAccountMenuOpen((current) => !current)}
          >
            <AccountAvatar
              avatarUrl={accountAvatarUrl}
              initials={accountInitials}
              name={activeAccountName}
            />
            <span className="sidebar-user-copy">
              <strong>{activeAccountName}</strong>
              <small>{activeAccountEmail}</small>
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

type SidebarApiResponse = {
  data?: {
    profile?: { targetRole?: string; careerField?: string } | null;
    skills?: unknown[];
    evidences?: unknown[];
  };
};

async function readSidebarJson(response: Response): Promise<SidebarApiResponse> {
  try { return await response.json() as SidebarApiResponse; } catch { return {}; }
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
