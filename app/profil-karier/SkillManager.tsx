"use client";

import {
  Check,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export type CareerSkill = {
  id: string;
  name: string;
  level: "Mahir" | "Menengah" | "Dasar";
  status: "Aktif" | "Dipelajari";
  evidenceCount: number;
};

type SkillManagerProps = {
  initialSkills: CareerSkill[];
};

type EditorState =
  | { mode: "add" }
  | { mode: "edit"; skillId: string }
  | null;

export function SkillManager({ initialSkills }: SkillManagerProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftName, setDraftName] = useState("");
  const [draftStatus, setDraftStatus] = useState<CareerSkill["status"]>("Aktif");
  const [draftLevel, setDraftLevel] = useState<CareerSkill["level"]>("Dasar");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const skillNameId = useId();
  const skillStatusId = useId();
  const skillLevelId = useId();
  const skillNameRef = useRef<HTMLInputElement>(null);

  const activeSkillCount = skills.filter((skill) => skill.status === "Aktif").length;
  const learningSkillCount = skills.length - activeSkillCount;
  const linkedEvidenceCount = skills.reduce(
    (total, skill) => total + skill.evidenceCount,
    0,
  );

  useEffect(() => {
    if (!editor) return;

    const focusFrame = window.requestAnimationFrame(() => {
      skillNameRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [editor]);

  function openAddEditor() {
    setDraftName("");
    setDraftStatus("Aktif");
    setDraftLevel("Dasar");
    setPendingDeleteId(null);
    setError("");
    setEditor({ mode: "add" });
  }

  function openEditEditor(skill: CareerSkill) {
    setDraftName(skill.name);
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
    const normalizedName = draftName.trim();

    if (!normalizedName) {
      setError("Nama skill perlu diisi.");
      return;
    }

    const duplicateSkill = skills.find(
      (skill) =>
        skill.name.toLocaleLowerCase("id-ID") ===
          normalizedName.toLocaleLowerCase("id-ID") &&
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
      <div className="profile-section-heading responsive-card-heading">
        <div>
          <p className="eyebrow">Fondasi keahlian</p>
          <h2 id="profile-skills-title">Skill yang membentuk profilmu</h2>
        </div>
        <div className="profile-skill-heading-actions responsive-card-heading-actions">
          <p>
            Status skill di profil berbeda dari status requirement. Bukti yang
            terhubung akan menentukan hasil kecocokan pada setiap lowongan.
          </p>
          <button className="skill-add-button" type="button" onClick={openAddEditor}>
            <Plus aria-hidden="true" size={16} strokeWidth={2} />
            Tambah skill
          </button>
        </div>
      </div>

      <div className="skill-manager-summary" aria-label="Ringkasan skill">
        <span><strong>{skills.length}</strong> skill</span>
        <span><strong>{activeSkillCount}</strong> aktif</span>
        <span><strong>{learningSkillCount}</strong> dipelajari</span>
        <span><strong>{linkedEvidenceCount}</strong> tautan bukti</span>
      </div>

      {!editor && error ? <p className="skill-manager-error" role="alert">{error}</p> : null}

      {editor ? (
        <form className="skill-editor" onSubmit={handleSubmit}>
          <div className="skill-editor-heading">
            <strong>{editor.mode === "add" ? "Tambah skill" : "Edit skill"}</strong>
            <span>
              Atur status dan tingkat keahlian sesuai kondisi profil saat ini.
            </span>
          </div>
          <label htmlFor={skillNameId}>
            <span>Nama skill</span>
            <input
              id={skillNameId}
              ref={skillNameRef}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Contoh: Node.js"
              autoComplete="off"
            />
          </label>
          <label htmlFor={skillStatusId}>
            <span>Status</span>
            <select
              id={skillStatusId}
              value={draftStatus}
              onChange={(event) =>
                setDraftStatus(event.target.value as CareerSkill["status"])
              }
            >
              <option>Aktif</option>
              <option>Dipelajari</option>
            </select>
          </label>
          <label htmlFor={skillLevelId}>
            <span>Tingkat keahlian</span>
            <select
              id={skillLevelId}
              value={draftLevel}
              onChange={(event) =>
                setDraftLevel(event.target.value as CareerSkill["level"])
              }
            >
              <option>Dasar</option>
              <option>Menengah</option>
              <option>Mahir</option>
            </select>
          </label>
          <div className="skill-editor-actions">
            {error ? <p role="alert">{error}</p> : <span />}
            <div>
              <button className="career-button secondary" type="button" onClick={closeEditor} disabled={isSaving}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </button>
              <button className="career-button primary" type="submit" disabled={isSaving}>
                {isSaving ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} strokeWidth={2} />}
                {isSaving ? "Menyimpan…" : "Simpan skill"}
              </button>
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
                <span aria-hidden="true">{skill.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h3>{skill.name}</h3>
                  <small>Skill profil</small>
                </div>
              </div>

              <div className="profile-skill-state">
                <span
                  className={`skill-state-badge ${
                    skill.status === "Aktif" ? "active" : "learning"
                  }`}
                >
                  {skill.status}
                </span>
                <span
                  className={`skill-level level-${skill.level.toLocaleLowerCase("id-ID")}`}
                >
                  Level {skill.level}
                </span>
              </div>

              <div className="profile-skill-evidence">
                <Link2 aria-hidden="true" size={15} strokeWidth={1.8} />
                <span>
                  {skill.evidenceCount > 0
                    ? `${skill.evidenceCount} bukti terhubung`
                    : "Belum ada bukti"}
                </span>
              </div>

              <div className="skill-row-actions">
                {isPendingDelete ? (
                  <div className="skill-delete-confirmation" role="group" aria-label={`Hapus ${skill.name}`}>
                    <span>Hapus skill?</span>
                    <button type="button" onClick={() => setPendingDeleteId(null)}>Batal</button>
                    <button className="danger" type="button" disabled={deletingSkillId === skill.id} onClick={() => deleteSkill(skill)}>
                      {deletingSkillId === skill.id ? "Menghapus…" : "Hapus"}
                    </button>
                  </div>
                ) : (
                  <>
                    <button type="button" aria-label={`Edit ${skill.name}`} onClick={() => openEditEditor(skill)}>
                      <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
                    </button>
                    <button type="button" aria-label={`Hapus ${skill.name}`} onClick={() => {
                      setPendingDeleteId(skill.id);
                      setEditor(null);
                    }}>
                      <Trash2 aria-hidden="true" size={15} strokeWidth={1.9} />
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}

        {skills.length === 0 ? (
          <div className="skill-empty-state">
            <strong>Belum ada skill di profil</strong>
            <p>Tambahkan skill pertama untuk membangun fondasi profil karier.</p>
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
