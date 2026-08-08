"use client";

import {
  Check,
  CircleAlert,
  Combine,
  GraduationCap,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UserRoundCheck,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type RequirementPriority = "Wajib" | "Preferensi";
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
    priority: "Preferensi",
    type: "Skill",
    text: "Memiliki pengalaman menggunakan Next.js.",
    reviewed: false,
  },
  {
    id: "automated-testing",
    priority: "Preferensi",
    type: "Skill",
    text: "Memahami automated testing untuk aplikasi web.",
    reviewed: false,
  },
  {
    id: "education",
    priority: "Preferensi",
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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState("");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const textId = useId();
  const priorityId = useId();
  const typeId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const requiredRequirements = requirements.filter((item) => item.priority === "Wajib");
  const preferredRequirements = requirements.filter((item) => item.priority === "Preferensi");
  const excludedRequirementCount = requirements.filter((item) => item.type !== "Skill").length;
  const selectedRequirements = requirements.filter((item) =>
    selectedRequirementIds.includes(item.id),
  );

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
    setPendingDeleteId(null);
    setIsSelectionMode(false);
    setSelectedRequirementIds([]);
    setSelectionError("");
    setEditor({ mode: "add" });
  }

  function openEditEditor(requirement: Requirement) {
    setDraftText(requirement.text);
    setDraftPriority(requirement.priority);
    setDraftType(requirement.type);
    setError("");
    setAnnouncement("");
    setPendingDeleteId(null);
    setIsSelectionMode(false);
    setSelectedRequirementIds([]);
    setSelectionError("");
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

  function deleteRequirement(requirement: Requirement) {
    setRequirements((current) =>
      current.filter((item) => item.id !== requirement.id),
    );
    setPendingDeleteId(null);
    setSelectedRequirementIds((current) =>
      current.filter((id) => id !== requirement.id),
    );
    if (editor?.mode === "edit" && editor.requirementId === requirement.id) {
      setEditor(null);
    }
    setAnnouncement("Requirement dihapus dari data contoh.");
  }

  function openSelectionMode() {
    setEditor(null);
    setPendingDeleteId(null);
    setSelectedRequirementIds([]);
    setSelectionError("");
    setAnnouncement("");
    setIsSelectionMode(true);
  }

  function closeSelectionMode() {
    setSelectedRequirementIds([]);
    setSelectionError("");
    setIsSelectionMode(false);
  }

  function toggleRequirementSelection(requirementId: string) {
    setSelectedRequirementIds((current) =>
      current.includes(requirementId)
        ? current.filter((id) => id !== requirementId)
        : [...current, requirementId],
    );
    setSelectionError("");
  }

  function mergeSelectedRequirements() {
    if (selectedRequirements.length < 2) {
      setSelectionError("Pilih minimal dua requirement untuk digabungkan.");
      return;
    }

    const [firstRequirement] = selectedRequirements;
    const hasMixedClassification = selectedRequirements.some(
      (requirement) =>
        requirement.priority !== firstRequirement.priority ||
        requirement.type !== firstRequirement.type,
    );

    if (hasMixedClassification) {
      setSelectionError(
        "Gabungkan requirement dengan tipe dan prioritas yang sama.",
      );
      return;
    }

    const mergedText = `${selectedRequirements
      .map((requirement) => requirement.text.trim().replace(/[.;]+$/, ""))
      .join("; ")}.`;
    const selectedIds = new Set(selectedRequirementIds);

    setRequirements((current) => [
      ...current.filter((requirement) => !selectedIds.has(requirement.id)),
      {
        id: `requirement-merged-${Date.now()}`,
        text: mergedText,
        priority: firstRequirement.priority,
        type: firstRequirement.type,
        reviewed: true,
      },
    ]);
    setSelectedRequirementIds([]);
    setSelectionError("");
    setIsSelectionMode(false);
    setAnnouncement(`${selectedRequirements.length} requirement berhasil digabungkan.`);
  }

  function updateRequirementPriority(
    requirement: Requirement,
    priority: RequirementPriority,
  ) {
    if (requirement.priority === priority) return;

    setRequirements((current) =>
      current.map((item) =>
        item.id === requirement.id
          ? { ...item, priority, reviewed: true }
          : item,
      ),
    );
    setPendingDeleteId(null);
    if (editor?.mode === "edit" && editor.requirementId === requirement.id) {
      setEditor(null);
    }
    setAnnouncement(`Prioritas diubah menjadi ${priority}.`);
  }

  function renderRequirementGroup(
    title: RequirementPriority,
    description: string,
    items: Requirement[],
  ) {
    return (
      <div className={`requirement-review-group${title === "Preferensi" ? " preferred" : ""}`}>
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
            const isPendingDelete = pendingDeleteId === requirement.id;

            return (
              <article
                className={`${isSelectionMode ? "selection-mode" : ""}${
                  selectedRequirementIds.includes(requirement.id) ? " selected" : ""
                }`}
                key={requirement.id}
              >
                {isSelectionMode ? (
                  <label className="requirement-selection-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRequirementIds.includes(requirement.id)}
                      onChange={() => toggleRequirementSelection(requirement.id)}
                    />
                    <span aria-hidden="true">
                      {selectedRequirementIds.includes(requirement.id) ? (
                        <Check size={12} strokeWidth={2.3} />
                      ) : null}
                    </span>
                    <span className="sr-only">Pilih requirement: {requirement.text}</span>
                  </label>
                ) : null}
                <span className="requirement-review-number">{index + 1}</span>
                <div>
                  <span className="requirement-review-type">
                    <TypeIcon aria-hidden="true" size={13} strokeWidth={1.8} />
                    {requirement.type}
                  </span>
                  <p>{requirement.text}</p>
                </div>
                {!isSelectionMode ? (
                  <div
                    className="requirement-priority-control"
                    role="group"
                    aria-label={`Prioritas requirement: ${requirement.text}`}
                  >
                    {(["Wajib", "Preferensi"] as const).map((priority) => (
                      <button
                        className={requirement.priority === priority ? "active" : undefined}
                        type="button"
                        aria-pressed={requirement.priority === priority}
                        key={priority}
                        onClick={() => updateRequirementPriority(requirement, priority)}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                ) : null}
                <span className={`requirement-review-state${requirement.reviewed ? " reviewed" : ""}`}>
                  {requirement.reviewed ? (
                    <UserRoundCheck aria-hidden="true" size={12} strokeWidth={1.8} />
                  ) : (
                    <Sparkles aria-hidden="true" size={12} strokeWidth={1.8} />
                  )}
                  {requirement.reviewed ? "Diedit pengguna" : "Hasil AI"}
                </span>
                {!isSelectionMode ? <div className="requirement-row-actions">
                  {isPendingDelete ? (
                    <div
                      className="requirement-delete-confirmation"
                      role="group"
                      aria-label={`Hapus requirement: ${requirement.text}`}
                    >
                      <span>Hapus requirement?</span>
                      <button type="button" onClick={() => setPendingDeleteId(null)}>
                        Batal
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => deleteRequirement(requirement)}
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="requirement-edit-button"
                        type="button"
                        aria-label={`Edit requirement: ${requirement.text}`}
                        onClick={() => openEditEditor(requirement)}
                      >
                        <Pencil aria-hidden="true" size={14} strokeWidth={1.9} />
                      </button>
                      <button
                        className="requirement-delete-button"
                        type="button"
                        aria-label={`Hapus requirement: ${requirement.text}`}
                        onClick={() => {
                          setPendingDeleteId(requirement.id);
                          setEditor(null);
                        }}
                      >
                        <Trash2 aria-hidden="true" size={14} strokeWidth={1.9} />
                      </button>
                    </>
                  )}
                </div> : null}
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
            <span><strong>{preferredRequirements.length}</strong> preferensi</span>
            <span><strong>{excludedRequirementCount}</strong> di luar skor MVP</span>
          </div>
          <div>
            <button className="secondary" type="button" onClick={openSelectionMode}>
              <Combine aria-hidden="true" size={15} strokeWidth={1.9} />
              Pilih & gabungkan
            </button>
            <button type="button" onClick={openAddEditor}>
              <Plus aria-hidden="true" size={15} strokeWidth={2} />
              Tambah requirement
            </button>
          </div>
        </div>
      </div>

      {isSelectionMode ? (
        <div className="requirement-selection-toolbar" role="status">
          <div>
            <strong>{selectedRequirementIds.length} dipilih</strong>
            <span>Pilih requirement dengan tipe dan prioritas yang sama.</span>
          </div>
          {selectionError ? <p role="alert">{selectionError}</p> : null}
          <div>
            <button type="button" onClick={closeSelectionMode}>Batal</button>
            <button
              className="primary"
              type="button"
              disabled={selectedRequirementIds.length < 2}
              onClick={mergeSelectedRequirements}
            >
              <Combine aria-hidden="true" size={14} strokeWidth={1.9} />
              Gabungkan {selectedRequirementIds.length || ""}
            </button>
          </div>
        </div>
      ) : null}

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
              <option>Preferensi</option>
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
        "Preferensi",
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
