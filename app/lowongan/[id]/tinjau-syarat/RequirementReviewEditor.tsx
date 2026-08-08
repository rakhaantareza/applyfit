"use client";

import {
  Check,
  CircleAlert,
  GraduationCap,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  UserRoundCheck,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type RequirementPriority = "Wajib" | "Diutamakan";
type RequirementType = "Skill" | "Pengalaman" | "Pendidikan";

type Requirement = {
  id: string;
  priority: RequirementPriority;
  type: RequirementType;
  text: string;
  reviewed: boolean;
};

type EditorState =
  | { mode: "add" }
  | { mode: "edit"; requirementId: string }
  | null;

const initialRequirements: Requirement[] = [
  {
    id: "react-typescript",
    priority: "Wajib",
    type: "Skill",
    text: "Mampu membangun fitur web menggunakan React dan TypeScript.",
    reviewed: false,
  },
  {
    id: "html-css-javascript",
    priority: "Wajib",
    type: "Skill",
    text: "Memahami JavaScript modern, HTML, dan CSS.",
    reviewed: false,
  },
  {
    id: "git-review",
    priority: "Wajib",
    type: "Skill",
    text: "Terbiasa menggunakan Git dan berpartisipasi dalam code review.",
    reviewed: false,
  },
  {
    id: "communication",
    priority: "Wajib",
    type: "Skill",
    text: "Mampu berkomunikasi dan memecahkan masalah secara terstruktur.",
    reviewed: false,
  },
  {
    id: "frontend-experience",
    priority: "Wajib",
    type: "Pengalaman",
    text: "Memiliki pengalaman profesional membangun aplikasi frontend.",
    reviewed: false,
  },
  {
    id: "nextjs",
    priority: "Diutamakan",
    type: "Skill",
    text: "Memiliki pengalaman menggunakan Next.js.",
    reviewed: false,
  },
  {
    id: "automated-testing",
    priority: "Diutamakan",
    type: "Skill",
    text: "Memahami automated testing untuk aplikasi web.",
    reviewed: false,
  },
  {
    id: "education",
    priority: "Diutamakan",
    type: "Pendidikan",
    text: "Latar belakang pendidikan di bidang ilmu komputer atau bidang terkait.",
    reviewed: false,
  },
];

const requirementTypeIcons = {
  Skill: Wrench,
  Pengalaman: UserRoundCheck,
  Pendidikan: GraduationCap,
} as const;

export function RequirementReviewEditor() {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftText, setDraftText] = useState("");
  const [draftPriority, setDraftPriority] = useState<RequirementPriority>("Wajib");
  const [draftType, setDraftType] = useState<RequirementType>("Skill");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const textId = useId();
  const priorityId = useId();
  const typeId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const requiredRequirements = requirements.filter((item) => item.priority === "Wajib");
  const preferredRequirements = requirements.filter((item) => item.priority === "Diutamakan");
  const excludedRequirementCount = requirements.filter((item) => item.type !== "Skill").length;

  useEffect(() => {
    if (!editor) return;

    const focusFrame = window.requestAnimationFrame(() => textRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [editor]);

  function openAddEditor() {
    setDraftText("");
    setDraftPriority("Wajib");
    setDraftType("Skill");
    setError("");
    setAnnouncement("");
    setEditor({ mode: "add" });
  }

  function openEditEditor(requirement: Requirement) {
    setDraftText(requirement.text);
    setDraftPriority(requirement.priority);
    setDraftType(requirement.type);
    setError("");
    setAnnouncement("");
    setEditor({ mode: "edit", requirementId: requirement.id });
  }

  function closeEditor() {
    setError("");
    setEditor(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = draftText.trim();
    if (!text) {
      setError("Isi requirement perlu ditulis.");
      return;
    }

    if (editor?.mode === "edit") {
      setRequirements((current) =>
        current.map((requirement) =>
          requirement.id === editor.requirementId
            ? {
                ...requirement,
                text,
                priority: draftPriority,
                type: draftType,
                reviewed: true,
              }
            : requirement,
        ),
      );
      setAnnouncement("Requirement berhasil diperbarui pada data contoh.");
    } else {
      setRequirements((current) => [
        ...current,
        {
          id: `requirement-${Date.now()}`,
          text,
          priority: draftPriority,
          type: draftType,
          reviewed: true,
        },
      ]);
      setAnnouncement("Requirement baru berhasil ditambahkan pada data contoh.");
    }

    setError("");
    setEditor(null);
  }

  function renderRequirementGroup(
    title: RequirementPriority,
    description: string,
    items: Requirement[],
  ) {
    return (
      <div className={`requirement-review-group${title === "Diutamakan" ? " preferred" : ""}`}>
        <div className="requirement-review-group-heading">
          <span aria-hidden="true"><ListChecks size={16} strokeWidth={1.8} /></span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>
        <div className="requirement-review-list">
          {items.map((requirement, index) => {
            const TypeIcon = requirementTypeIcons[requirement.type];

            return (
              <article key={requirement.id}>
                <span className="requirement-review-number">{index + 1}</span>
                <div>
                  <span className="requirement-review-type">
                    <TypeIcon aria-hidden="true" size={13} strokeWidth={1.8} />
                    {requirement.type}
                  </span>
                  <p>{requirement.text}</p>
                </div>
                <span className={`requirement-review-state${requirement.reviewed ? " reviewed" : ""}`}>
                  {requirement.reviewed ? (
                    <UserRoundCheck aria-hidden="true" size={12} strokeWidth={1.8} />
                  ) : (
                    <Sparkles aria-hidden="true" size={12} strokeWidth={1.8} />
                  )}
                  {requirement.reviewed ? "Diedit pengguna" : "Hasil AI"}
                </span>
                <button
                  className="requirement-edit-button"
                  type="button"
                  aria-label={`Edit requirement: ${requirement.text}`}
                  onClick={() => openEditEditor(requirement)}
                >
                  <Pencil aria-hidden="true" size={14} strokeWidth={1.9} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="requirement-review-list-section" aria-labelledby="review-list-title">
      <div className="requirement-review-section-heading">
        <div>
          <p className="eyebrow">Draft requirement</p>
          <h2 id="review-list-title">Hasil yang perlu diperiksa</h2>
        </div>
        <div className="requirement-review-heading-actions">
          <div className="requirement-review-counts" aria-label="Ringkasan hasil ekstraksi">
            <span><strong>{requiredRequirements.length}</strong> wajib</span>
            <span><strong>{preferredRequirements.length}</strong> diutamakan</span>
            <span><strong>{excludedRequirementCount}</strong> di luar skor MVP</span>
          </div>
          <button type="button" onClick={openAddEditor}>
            <Plus aria-hidden="true" size={15} strokeWidth={2} />
            Tambah requirement
          </button>
        </div>
      </div>

      {editor ? (
        <form className="requirement-editor" onSubmit={handleSubmit}>
          <div className="requirement-editor-heading">
            <strong>{editor.mode === "add" ? "Tambah requirement" : "Edit requirement"}</strong>
            <span>Gunakan satu kalimat yang menjelaskan satu requirement dengan jelas.</span>
          </div>
          <label className="requirement-editor-text" htmlFor={textId}>
            <span>Isi requirement</span>
            <textarea
              id={textId}
              ref={textRef}
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={3}
            />
          </label>
          <label htmlFor={priorityId}>
            <span>Prioritas</span>
            <select
              id={priorityId}
              value={draftPriority}
              onChange={(event) => setDraftPriority(event.target.value as RequirementPriority)}
            >
              <option>Wajib</option>
              <option>Diutamakan</option>
            </select>
          </label>
          <label htmlFor={typeId}>
            <span>Tipe</span>
            <select
              id={typeId}
              value={draftType}
              onChange={(event) => setDraftType(event.target.value as RequirementType)}
            >
              <option>Skill</option>
              <option>Pengalaman</option>
              <option>Pendidikan</option>
            </select>
          </label>
          <div className="requirement-editor-actions">
            {error ? <p role="alert">{error}</p> : <span />}
            <div>
              <button className="career-button secondary" type="button" onClick={closeEditor}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </button>
              <button className="career-button primary" type="submit">
                <Check aria-hidden="true" size={16} strokeWidth={2} />
                Simpan requirement
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {renderRequirementGroup(
        "Wajib",
        "Requirement utama yang dinyatakan perlu dipenuhi pada lowongan.",
        requiredRequirements,
      )}
      {renderRequirementGroup(
        "Diutamakan",
        "Kualifikasi tambahan yang memberi konteks, dengan bobot lebih rendah.",
        preferredRequirements,
      )}

      <div className="requirement-review-note">
        <CircleAlert aria-hidden="true" size={17} strokeWidth={1.8} />
        <p>
          Requirement pengalaman dan pendidikan tetap disimpan sebagai konteks,
          tetapi tidak dihitung dalam Fit Score MVP. Halaman ini belum menampilkan
          status kesiapan profil.
        </p>
      </div>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </section>
  );
}
