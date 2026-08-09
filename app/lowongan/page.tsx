import type { Metadata } from "next";
import { AppSidebar } from "../components/AppSidebar";
import { JobsWorkspace } from "./JobsWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Lowongan",
  description:
    "Kelola lowongan tersimpan dan pantau kesiapan requirement sebelum dianalisis di ApplyFit.",
};

export default function JobsPage() {
  return (
    <AuthenticatedRoute><div className="app-shell">
      <AppSidebar activeItem="Lowongan" />
      <main className="main-content jobs-main">
        <JobsWorkspace />
      </main>
    </div></AuthenticatedRoute>
  );
}
