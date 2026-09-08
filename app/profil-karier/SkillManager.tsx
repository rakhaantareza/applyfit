"use client";

import {
  Check,
  Link2,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { ActionButton } from "../components/ActionControl";
import { SectionHeader } from "../components/ContentHeaders";
import {
  SearchableCombobox,
  type SearchableComboboxOption,
} from "../components/SearchableCombobox";
import { normalizeComboboxSearch } from "../components/searchable-combobox-ranking";
import type { CareerCatalog } from "./catalog-types";
import {
  buildDefaultSkillComboboxOptions,
  buildSkillComboboxOptions,
} from "./skill-options";

export type CareerSkill = {
  id: string;
  name: string;
  catalogSkillId: string | null;
  level: "Mahir" | "Menengah" | "Dasar";
  status: "Aktif" | "Dipelajari";
  evidenceCount: number;
};

type SkillManagerProps = {
  initialSkills: CareerSkill[];
  catalog: CareerCatalog;
  careerFieldId: string | null;
  targetRoleId: string | null;
};

type EditorState =
  | { mode: "add" }
  | { mode: "edit"; skillId: string }
  | null;

export function SkillManager({
  initialSkills,
  catalog,
  careerFieldId,
  targetRoleId,
}: SkillManagerProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCatalogSkillId, setDraftCatalogSkillId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<CareerSkill["status"]>("Aktif");
  const [draftLevel, setDraftLevel] = useState<CareerSkill["level"]>("Dasar");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const skillNameId = useId();
  const skillStatusId = useId();
  const skillNameRef = useRef<HTMLInputElement>(null);
  const editingSkillId = editor?.mode === "edit" ? editor.skillId : null;
  const skillOptions = useMemo<SearchableComboboxOption[]>(() =>
    buildSkillComboboxOptions({
      catalog,
      skills,
      editingSkillId,
      careerFieldId,
      targetRoleId,
    }), [careerFieldId, catalog, editingSkillId, skills, targetRoleId]);
  const defaultSkillOptions = useMemo<SearchableComboboxOption[]>(() =>
    buildDefaultSkillComboboxOptions({
      catalog,
      skills,
      editingSkillId,
      careerFieldId,
      targetRoleId,
    }), [careerFieldId, catalog, editingSkillId, skills, targetRoleId]);

  useEffect(() => {
    if (!editor) return;

    const focusFrame = window.requestAnimationFrame(() => {
      skillNameRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [editor]);

  function openAddEditor() {
    setDraftName("");
    setDraftCatalogSkillId(null);
    setDraftStatus("Aktif");
    setDraftLevel("Dasar");
    setPendingDeleteId(null);
    setError("");
    setEditor({ mode: "add" });
  }

  function openEditEditor(skill: CareerSkill) {
    setDraftName(skill.name);
    setDraftCatalogSkillId(skill.catalogSkillId);
    setDraftStatus(skill.status);
    setDraftLevel(skill.level);
    setPendingDeleteId(null);
    setError("");
    setEditor({ mode: "edit", skillId: skill.id });
  }

  function closeEditor() {
    setEditor(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = draftName.trim();
    const normalizedDraftName = normalizeComboboxSearch(trimmedName);
    const exactCatalogSkill = catalog.skills.find((skill) =>
      normalizeComboboxSearch(skill.name) === normalizedDraftName ||
      skill.aliases.some((alias) => normalizeComboboxSearch(alias) === normalizedDraftName));
    const normalizedName = exactCatalogSkill?.name ?? trimmedName;
    const catalogSkillId = exactCatalogSkill?.id ?? draftCatalogSkillId;

    if (!normalizedName) {
      setError("Nama skill perlu diisi.");
      return;
    }

    const duplicateSkill = skills.find(
      (skill) =>
        (
          (catalogSkillId && skill.catalogSkillId === catalogSkillId) ||
          normalizeComboboxSearch(skill.name) === normalizeComboboxSearch(normalizedName)
        ) &&
        (editor?.mode !== "edit" || skill.id !== editor.skillId),
    );

    if (duplicateSkill) {
      setError("Skill ini sudah ada di profil.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const isEditing = editor?.mode === "edit";
      const endpoint = isEditing
        ? `/api/career-profile/skills/${encodeURIComponent(editor.skillId)}`
        : "/api/career-profile/skills";
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          catalogSkillId,
          status: draftStatus === "Dipelajari" ? "learning" : "active",
          level: draftLevel,
        }),
      });
      const result = await readSkillResponse(response);
      if (!response.ok || !result.data?.skill) {
        throw new Error(result.error?.message ?? "Skill belum dapat disimpan.");
      }

      const savedSkill = toCareerSkill(result.data.skill, isEditing
        ? skills.find((skill) => skill.id === editor.skillId)?.evidenceCount ?? 0
        : 0);
      if (isEditing) {
        setSkills((current) => current.map((skill) =>
          skill.id === savedSkill.id ? savedSkill : skill));
        setAnnouncement(`${savedSkill.name} berhasil diperbarui.`);
      } else {
        setSkills((current) => [...current, savedSkill]
          .sort((first, second) => first.name.localeCompare(second.name, "id-ID")));
        setAnnouncement(`${savedSkill.name} berhasil ditambahkan.`);
      }

      setEditor(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Skill belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteSkill(skill: CareerSkill) {
    setDeletingSkillId(skill.id);
    setError("");
    try {
      const response = await fetch(
        `/api/career-profile/skills/${encodeURIComponent(skill.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok && response.status !== 204) {
        const result = await readSkillResponse(response);
        throw new Error(result.error?.message ?? "Skill belum dapat dihapus.");
      }
      setSkills((current) => current.filter((item) => item.id !== skill.id));
      setPendingDeleteId(null);
      if (editor?.mode === "edit" && editor.skillId === skill.id) setEditor(null);
      setAnnouncement(`${skill.name} berhasil dihapus.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Skill belum dapat dihapus.",
      );
    } finally {
      setDeletingSkillId(null);
    }
  }

  return (
    <section className="profile-skills-section" aria-labelledby="profile-skills-title">
      <SectionHeader
        title="Skill"
        titleId="profile-skills-title"
        description="Skill yang kamu punya atau lagi kamu pelajari."
        action={(
          <ActionButton className="skill-add-button" variant="secondary" type="button" onClick={openAddEditor}>
            <Plus aria-hidden="true" size={16} strokeWidth={2} />
            Tambah skill
          </ActionButton>
        )}
      />

      {!editor && error ? <p className="skill-manager-error" role="alert">{error}</p> : null}

      {editor ? (
        <form className="profile-inline-editor skill-editor" onSubmit={handleSubmit}>
          <label htmlFor={skillNameId}>
            <span>Nama skill</span>
            <SearchableCombobox
              id={skillNameId}
              ref={skillNameRef}
              value={draftName}
              onChange={(value) => {
                setDraftName(value);
                setDraftCatalogSkillId(null);
              }}
              onSelect={(option) => setDraftCatalogSkillId(option.id)}
              options={skillOptions}
              defaultOptions={defaultSkillOptions}
              placeholder="Contoh: Node.js"
              autoComplete="off"
            />
          </label>
          <label className="skill-learning-toggle" htmlFor={skillStatusId}>
            <input
              id={skillStatusId}
              type="checkbox"
              checked={draftStatus === "Dipelajari"}
              onChange={(event) =>
                setDraftStatus(event.target.checked ? "Dipelajari" : "Aktif")
              }
            />
            <span>Saya masih mempelajari skill ini</span>
          </label>
          <div className="skill-editor-actions">
            {error ? <p role="alert">{error}</p> : <span />}
            <div>
              <ActionButton className="career-button secondary" variant="secondary" type="button" onClick={closeEditor} disabled={isSaving}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </ActionButton>
              <ActionButton className="career-button primary" type="submit" disabled={isSaving}>
                {isSaving ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} strokeWidth={2} />}
                {isSaving ? "Menyimpan…" : "Simpan skill"}
              </ActionButton>
            </div>
          </div>
        </form>
      ) : null}

      <div className="profile-skill-list" aria-live="polite">
        {skills.map((skill) => {
          const isPendingDelete = pendingDeleteId === skill.id;

          return (
            <article className="profile-skill-row responsive-list-row" key={skill.id}>
              <div className="profile-skill-name">
                <h3 className="type-primary-title">{skill.name}</h3>
                <div className="profile-skill-meta">
                  <span className="profile-skill-evidence">
                    <Link2 aria-hidden="true" size={14} strokeWidth={1.8} />
                    {formatEvidenceSupport(skill.evidenceCount)}
                  </span>
                  {skill.status === "Dipelajari" ? (
                    <span className="skill-state-badge learning">
                      Sedang dipelajari
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="skill-row-actions">
                <details className="skill-row-menu">
                  <summary aria-label={`Tindakan untuk ${skill.name}`}>
                    <MoreHorizontal aria-hidden="true" size={17} strokeWidth={1.9} />
                  </summary>
                  <div>
                    {isPendingDelete ? (
                      <div className="skill-delete-confirmation" role="group" aria-label={`Hapus ${skill.name}`}>
                        <span>Hapus skill ini?</span>
                        <button type="button" onClick={() => setPendingDeleteId(null)}>Batal</button>
                        <button className="danger" type="button" disabled={deletingSkillId === skill.id} onClick={() => deleteSkill(skill)}>
                          {deletingSkillId === skill.id ? "Menghapus…" : "Hapus"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          openEditEditor(skill);
                        }}>
                          <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
                          Edit
                        </button>
                        <button className="danger" type="button" onClick={() => {
                          setPendingDeleteId(skill.id);
                          setEditor(null);
                        }}>
                          <Trash2 aria-hidden="true" size={15} strokeWidth={1.9} />
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </details>
              </div>
            </article>
          );
        })}

        {skills.length === 0 ? (
          <div className="skill-empty-state">
            <strong>Belum ada skill</strong>
            <p>Tambahkan skill yang sedang kamu bangun.</p>
            <button type="button" onClick={openAddEditor}>Tambah skill</button>
          </div>
        ) : null}
      </div>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </section>
  );
}

type ApiSkill = {
  id: string;
  name: string;
  catalogSkillId: string | null;
  status: "active" | "learning";
  level: string | null;
};

type SkillResponse = {
  data?: { skill?: ApiSkill };
  error?: { message?: string };
};

function toCareerSkill(skill: ApiSkill, evidenceCount: number): CareerSkill {
  const level = skill.level === "Mahir" || skill.level === "Menengah" || skill.level === "Dasar"
    ? skill.level
    : "Dasar";
  return {
    id: skill.id,
    name: skill.name,
    catalogSkillId: skill.catalogSkillId,
    level,
    status: skill.status === "learning" ? "Dipelajari" : "Aktif",
    evidenceCount,
  };
}

async function readSkillResponse(response: Response): Promise<SkillResponse> {
  try {
    return await response.json() as SkillResponse;
  } catch {
    return {};
  }
}

function formatEvidenceSupport(count: number) {
  if (count === 0) return "Belum ada bukti pendukung";
  return `${count} bukti pendukung`;
}
