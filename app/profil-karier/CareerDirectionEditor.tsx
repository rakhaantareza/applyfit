"use client";

import {
  BriefcaseBusiness,
  Check,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type CareerDirectionEditorProps = {
  initialTargetRole: string;
  initialCareerField: string;
};

export function CareerDirectionEditor({
  initialTargetRole,
  initialCareerField,
}: CareerDirectionEditorProps) {
  const [targetRole, setTargetRole] = useState(initialTargetRole);
  const [careerField, setCareerField] = useState(initialCareerField);
  const [draftTargetRole, setDraftTargetRole] = useState(initialTargetRole);
  const [draftCareerField, setDraftCareerField] = useState(initialCareerField);
  const [isEditing, setIsEditing] = useState(
    !initialTargetRole || !initialCareerField,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const targetRoleId = useId();
  const careerFieldId = useId();
  const targetRoleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) return;

    const focusFrame = window.requestAnimationFrame(() => {
      targetRoleRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [isEditing]);

  function openEditor() {
    setDraftTargetRole(targetRole);
    setDraftCareerField(careerField);
    setError("");
    setAnnouncement("");
    setIsEditing(true);
  }

  function closeEditor() {
    setDraftTargetRole(targetRole);
    setDraftCareerField(careerField);
    setError("");
    setIsEditing(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTargetRole = draftTargetRole.trim();
    const nextCareerField = draftCareerField.trim();

    if (!nextTargetRole || !nextCareerField) {
      setError("Target role dan bidang karier perlu diisi.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const response = await fetch("/api/career-profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetRole: nextTargetRole,
          careerField: nextCareerField,
        }),
      });
      const result = await readCareerProfileResponse(response);
      if (!response.ok || !result.data?.profile) {
        throw new Error(result.error?.message ?? "Target karier belum dapat disimpan.");
      }

      setTargetRole(result.data.profile.targetRole);
      setCareerField(result.data.profile.careerField);
      setDraftTargetRole(result.data.profile.targetRole);
      setDraftCareerField(result.data.profile.careerField);
      setAnnouncement("Target karier berhasil diperbarui.");
      setIsEditing(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Target karier belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <form className="career-direction career-direction-form" onSubmit={handleSubmit}>
        <div className="career-form-heading">
          <span className="career-direction-icon" aria-hidden="true">
            <BriefcaseBusiness size={20} strokeWidth={1.8} />
          </span>
          <div>
            <strong>Ubah arah karier</strong>
            <span>Perubahan tersimpan pada profil karier akunmu.</span>
          </div>
        </div>

        <div className="career-form-fields">
          <label htmlFor={targetRoleId}>
            <span>Target role</span>
            <input
              id={targetRoleId}
              ref={targetRoleRef}
              value={draftTargetRole}
              onChange={(event) => setDraftTargetRole(event.target.value)}
              autoComplete="organization-title"
            />
          </label>
          <label htmlFor={careerFieldId}>
            <span>Bidang karier</span>
            <input
              id={careerFieldId}
              value={draftCareerField}
              onChange={(event) => setDraftCareerField(event.target.value)}
              autoComplete="off"
            />
          </label>
        </div>

        <div className="career-form-actions">
          {error ? <p role="alert">{error}</p> : <span />}
          <div>
            <button className="career-button secondary" type="button" onClick={closeEditor} disabled={isSaving || (!targetRole && !careerField)}>
              <X aria-hidden="true" size={16} strokeWidth={1.9} />
              Batal
            </button>
            <button className="career-button primary" type="submit" disabled={isSaving}>
              {isSaving ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} strokeWidth={2} />}
              {isSaving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="career-direction" aria-label="Target karier">
      <div className="career-direction-heading">
        <span className="career-direction-icon" aria-hidden="true">
          <BriefcaseBusiness size={20} strokeWidth={1.8} />
        </span>
        <div>
          <span>Arah yang dituju</span>
          <strong>{targetRole}</strong>
        </div>
      </div>
      <div className="career-direction-field">
        <span>Bidang karier</span>
        <strong>{careerField}</strong>
      </div>
      <button className="career-edit-button" type="button" onClick={openEditor}>
        <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
        Ubah
      </button>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

type CareerProfileResponse = {
  data?: {
    profile?: {
      targetRole: string;
      careerField: string;
    };
  };
  error?: { message?: string };
};

async function readCareerProfileResponse(response: Response): Promise<CareerProfileResponse> {
  try {
    return await response.json() as CareerProfileResponse;
  } catch {
    return {};
  }
}
