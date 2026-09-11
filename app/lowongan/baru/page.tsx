import { Message } from "../../components/LanguageProvider";
import type { Metadata } from "next";
import { FileSearch, Save, ScanSearch } from "lucide-react";
import { AppShell } from "../../components/AppShell";
import { PageHeader } from "../../components/ContentHeaders";
import { InlineBackLink } from "../../components/InlineBackLink";
import { JobCreationForm } from "./JobCreationForm";
import { AuthenticatedRoute } from "../../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Tambah Lowongan",
  description:
    "Simpan konteks lowongan baru sebelum meninjau requirement di ApplyFit.",
};

export default function NewJobPage() {
  return (
    <AuthenticatedRoute>
      <AppShell activeItem="Lowongan" mainClassName="new-job-main">
        <div className="page-container new-job-page">
          <div className="new-job-header">
            <InlineBackLink href="/lowongan">
              <Message>{"Kembali ke semua lowongan"}</Message>
            </InlineBackLink>
            <PageHeader
              title={<Message>{"Tambah lowongan"}</Message>}
              description={
                <Message>
                  {"Simpan informasi dan deskripsi dari lowongan aslinya."}
                </Message>
              }
            />
          </div>

          <div className="new-job-layout">
            <JobCreationForm />

            <aside
              className="new-job-guidance"
              aria-labelledby="new-job-next-title"
            >
              <h2 id="new-job-next-title">
                <Message>{"Setelah tersimpan"}</Message>
              </h2>
              <ol>
                <li>
                  <span>
                    <Save aria-hidden="true" size={16} strokeWidth={1.8} />
                  </span>
                  <div>
                    <strong>
                      <Message>{"Lowongan tersimpan"}</Message>
                    </strong>
                    <p>
                      <Message>{"Buka kembali dari daftar Lowongan."}</Message>
                    </p>
                  </div>
                </li>
                <li>
                  <span>
                    <FileSearch
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.8}
                    />
                  </span>
                  <div>
                    <strong>
                      <Message>{"Ambil persyaratan"}</Message>
                    </strong>
                    <p>
                      <Message>
                        {"Susun persyaratan dari deskripsi lowongan."}
                      </Message>
                    </p>
                  </div>
                </li>
                <li>
                  <span>
                    <ScanSearch
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.8}
                    />
                  </span>
                  <div>
                    <strong>
                      <Message>{"Periksa sebelum analisis"}</Message>
                    </strong>
                    <p>
                      <Message>
                        {"Periksa hasilnya, lalu hubungkan dengan skillmu."}
                      </Message>
                    </p>
                  </div>
                </li>
              </ol>
            </aside>
          </div>
        </div>
      </AppShell>
    </AuthenticatedRoute>
  );
}
