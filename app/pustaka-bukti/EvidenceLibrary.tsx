"use client";

import {
  Award,
  BriefcaseBusiness,
  Check,
  ExternalLink,
  FolderKanban,
  GitBranch,
  Globe2,
  LibraryBig,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

export type EvidenceType =
  | "Proyek"
  | "Pengalaman"
  | "Sertifikat"
  | "GitHub"
  | "Portofolio";

export type EvidenceItem = {
  id: string;
  title: string;
  type: EvidenceType;
  description: string;
  source: string | null;
  skills: string[];
  updatedAt: string;
};

type EvidenceLibraryProps = {
  initialEvidences: EvidenceItem[];
  availableSkills: string[];
};

type EditorState =
  | { mode: "add" }
  | { mode: "edit"; evidenceId: string }
  | null;

const evidenceTypeIcons = {
  Proyek: FolderKanban,
  Pengalaman: BriefcaseBusiness,
  Sertifikat: Award,
  GitHub: GitBranch,
  Portofolio: Globe2,
} as const;

const evidenceTypes = Object.keys(evidenceTypeIcons) as EvidenceType[];

export function EvidenceLibrary({
  initialEvidences,
  availableSkills,
}: EvidenceLibraryProps) {
  const [evidences, setEvidences] = useState(initialEvidences);
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftType, setDraftType] = useState<EvidenceType>("Proyek");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftSource, setDraftSource] = useState("");
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const titleId = useId();
  const typeId = useId();
  const descriptionId = useId();
  const sourceId = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  const linkedSkillCount = new Set(
    evidences.flatMap((evidence) => evidence.skills),
  ).size;
  const typeSummary = evidenceTypes.map((type) => ({
    type,
    count: evidences.filter((evidence) => evidence.type === type).length,
  }));
  const skillOptions = Array.from(
    new Set([
      ...availableSkills,
      ...evidences.flatMap((evidence) => evidence.skills),
    ]),
  );

  useEffect(() => {
    if (!editor) return;

    const focusFrame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [editor]);

  function openForm() {
    setDraftTitle("");
    setDraftType("Proyek");
    setDraftDescription("");
    setDraftSource("");
    setDraftSkills([]);
    setPendingDeleteId(null);
    setError("");
    setAnnouncement("");
    setEditor({ mode: "add" });
  }

  function openEditForm(evidence: EvidenceItem) {
    setDraftTitle(evidence.title);
    setDraftType(evidence.type);
    setDraftDescription(evidence.description);
    setDraftSource(evidence.source ?? "");
    setDraftSkills(evidence.skills);
    setPendingDeleteId(null);
    setError("");
    setAnnouncement("");
    setEditor({ mode: "edit", evidenceId: evidence.id });
  }

  function closeForm() {
    setEditor(null);
    setError("");
  }

  function toggleDraftSkill(skill: string) {
    setDraftSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draftTitle.trim();
    const description = draftDescription.trim();
    const source = draftSource.trim();

    if (!title || !description) {
      setError("Judul dan deskripsi bukti perlu diisi.");
      return;
    }

    if (editor?.mode === "edit") {
      setEvidences((current) =>
        current.map((evidence) =>
          evidence.id === editor.evidenceId
            ? {
                ...evidence,
                title,
                type: draftType,
                description,
                source: source || null,
                skills: draftSkills,
                updatedAt: "Baru diperbarui",
              }
            : evidence,
        ),
      );
      setAnnouncement(`${title} berhasil diperbarui.`);
    } else {
      setEvidences((current) => [
        {
          id: `evidence-${Date.now()}`,
          title,
          type: draftType,
          description,
          source: source || null,
          skills: draftSkills,
          updatedAt: "Baru ditambahkan",
        },
        ...current,
      ]);
      setAnnouncement(`${title} berhasil ditambahkan ke data contoh.`);
    }

    setError("");
    setEditor(null);
  }

  function deleteEvidence(evidence: EvidenceItem) {
    setEvidences((current) => current.filter((item) => item.id !== evidence.id));
    setPendingDeleteId(null);
    if (editor?.mode === "edit" && editor.evidenceId === evidence.id) setEditor(null);
    setAnnouncement(`${evidence.title} dihapus dari data contoh.`);
  }

  return (
    <>
      <section className="evidence-overview" aria-labelledby="evidence-overview-title">
        <div className="evidence-overview-copy">
          <span className="evidence-overview-icon" aria-hidden="true">
            <LibraryBig size={23} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">Fondasi berbasis bukti</p>
            <h2 id="evidence-overview-title">
              {evidences.length} bukti mendukung {linkedSkillCount} skill
            </h2>
            <p>
              Satu bukti dapat terhubung ke beberapa skill. Hubungan inilah yang
              membantu ApplyFit menjelaskan status requirement secara transparan.
            </p>
          </div>
        </div>

        <div className="evidence-type-summary" aria-label="Ringkasan jenis bukti">
          {typeSummary.map((item) => (
            <span key={item.type}>
              <strong>{item.count}</strong>
              <small>{item.type}</small>
            </span>
          ))}
        </div>
      </section>

      <section className="evidence-list-section" aria-labelledby="evidence-list-title">
        <div className="evidence-section-heading">
          <div>
            <p className="eyebrow">Semua bukti</p>
            <h2 id="evidence-list-title">Koleksi bukti profilmu</h2>
          </div>
          <div className="evidence-heading-actions">
            <p>
              Setiap item menampilkan konteks, skill yang didukung, dan sumber yang
              dapat diperiksa bila tersedia.
            </p>
            <button className="evidence-add-button" type="button" onClick={openForm}>
              <Plus aria-hidden="true" size={16} strokeWidth={2} />
              Tambah bukti
            </button>
          </div>
        </div>

        {editor ? (
          <form className="evidence-editor" onSubmit={handleSubmit}>
            <div className="evidence-editor-heading">
              <strong>{editor.mode === "add" ? "Tambah bukti baru" : "Edit bukti"}</strong>
              <span>
                {editor.mode === "add"
                  ? "Tambahkan konteks dan hubungkan skill yang benar-benar didukung bukti ini."
                  : "Perbarui konteks atau sesuaikan skill yang didukung bukti ini."}
              </span>
            </div>
            <label htmlFor={titleId}>
              <span>Judul bukti</span>
              <input
                id={titleId}
                ref={titleRef}
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                placeholder="Contoh: Landing page event"
              />
            </label>
            <label htmlFor={typeId}>
              <span>Jenis</span>
              <select
                id={typeId}
                value={draftType}
                onChange={(event) => setDraftType(event.target.value as EvidenceType)}
              >
                {evidenceTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="evidence-description-field" htmlFor={descriptionId}>
              <span>Deskripsi</span>
              <textarea
                id={descriptionId}
                value={draftDescription}
                onChange={(event) => setDraftDescription(event.target.value)}
                placeholder="Jelaskan hasil kerja dan kontribusimu"
                rows={3}
              />
            </label>
            <label className="evidence-source-field" htmlFor={sourceId}>
              <span>Tautan sumber <small>Opsional</small></span>
              <input
                id={sourceId}
                value={draftSource}
                onChange={(event) => setDraftSource(event.target.value)}
                placeholder="github.com/username/project"
                inputMode="url"
              />
            </label>
            <fieldset className="evidence-skill-picker">
              <legend>Skill yang didukung</legend>
              <div className="evidence-skill-picker-heading">
                <span>Pilih satu atau beberapa skill dari profil kariermu.</span>
                <strong>{draftSkills.length} dipilih</strong>
              </div>
              <div className="evidence-skill-options">
                {skillOptions.map((skill) => {
                  const isSelected = draftSkills.includes(skill);

                  return (
                    <label className={isSelected ? "selected" : undefined} key={skill}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDraftSkill(skill)}
                      />
                      <span aria-hidden="true">
                        {isSelected ? <Check size={12} strokeWidth={2.3} /> : null}
                      </span>
                      {skill}
                    </label>
                  );
                })}
              </div>
              <small>
                Bukti boleh disimpan tanpa skill dan dihubungkan kembali nanti.
              </small>
            </fieldset>
            <div className="evidence-editor-actions">
              {error ? <p role="alert">{error}</p> : <span />}
              <div>
                <button className="career-button secondary" type="button" onClick={closeForm}>
                  <X aria-hidden="true" size={16} strokeWidth={1.9} />
                  Batal
                </button>
                <button className="career-button primary" type="submit">
                  <Check aria-hidden="true" size={16} strokeWidth={2} />
                  Simpan bukti
                </button>
              </div>
            </div>
          </form>
        ) : null}

        <div className="evidence-list">
          {evidences.map((evidence) => {
            const TypeIcon = evidenceTypeIcons[evidence.type];
            const isPendingDelete = pendingDeleteId === evidence.id;

            return (
              <article className="evidence-row" key={evidence.id}>
                <span className="evidence-type-icon" aria-hidden="true">
                  <TypeIcon size={19} strokeWidth={1.8} />
                </span>

                <div className="evidence-row-copy">
                  <span className="evidence-type-label">{evidence.type}</span>
                  <h3>{evidence.title}</h3>
                  <p>{evidence.description}</p>
                </div>

                <div className="evidence-skill-links" aria-label={`Skill untuk ${evidence.title}`}>
                  <span>
                    <Link2 aria-hidden="true" size={14} strokeWidth={1.8} />
                    Skill terkait
                  </span>
                  <div>
                    {evidence.skills.length ? evidence.skills.map((skill) => (
                      <span key={skill}>{skill}</span>
                    )) : <small>Belum dihubungkan</small>}
                  </div>
                </div>

                <div className="evidence-source">
                  {evidence.source ? (
                    <span>
                      <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
                      {evidence.source}
                    </span>
                  ) : (
                    <span>Catatan internal</span>
                  )}
                  <small>{evidence.updatedAt}</small>
                </div>

                <div className="evidence-row-actions">
                  {isPendingDelete ? (
                    <div
                      className="evidence-delete-confirmation"
                      role="group"
                      aria-label={`Hapus ${evidence.title}`}
                    >
                      <span>Hapus bukti?</span>
                      <button type="button" onClick={() => setPendingDeleteId(null)}>
                        Batal
                      </button>
                      <button
                        className="danger"
                        type="button"
                        onClick={() => deleteEvidence(evidence)}
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit ${evidence.title}`}
                        onClick={() => openEditForm(evidence)}
                      >
                        <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus ${evidence.title}`}
                        onClick={() => {
                          setPendingDeleteId(evidence.id);
                          setEditor(null);
                        }}
                      >
                        <Trash2 aria-hidden="true" size={15} strokeWidth={1.9} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </>
  );
}
