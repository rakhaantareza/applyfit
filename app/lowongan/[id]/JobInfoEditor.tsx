"use client";
import { useI18n } from "../../components/LanguageProvider";

import {
  Building2,
  Check,
  ExternalLink,
  MapPin,
  Monitor,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "../../components/ActionControl";

import { JobSourceField } from "../../components/JobSourceField";

type JobInfoEditorProps = {
  initialJob: EditableJobInfo & { initials: string };
  jobId?: string;
  allowEditing?: boolean;
  presentation?: "detail" | "card";
  onDeleted?: () => void;
  onUpdated?: (job: EditableJobInfo) => void;
};

export type EditableJobInfo = {
  title: string;
  company: string;
  source: string;
  location: string;
  arrangement: string;
};

export function JobInfoEditor({
  initialJob,
  jobId,
  allowEditing = true,
  presentation = "detail",
  onDeleted,
  onUpdated,
}: JobInfoEditorProps) {
  const { t } = useI18n();
  const initialInfo: EditableJobInfo = {
    title: initialJob.title,
    company: initialJob.company,
    source: initialJob.source,
    location: initialJob.location,
    arrangement: initialJob.arrangement,
  };
  const [jobInfo, setJobInfo] = useState(initialInfo);
  const [draft, setDraft] = useState(initialInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const titleId = useId();
  const companyId = useId();

  const locationId = useId();
  const arrangementId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEditing) return;

    const focusFrame = window.requestAnimationFrame(() =>
      titleRef.current?.focus(),
    );
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isEditing]);

  useEffect(() => {
    if (!isDeleteDialogOpen) return;

    cancelDeleteRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setDeleteError("");
        setIsDeleteDialogOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDeleteDialogOpen, isDeleting]);

  function openEditor() {
    setDraft(jobInfo);
    setError("");
    setAnnouncement("");
    setIsEditing(true);
  }

  function closeEditor() {
    setDraft(jobInfo);
    setError("");
    setIsEditing(false);
  }

  function openDeleteDialog() {
    setDeleteError("");
    setIsDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (isDeleting) return;
    setDeleteError("");
    setIsDeleteDialogOpen(false);
  }

  async function deleteJob() {
    if (!jobId) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const result = await readDeleteResponse(response);
        throw new Error(
          result.error?.message ?? "Lowongan belum dapat dihapus.",
        );
      }

      if (onDeleted) onDeleted();
      else window.location.assign("/lowongan");
    } catch (requestError) {
      setDeleteError(
        requestError instanceof Error
          ? requestError.message
          : "Lowongan belum dapat dihapus.",
      );
      setIsDeleting(false);
    }
  }

  function updateDraft(field: keyof EditableJobInfo, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDraft = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, value.trim()]),
    ) as EditableJobInfo;

    if (!normalizedDraft.title || !normalizedDraft.company) {
      setError("Role dan perusahaan perlu diisi.");
      return;
    }

    setIsSaving(true);
    try {
      if (jobId) {
        const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: normalizedDraft.title,
            company: normalizedDraft.company,
            source: normalizedDraft.source || null,
            location: normalizedDraft.location || null,
            workArrangement: normalizedDraft.arrangement || null,
          }),
        });
        const result = await readUpdateResponse(response);
        if (!response.ok || !result.data?.job) {
          throw new Error(
            result.error?.message ?? "Informasi lowongan belum dapat disimpan.",
          );
        }
      }

      setJobInfo(normalizedDraft);
      setError("");
      setIsEditing(false);
      setAnnouncement("Informasi lowongan berhasil diperbarui.");
      onUpdated?.(normalizedDraft);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Informasi lowongan belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section
      className={
        presentation === "card" ? "job-card-controls" : "job-detail-hero"
      }
      aria-label={presentation === "card" ? jobInfo.title : undefined}
      aria-labelledby={
        presentation === "detail" ? "job-detail-title" : undefined
      }
    >
      <div
        className={
          presentation === "card"
            ? "job-card-control-row"
            : "job-detail-identity-row"
        }
      >
        {presentation === "detail" ? (
          <div className="job-detail-identity">
            <span className="job-detail-logo" aria-hidden="true">
              {initialJob.initials}
            </span>
            <div>
              <p className="eyebrow">{t("Lowongan tersimpan")}</p>
              <h1 id="job-detail-title">{jobInfo.title}</h1>
              <span className="job-detail-company">
                <Building2 aria-hidden="true" size={15} strokeWidth={1.8} />
                {jobInfo.company}
              </span>
            </div>
          </div>
        ) : null}

        {!isEditing && allowEditing ? (
          <div className="job-detail-actions">
            <ActionButton
              className="job-info-edit-button ui-record-action ui-record-action--edit"
              size="compact"
              variant="ghost"
              type="button"
              title={t("Edit info")}
              onClick={openEditor}
            >
              <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
              <span className="sr-only">{t("Edit info")}</span>
            </ActionButton>
            {jobId ? (
              <ActionButton
                className="job-delete-button ui-record-action ui-record-action--delete"
                size="compact"
                variant="destructive-ghost"
                type="button"
                title={t("Hapus lowongan")}
                onClick={openDeleteDialog}
              >
                <Trash2 aria-hidden="true" size={15} strokeWidth={1.9} />
                <span className="sr-only">{t("Hapus lowongan")}</span>
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <form className="job-info-editor" onSubmit={handleSubmit}>
          <div className="job-info-editor-heading">
            <strong>{t("Edit informasi lowongan")}</strong>
            <span>
              {t(
                "Sesuaikan konteks pekerjaan tanpa mengubah status pengolahannya.",
              )}
            </span>
          </div>

          <label htmlFor={titleId}>
            <span>Role</span>
            <input
              id={titleId}
              ref={titleRef}
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
            />
          </label>
          <label htmlFor={companyId}>
            <span>{t("Perusahaan")}</span>
            <input
              id={companyId}
              value={draft.company}
              onChange={(event) => updateDraft("company", event.target.value)}
            />
          </label>
          <JobSourceField
            value={draft.source}
            onChange={(value) => updateDraft("source", value)}
            disabled={isSaving}
          />
          <label htmlFor={locationId}>
            <span>{t("Lokasi")}</span>
            <input
              id={locationId}
              value={draft.location}
              onChange={(event) => updateDraft("location", event.target.value)}
            />
          </label>
          <label htmlFor={arrangementId}>
            <span>{t("Cara kerja")}</span>
            <select
              id={arrangementId}
              value={draft.arrangement}
              onChange={(event) =>
                updateDraft("arrangement", event.target.value)
              }
            >
              <option value="">{t("Belum disebutkan")}</option>
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </label>
          <div className="job-info-editor-actions">
            {t(error) ? <p role="alert">{t(error)}</p> : <span />}
            <div>
              <ActionButton
                className="career-button secondary"
                variant="secondary"
                type="button"
                onClick={closeEditor}
                disabled={isSaving}
              >
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                {t("Batal")}
              </ActionButton>
              <ActionButton
                className="career-button primary"
                type="submit"
                disabled={isSaving}
              >
                <Check aria-hidden="true" size={16} strokeWidth={2} />
                {isSaving ? t("Menyimpan…") : t("Simpan perubahan")}
              </ActionButton>
            </div>
          </div>
        </form>
      ) : null}

      {presentation === "detail" ? (
        <div className="job-detail-meta" aria-label={t("Konteks lowongan")}>
          <span>
            <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
            <small>{t("Sumber")}</small>
            <strong>{jobInfo.source || t("Belum diisi")}</strong>
          </span>
          <span>
            <MapPin aria-hidden="true" size={14} strokeWidth={1.8} />
            <small>{t("Lokasi")}</small>
            <strong>{jobInfo.location || t("Belum diisi")}</strong>
          </span>
          <span>
            <Monitor aria-hidden="true" size={14} strokeWidth={1.8} />
            <small>{t("Cara kerja")}</small>
            <strong>{jobInfo.arrangement || t("Belum diisi")}</strong>
          </span>
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">
        {t(announcement)}
      </span>

      {isDeleteDialogOpen ? (
        <div className="job-delete-dialog-backdrop">
          <div
            className="job-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="job-delete-dialog-title"
            aria-describedby="job-delete-dialog-description"
          >
            <span className="job-delete-dialog-icon" aria-hidden="true">
              <Trash2 size={20} strokeWidth={1.8} />
            </span>
            <div>
              <p className="eyebrow">{t("Konfirmasi penghapusan")}</p>
              <h2 id="job-delete-dialog-title">{t("Hapus lowongan ini?")}</h2>
              <p id="job-delete-dialog-description">
                <strong>{jobInfo.title}</strong> {t("di")} {jobInfo.company}{" "}
                {t("akan dihapus permanen dari daftar lowonganmu.")}
              </p>
            </div>
            {deleteError ? (
              <p className="job-delete-error" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="job-delete-dialog-actions">
              <button
                ref={cancelDeleteRef}
                className="ui-button ui-button--secondary ui-button--default career-button secondary"
                type="button"
                disabled={isDeleting}
                onClick={closeDeleteDialog}
              >
                {t("Batal")}
              </button>
              <button
                className="ui-button ui-button--destructive ui-button--default career-button danger"
                type="button"
                disabled={isDeleting}
                onClick={deleteJob}
              >
                {isDeleting ? t("Menghapus…") : t("Ya, hapus lowongan")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type UpdateResponse = {
  data?: { job?: { id: string } };
  error?: { message?: string };
};

type DeleteResponse = {
  error?: { message?: string };
};

async function readUpdateResponse(response: Response): Promise<UpdateResponse> {
  try {
    return (await response.json()) as UpdateResponse;
  } catch {
    return {};
  }
}

async function readDeleteResponse(response: Response): Promise<DeleteResponse> {
  try {
    return (await response.json()) as DeleteResponse;
  } catch {
    return {};
  }
}
