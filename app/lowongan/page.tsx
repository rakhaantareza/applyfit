import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { JobsWorkspace } from "./JobsWorkspace";
import { AuthenticatedRoute } from "../components/AuthenticatedRoute";

export const metadata: Metadata = {
  title: "Lowongan",
  description:
    "Kelola lowongan tersimpan dan pantau kesiapan requirement sebelum dianalisis di ApplyFit.",
};

export default function JobsPage() {
  return (
    <AuthenticatedRoute><AppShell activeItem="Lowongan" mainClassName="jobs-main">
        <JobsWorkspace />
    </AppShell></AuthenticatedRoute>
  );
}
