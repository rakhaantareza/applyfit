"use client";

import {
  BriefcaseBusiness,
  Building2,
  Check,
  ExternalLink,
  MapPin,
  Monitor,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { MockJob } from "../mockJobs";

type JobInfoEditorProps = {
  initialJob: MockJob;
};

type EditableJobInfo = {
  title: string;
  company: string;
  source: string;
  location: string;
  arrangement: string;
  employmentType: string;
};

export function JobInfoEditor({ initialJob }: JobInfoEditorProps) {
  const initialInfo: EditableJobInfo = {
    title: initialJob.title,
    company: initialJob.company,
    source: initialJob.source,
    location: initialJob.location,
    arrangement: initialJob.arrangement,
    employmentType: initialJob.employmentType,
  };
  const [jobInfo, setJobInfo] = useState(initialInfo);
  const [draft, setDraft] = useState(initialInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const titleId = useId();
  const companyId = useId();
  const sourceId = useId();
  const locationId = useId();
  const arrangementId = useId();
  const employmentTypeId = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) return;

    const focusFrame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isEditing]);

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

  function updateDraft(field: keyof EditableJobInfo, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDraft = Object.fromEntries(
      Object.entries(draft).map(([key, value]) => [key, value.trim()]),
    ) as EditableJobInfo;

    if (!normalizedDraft.title || !normalizedDraft.company) {
      setError("Role dan perusahaan perlu diisi.");
      return;
    }

    setJobInfo(normalizedDraft);
    setError("");
    setIsEditing(false);
    setAnnouncement("Informasi lowongan contoh berhasil diperbarui.");
  }

  return (
    <section className="job-detail-hero" aria-labelledby="job-detail-title">
      <div className="job-detail-identity-row">
        <div className="job-detail-identity">
          <span className="job-detail-logo" aria-hidden="true">{initialJob.initials}</span>
          <div>
            <p className="eyebrow">Lowongan tersimpan</p>
            <h1 id="job-detail-title">{jobInfo.title}</h1>
            <span className="job-detail-company">
              <Building2 aria-hidden="true" size={15} strokeWidth={1.8} />
              {jobInfo.company}
            </span>
          </div>
        </div>

        {!isEditing ? (
          <button className="job-info-edit-button" type="button" onClick={openEditor}>
            <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
            Edit info
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <form className="job-info-editor" onSubmit={handleSubmit}>
          <div className="job-info-editor-heading">
            <strong>Edit informasi lowongan</strong>
            <span>Sesuaikan konteks pekerjaan tanpa mengubah status pengolahannya.</span>
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
            <span>Perusahaan</span>
            <input
              id={companyId}
              value={draft.company}
              onChange={(event) => updateDraft("company", event.target.value)}
            />
          </label>
          <label htmlFor={sourceId}>
            <span>Sumber</span>
            <input
              id={sourceId}
              value={draft.source}
              onChange={(event) => updateDraft("source", event.target.value)}
            />
          </label>
          <label htmlFor={locationId}>
            <span>Lokasi</span>
            <input
              id={locationId}
              value={draft.location}
              onChange={(event) => updateDraft("location", event.target.value)}
            />
          </label>
          <label htmlFor={arrangementId}>
            <span>Cara kerja</span>
            <select
              id={arrangementId}
              value={draft.arrangement}
              onChange={(event) => updateDraft("arrangement", event.target.value)}
            >
              <option>On-site</option>
              <option>Hybrid</option>
              <option>Remote</option>
            </select>
          </label>
          <label htmlFor={employmentTypeId}>
            <span>Tipe pekerjaan</span>
            <select
              id={employmentTypeId}
              value={draft.employmentType}
              onChange={(event) => updateDraft("employmentType", event.target.value)}
            >
              <option>Penuh waktu</option>
              <option>Paruh waktu</option>
              <option>Kontrak</option>
              <option>Magang</option>
            </select>
          </label>

          <div className="job-info-editor-actions">
            {error ? <p role="alert">{error}</p> : <span />}
            <div>
              <button className="career-button secondary" type="button" onClick={closeEditor}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </button>
              <button className="career-button primary" type="submit">
                <Check aria-hidden="true" size={16} strokeWidth={2} />
                Simpan perubahan
              </button>
            </div>
          </div>
        </form>
      ) : null}

      <div className="job-detail-meta" aria-label="Konteks lowongan">
        <span>
          <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
          <small>Sumber</small>
          <strong>{jobInfo.source || "Belum diisi"}</strong>
        </span>
        <span>
          <MapPin aria-hidden="true" size={14} strokeWidth={1.8} />
          <small>Lokasi</small>
          <strong>{jobInfo.location || "Belum diisi"}</strong>
        </span>
        <span>
          <Monitor aria-hidden="true" size={14} strokeWidth={1.8} />
          <small>Cara kerja</small>
          <strong>{jobInfo.arrangement}</strong>
        </span>
        <span>
          <BriefcaseBusiness aria-hidden="true" size={14} strokeWidth={1.8} />
          <small>Tipe</small>
          <strong>{jobInfo.employmentType}</strong>
        </span>
      </div>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </section>
  );
}
