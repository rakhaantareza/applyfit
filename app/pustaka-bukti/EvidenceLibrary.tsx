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
  Plus,
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
};

const evidenceTypeIcons = {
  Proyek: FolderKanban,
  Pengalaman: BriefcaseBusiness,
  Sertifikat: Award,
  GitHub: GitBranch,
  Portofolio: Globe2,
} as const;

const evidenceTypes = Object.keys(evidenceTypeIcons) as EvidenceType[];

export function EvidenceLibrary({ initialEvidences }: EvidenceLibraryProps) {
  const [evidences, setEvidences] = useState(initialEvidences);
  const [isAdding, setIsAdding] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftType, setDraftType] = useState<EvidenceType>("Proyek");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftSource, setDraftSource] = useState("");
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

  useEffect(() => {
    if (!isAdding) return;

    const focusFrame = window.requestAnimationFrame(() => titleRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isAdding]);

  function openForm() {
    setDraftTitle("");
    setDraftType("Proyek");
    setDraftDescription("");
    setDraftSource("");
    setError("");
    setAnnouncement("");
    setIsAdding(true);
  }

  function closeForm() {
    setIsAdding(false);
    setError("");
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

    setEvidences((current) => [
      {
        id: `evidence-${Date.now()}`,
        title,
        type: draftType,
        description,
        source: source || null,
        skills: [],
        updatedAt: "Baru ditambahkan",
      },
      ...current,
    ]);
    setAnnouncement(`${title} berhasil ditambahkan ke data contoh.`);
    setError("");
    setIsAdding(false);
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

        {isAdding ? (
          <form className="evidence-editor" onSubmit={handleSubmit}>
            <div className="evidence-editor-heading">
              <strong>Tambah bukti baru</strong>
              <span>Skill dapat dihubungkan setelah bukti tersimpan.</span>
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
              </article>
            );
          })}
        </div>
      </section>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </>
  );
}
