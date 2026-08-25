import type { Metadata } from "next";
import { ArrowLeft, FileSearch, Save, ScanSearch } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { StableLink as Link } from "../../components/StableLink";
import { JobCreationForm } from "./JobCreationForm";
import { AuthenticatedRoute } from "../../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Tambah Lowongan",
  description: "Simpan konteks lowongan baru sebelum meninjau requirement di ApplyFit.",
};

export default function NewJobPage() {
  return (
    <AuthenticatedRoute><AppShell activeItem="Lowongan" mainClassName="new-job-main">
        <div className="page-container new-job-page">
          <header className="new-job-header">
            <Link href="/lowongan">
              <ArrowLeft aria-hidden="true" size={15} strokeWidth={1.9} />
              Kembali ke semua lowongan
            </Link>
            <div>
              <p className="eyebrow">Lowongan baru</p>
              <h1>Simpan konteks pekerjaan</h1>
              <p>
                Masukkan informasi dari lowongan aslinya. ApplyFit akan menyimpannya
                sebagai satu konteks pekerjaan yang terpisah sebelum Persyaratan diperiksa.
              </p>
            </div>
          </header>

          <div className="new-job-layout">
            <JobCreationForm />

            <aside className="new-job-guidance" aria-labelledby="new-job-next-title">
              <p className="eyebrow">Setelah disimpan</p>
              <h2 id="new-job-next-title">Lanjutkan dengan konteks yang jelas</h2>
              <ol>
                <li>
                  <span><Save aria-hidden="true" size={16} strokeWidth={1.8} /></span>
                  <div><strong>Lowongan tersimpan</strong><p>Role dan perusahaan menjadi konteks utama.</p></div>
                </li>
                <li>
                  <span><FileSearch aria-hidden="true" size={16} strokeWidth={1.8} /></span>
                  <div><strong>Ekstrak requirement</strong><p>Deskripsi diubah menjadi draft syarat terstruktur.</p></div>
                </li>
                <li>
                  <span><ScanSearch aria-hidden="true" size={16} strokeWidth={1.8} /></span>
                  <div><strong>Periksa sebelum analisis</strong><p>Kamu tetap memegang kendali atas hasil ekstraksi.</p></div>
                </li>
              </ol>
              <p className="new-job-guidance-note">
                Menyimpan lowongan tidak menghasilkan rekomendasi untuk melamar atau melewatkannya.
              </p>
            </aside>
          </div>
        </div>
    </AppShell></AuthenticatedRoute>
  );
}
