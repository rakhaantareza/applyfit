"use client";

import Link from "next/link";
import {
  Check,
  FileSearch,
  FileText,
  LoaderCircle,
  Pencil,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

type JobDescriptionEditorProps = {
  initialDescription: string;
  reviewHref: string;
};

const mockRequirements = [
  {
    id: "react-typescript",
    priority: "Wajib",
    category: "Skill",
    text: "Mampu membangun fitur web menggunakan React dan TypeScript.",
  },
  {
    id: "html-css",
    priority: "Wajib",
    category: "Skill",
    text: "Memahami JavaScript modern, HTML, dan CSS.",
  },
  {
    id: "git-collaboration",
    priority: "Wajib",
    category: "Skill",
    text: "Terbiasa menggunakan Git dan berpartisipasi dalam code review.",
  },
  {
    id: "communication",
    priority: "Wajib",
    category: "Skill",
    text: "Mampu berkomunikasi dan memecahkan masalah secara terstruktur.",
  },
  {
    id: "nextjs",
    priority: "Preferensi",
    category: "Skill",
    text: "Memiliki pengalaman menggunakan Next.js.",
  },
  {
    id: "automated-testing",
    priority: "Preferensi",
    category: "Skill",
    text: "Memahami automated testing untuk aplikasi web.",
  },
] as const;

function renderDescription(description: string) {
  return description.split(/\n\s*\n/).map((block, index) => {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) return null;

    if (trimmedBlock.startsWith("## ")) {
      return <h3 key={`${trimmedBlock}-${index}`}>{trimmedBlock.slice(3)}</h3>;
    }

    const lines = trimmedBlock.split("\n").map((line) => line.trim());
    if (lines.every((line) => line.startsWith("- "))) {
      return (
        <ul key={`list-${index}`}>
          {lines.map((line) => <li key={line}>{line.slice(2)}</li>)}
        </ul>
      );
    }

    return <p key={`paragraph-${index}`}>{trimmedBlock}</p>;
  }) as ReactNode;
}

export function JobDescriptionEditor({
  initialDescription,
  reviewHref,
}: JobDescriptionEditorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [draftDescription, setDraftDescription] = useState(initialDescription);
  const [isEditing, setIsEditing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const extractionTimeoutRef = useRef<number | null>(null);
  const wordCount = draftDescription.trim()
    ? draftDescription.trim().split(/\s+/).length
    : 0;

  useEffect(() => {
    if (!isEditing) return;

    const focusFrame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (extractionTimeoutRef.current !== null) {
        window.clearTimeout(extractionTimeoutRef.current);
      }
    };
  }, []);

  function openEditor() {
    setDraftDescription(description);
    setError("");
    setAnnouncement("");
    setIsEditing(true);
  }

  function closeEditor() {
    setDraftDescription(description);
    setError("");
    setIsEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDescription = draftDescription.trim();
    if (!normalizedDescription) {
      setError("Deskripsi lowongan perlu diisi.");
      return;
    }

    setDescription(normalizedDescription);
    setDraftDescription(normalizedDescription);
    setError("");
    setIsEditing(false);
    setHasExtracted(false);
    setAnnouncement("Deskripsi lowongan contoh berhasil diperbarui.");
  }

  function extractRequirements() {
    if (extractionTimeoutRef.current !== null) {
      window.clearTimeout(extractionTimeoutRef.current);
    }

    setIsExtracting(true);
    setAnnouncement("Deskripsi sedang diproses menggunakan data contoh.");
    extractionTimeoutRef.current = window.setTimeout(() => {
      setIsExtracting(false);
      setHasExtracted(true);
      setAnnouncement(`${mockRequirements.length} requirement contoh berhasil diekstrak.`);
      extractionTimeoutRef.current = null;
    }, 650);
  }

  return (
    <article className="job-description-copy">
      <div className="job-description-heading-row">
        <div className="job-detail-section-heading">
          <span aria-hidden="true"><FileText size={18} strokeWidth={1.8} /></span>
          <div>
            <p className="eyebrow">Deskripsi asli</p>
            <h2>Tentang peran ini</h2>
          </div>
        </div>

        {!isEditing ? (
          <button className="job-description-edit-button" type="button" onClick={openEditor}>
            <Pencil aria-hidden="true" size={15} strokeWidth={1.9} />
            Edit deskripsi
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <form className="job-description-editor" onSubmit={handleSubmit}>
          <label htmlFor="job-description-draft">
            <span>Tempel atau edit deskripsi lowongan</span>
            <small>
              Pertahankan informasi dari sumber agar requirement dapat ditinjau dengan konteks lengkap.
            </small>
          </label>
          <textarea
            id="job-description-draft"
            ref={textareaRef}
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            rows={18}
          />
          <div className="job-description-editor-meta">
            {error ? <p role="alert">{error}</p> : <span>{wordCount} kata</span>}
            <div>
              <button className="career-button secondary" type="button" onClick={closeEditor}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </button>
              <button className="career-button primary" type="submit">
                <Check aria-hidden="true" size={16} strokeWidth={2} />
                Simpan deskripsi
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="job-description-rendered">{renderDescription(description)}</div>
      )}

      {!isEditing ? (
        <div className="job-extraction-panel">
          <div>
            <span className="job-extraction-icon" aria-hidden="true">
              <FileSearch size={18} strokeWidth={1.8} />
            </span>
            <div>
              <strong>Ubah deskripsi menjadi requirement terstruktur</strong>
              <p>
                Ekstraksi memakai respons tiruan. Hasilnya tetap perlu diperiksa dan
                diperbaiki pengguna sebelum dipakai dalam analisis.
              </p>
            </div>
          </div>
          <button type="button" disabled={isExtracting} onClick={extractRequirements}>
            {isExtracting ? (
              <LoaderCircle className="spin" aria-hidden="true" size={16} strokeWidth={1.9} />
            ) : (
              <Sparkles aria-hidden="true" size={16} strokeWidth={1.9} />
            )}
            {isExtracting
              ? "Mengekstrak..."
              : hasExtracted
                ? "Ekstrak ulang"
                : "Ekstrak requirement"}
          </button>
        </div>
      ) : null}

      {hasExtracted && !isEditing ? (
        <section className="job-requirement-preview" aria-labelledby="requirement-preview-title">
          <div className="job-requirement-preview-heading">
            <div>
              <p className="eyebrow">Hasil ekstraksi contoh</p>
              <h3 id="requirement-preview-title">
                {mockRequirements.length} requirement ditemukan
              </h3>
            </div>
            <div className="job-requirement-preview-actions">
              <div aria-label="Ringkasan prioritas requirement">
                <span><strong>4</strong> wajib</span>
                <span><strong>2</strong> preferensi</span>
              </div>
              <Link href={reviewHref}>Tinjau hasil <span aria-hidden="true">→</span></Link>
            </div>
          </div>

          <div className="job-requirement-preview-list">
            {mockRequirements.map((requirement) => (
              <article key={requirement.id}>
                <span className={`requirement-priority ${
                  requirement.priority === "Wajib" ? "required" : "preferred"
                }`}>
                  {requirement.priority}
                </span>
                <p>{requirement.text}</p>
                <small>{requirement.category}</small>
              </article>
            ))}
          </div>

          <p className="job-requirement-preview-note">
            Belum ada status Proven, Partial, Learning, atau Missing pada tahap ini.
            Status baru diturunkan setelah requirement dipetakan ke skill dan bukti.
          </p>
        </section>
      ) : null}

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </article>
  );
}
