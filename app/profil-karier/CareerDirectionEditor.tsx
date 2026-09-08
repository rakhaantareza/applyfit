"use client";

import {
  Check,
  LoaderCircle,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "../components/ActionControl";
import { SectionHeader } from "../components/ContentHeaders";
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from "../components/SearchableCombobox";
import type { CareerCatalog } from "./catalog-types";

type CareerDirectionEditorProps = {
  initialTargetRole: string;
  initialTargetRoleId: string | null;
  initialCareerField: string;
  initialCareerFieldId: string | null;
  catalog: CareerCatalog;
  onSaved: (direction: {
    targetRole: string;
    targetRoleId: string | null;
    careerField: string;
    careerFieldId: string | null;
  }) => void;
};

export function CareerDirectionEditor({
  initialTargetRole,
  initialTargetRoleId,
  initialCareerField,
  initialCareerFieldId,
  catalog,
  onSaved,
}: CareerDirectionEditorProps) {
  const [targetRole, setTargetRole] = useState(initialTargetRole);
  const [targetRoleId, setTargetRoleId] = useState<string | null>(initialTargetRoleId);
  const [careerField, setCareerField] = useState(initialCareerField);
  const [careerFieldId, setCareerFieldId] = useState<string | null>(initialCareerFieldId);
  const [draftTargetRole, setDraftTargetRole] = useState(initialTargetRole);
  const [draftTargetRoleId, setDraftTargetRoleId] = useState<string | null>(initialTargetRoleId);
  const [draftCareerField, setDraftCareerField] = useState(initialCareerField);
  const [draftCareerFieldId, setDraftCareerFieldId] = useState<string | null>(initialCareerFieldId);
  const [isEditing, setIsEditing] = useState(
    !initialTargetRole || !initialCareerField,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const targetRoleInputId = useId();
  const careerFieldInputId = useId();
  const careerFieldRef = useRef<HTMLInputElement>(null);
  const fieldOptions = useMemo<SearchableComboboxOption[]>(() =>
    catalog.fields.map((field) => ({ id: field.id, value: field.name })),
  [catalog.fields]);
  const roleOptions = useMemo<SearchableComboboxOption[]>(() => {
    const fieldNames = new Map(catalog.fields.map((field) => [field.id, field.name]));
    return catalog.roles.map((role) => ({
      id: role.id,
      value: role.name,
      aliases: role.aliases,
      meta: role.fieldIds.map((fieldId) => fieldNames.get(fieldId)).filter(Boolean).join(" · "),
      priority: draftCareerFieldId && role.fieldIds.includes(draftCareerFieldId) ? 0 : 1,
    }));
  }, [catalog.fields, catalog.roles, draftCareerFieldId]);

  useEffect(() => {
    if (!isEditing) return;

    const focusFrame = window.requestAnimationFrame(() => {
      careerFieldRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [isEditing]);

  function openEditor() {
    setDraftTargetRole(targetRole);
    setDraftTargetRoleId(targetRoleId);
    setDraftCareerField(careerField);
    setDraftCareerFieldId(careerFieldId);
    setError("");
    setAnnouncement("");
    setIsEditing(true);
  }

  function closeEditor() {
    setDraftTargetRole(targetRole);
    setDraftTargetRoleId(targetRoleId);
    setDraftCareerField(careerField);
    setDraftCareerFieldId(careerFieldId);
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
          targetRoleId: draftTargetRoleId,
          careerField: nextCareerField,
          careerFieldId: draftCareerFieldId,
        }),
      });
      const result = await readCareerProfileResponse(response);
      if (!response.ok || !result.data?.profile) {
        throw new Error(result.error?.message ?? "Target karier belum dapat disimpan.");
      }

      setTargetRole(result.data.profile.targetRole);
      setTargetRoleId(result.data.profile.targetRoleId);
      setCareerField(result.data.profile.careerField);
      setCareerFieldId(result.data.profile.careerFieldId);
      setDraftTargetRole(result.data.profile.targetRole);
      setDraftTargetRoleId(result.data.profile.targetRoleId);
      setDraftCareerField(result.data.profile.careerField);
      setDraftCareerFieldId(result.data.profile.careerFieldId);
      onSaved(result.data.profile);
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
      <section className="career-profile-hero" aria-labelledby="career-direction-title">
        <SectionHeader
          className="profile-direction-heading"
          title="Arah karier"
          titleId="career-direction-title"
        />
        <form className="profile-inline-editor career-direction-form" onSubmit={handleSubmit}>
          <div className="career-form-fields">
            <label htmlFor={careerFieldInputId}>
              <span>Bidang karier</span>
              <SearchableCombobox
                id={careerFieldInputId}
                ref={careerFieldRef}
                value={draftCareerField}
                onChange={(value) => {
                  setDraftCareerField(value);
                  setDraftCareerFieldId(null);
                }}
                onSelect={(option) => setDraftCareerFieldId(option.id)}
                options={fieldOptions}
                autoComplete="off"
                placeholder="Contoh: Software & IT"
              />
            </label>
            <label htmlFor={targetRoleInputId}>
              <span>Target role</span>
              <SearchableCombobox
                id={targetRoleInputId}
                value={draftTargetRole}
                onChange={(value) => {
                  setDraftTargetRole(value);
                  setDraftTargetRoleId(null);
                }}
                onSelect={(option) => setDraftTargetRoleId(option.id)}
                options={roleOptions}
                autoComplete="organization-title"
                placeholder="Contoh: Frontend Engineer"
              />
            </label>
          </div>
          <div className="career-form-actions">
            {error ? <p role="alert">{error}</p> : <span />}
            <div>
              <ActionButton className="career-button secondary" variant="secondary" type="button" onClick={closeEditor} disabled={isSaving || (!targetRole && !careerField)}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </ActionButton>
              <ActionButton className="career-button primary" type="submit" disabled={isSaving}>
                {isSaving ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} strokeWidth={2} />}
                {isSaving ? "Menyimpan…" : "Simpan"}
              </ActionButton>
            </div>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="career-profile-hero" aria-labelledby="career-direction-title">
      <SectionHeader
        className="profile-direction-heading"
        title="Arah karier"
        titleId="career-direction-title"
        action={(
          <ActionButton className="career-edit-button" size="compact" variant="ghost" type="button" onClick={openEditor}>
            <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
            Ubah
          </ActionButton>
        )}
      />
      <div className="career-direction" aria-label="Target karier">
        <div className="career-direction-statement">
          <span>{careerField}</span>
          <strong>{targetRole}</strong>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
}

type CareerProfileResponse = {
  data?: {
    profile?: {
      targetRole: string;
      targetRoleId: string | null;
      careerField: string;
      careerFieldId: string | null;
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
