type AppSidebarProps = {
  activeItem?: "Skor Kecocokan";
};

const navigation = [
  { label: "Ringkasan", icon: "⌂", href: "/#ringkasan" },
  { label: "Profil Karier", icon: "◎", href: "/#profil-karier" },
  { label: "Pustaka Bukti", icon: "◇", href: "/#pustaka-bukti" },
  { label: "Lowongan", icon: "▤", href: "/#lowongan" },
  { label: "Skor Kecocokan", icon: "◔", href: "/" },
] as const;

export function AppSidebar({ activeItem = "Skor Kecocokan" }: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="ApplyFit beranda">
        <span className="brand-mark" aria-hidden="true">
          A
        </span>
        <span>ApplyFit</span>
      </a>

      <nav className="main-nav" aria-label="Navigasi utama">
        <p className="nav-label">Workspace</p>
        {navigation.map((item) => {
          const isActive = item.label === activeItem;

          return (
            <a
              className={`nav-item${isActive ? " active" : ""}`}
              href={item.href}
              key={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="profile-readiness">
        <div className="readiness-heading">
          <span>Kelengkapan profil</span>
          <strong>80%</strong>
        </div>
        <div className="readiness-track" aria-label="Kelengkapan profil 80 persen">
          <span />
        </div>
        <p>4 dari 5 bagian profil sudah terisi.</p>
      </div>

      <div className="sidebar-user">
        <span className="avatar">AW</span>
        <span>
          <strong>Aruna Wijaya</strong>
          <small>aruna@example.com</small>
        </span>
        <button aria-label="Buka menu pengguna" type="button">
          ···
        </button>
      </div>
    </aside>
  );
}
