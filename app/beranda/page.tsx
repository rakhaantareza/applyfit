import type { Metadata } from "next";
import { ArrowRight, ClipboardList, ShieldCheck } from "lucide-react";
import { AppSidebar } from "../components/AppSidebar";
import { MockProtectedRoute } from "../components/MockProtectedRoute";
import { StableLink as Link } from "../components/StableLink";

export const metadata: Metadata = {
  title: "Ringkasan",
  description: "Ruang kerja awal ApplyFit untuk memulai analisis kesiapan karier.",
};

export default function EmptyHomePage() {
  return (
    <MockProtectedRoute>
      <div className="app-shell">
        <AppSidebar activeItem="Ringkasan" />

        <main className="main-content empty-home-main">
          <div className="page-container empty-home-page">
            <header className="empty-home-header">
              <div>
                <p className="eyebrow">Ringkasan</p>
                <h1>Selamat datang di ApplyFit</h1>
                <p>
                  Ruang kerja ini akan merangkum profil, bukti, dan lowonganmu setelah
                  data mulai ditambahkan.
                </p>
              </div>
              <span className="mock-data-badge">
                <ShieldCheck aria-hidden="true" size={14} strokeWidth={1.9} />
                Sesi demo aktif
              </span>
            </header>

            <section className="empty-home-state" aria-labelledby="empty-home-title">
              <span className="empty-home-icon" aria-hidden="true">
                <ClipboardList size={27} strokeWidth={1.7} />
              </span>
              <p className="eyebrow">Belum ada ringkasan</p>
              <h2 id="empty-home-title">Mulai dari konteks kariermu</h2>
              <p>
                Lengkapi target role dan skill agar ApplyFit memiliki dasar yang jelas
                saat membaca requirement sebuah lowongan.
              </p>
              <div className="empty-home-actions">
                <Link className="empty-home-primary" href="/profil-karier">
                  Lengkapi profil karier
                  <ArrowRight aria-hidden="true" size={17} strokeWidth={1.9} />
                </Link>
                <Link className="empty-home-secondary" href="/lowongan">
                  Lihat lowongan tersimpan
                </Link>
              </div>
            </section>

            <p className="demo-note">
              Proteksi route dan sesi pada halaman ini masih berupa simulasi frontend.
            </p>
          </div>
        </main>
      </div>
    </MockProtectedRoute>
  );
}
