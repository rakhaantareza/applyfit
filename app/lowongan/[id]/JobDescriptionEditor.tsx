"use client";

import { Check, FileText, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

type JobDescriptionEditorProps = {
  initialDescription: string;
};

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
}: JobDescriptionEditorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [draftDescription, setDraftDescription] = useState(initialDescription);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wordCount = draftDescription.trim()
    ? draftDescription.trim().split(/\s+/).length
    : 0;

  useEffect(() => {
    if (!isEditing) return;

    const focusFrame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isEditing]);

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
    setAnnouncement("Deskripsi lowongan contoh berhasil diperbarui.");
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

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </article>
  );
}
