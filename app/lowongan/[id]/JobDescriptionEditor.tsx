"use client";

import { StableLink as Link } from "../../components/StableLink";
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
  reviewHref?: string;
  jobId: string;
  allowEditing?: boolean;
  onUpdated?: (description: string) => void;
};

type PreviewRequirement = {
  id: string;
  priority: "Wajib" | "Preferensi";
  category: "Skill" | "Tool" | "Pendidikan" | "Pengalaman";
  text: string;
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
  reviewHref,
  jobId,
  allowEditing = true,
  onUpdated,
}: JobDescriptionEditorProps) {
  const [description, setDescription] = useState(initialDescription);
  const [draftDescription, setDraftDescription] = useState(initialDescription);
  const [isEditing, setIsEditing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [extractedRequirements, setExtractedRequirements] = useState<PreviewRequirement[]>([]);
  const [extractionError, setExtractionError] = useState("");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isSaving, setIsSaving] = useState(false);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDescription = draftDescription.trim();
    if (!normalizedDescription) {
      setError("Deskripsi lowongan perlu diisi.");
      return;
    }

    setIsSaving(true);
    try {
      if (jobId) {
        const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawDescription: normalizedDescription }),
        });
        const result = await readJobUpdateResponse(response);
        if (!response.ok || !result.data?.job) {
          throw new Error(result.error?.message ?? "Deskripsi lowongan belum dapat disimpan.");
        }
      }

      setDescription(normalizedDescription);
      setDraftDescription(normalizedDescription);
      setError("");
      setIsEditing(false);
      setHasExtracted(false);
      setAnnouncement("Deskripsi lowongan berhasil diperbarui.");
      onUpdated?.(normalizedDescription);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Deskripsi lowongan belum dapat disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function extractRequirements() {
    setIsExtracting(true);
    setExtractionError("");
    setAnnouncement("Deskripsi sedang diproses menjadi draft requirement.");
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/extract-requirements`, { method: "POST" });
      const result = await readExtractionResponse(response);
      if (!response.ok || !result.data?.requirements) throw new Error(result.error?.message ?? "Requirement belum dapat diekstrak. Coba lagi.");
      const requirements = result.data.requirements.map((requirement, index) => ({
        id: `${requirement.type}-${requirement.priority}-${index}`,
        priority: requirement.priority === "required" ? "Wajib" as const : "Preferensi" as const,
        category: requirementCategoryLabels[requirement.type],
        text: requirement.name,
      }));
      setExtractedRequirements(requirements);
      window.sessionStorage.setItem(`applyfit:extracted-requirements:${jobId}`, JSON.stringify(result.data.requirements));
      setHasExtracted(true);
      setAnnouncement(`${requirements.length} requirement berhasil diekstrak.`);
    } catch (requestError) {
      setHasExtracted(false);
      setExtractionError(requestError instanceof Error ? requestError.message : "Requirement belum dapat diekstrak. Coba lagi.");
    } finally {
      setIsExtracting(false);
    }
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

        {!isEditing && allowEditing ? (
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
              <button className="career-button secondary" type="button" onClick={closeEditor} disabled={isSaving}>
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                Batal
              </button>
              <button className="career-button primary" type="submit" disabled={isSaving}>
                <Check aria-hidden="true" size={16} strokeWidth={2} />
                {isSaving ? "Menyimpan…" : "Simpan deskripsi"}
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
                Ekstraksi membuat draft requirement yang tetap perlu kamu periksa sebelum dipakai dalam analisis.
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

      {extractionError && !isEditing ? (
        <p className="job-extraction-error" role="alert">{extractionError}</p>
      ) : null}

      {hasExtracted && !isEditing ? (
        <section className="job-requirement-preview" aria-labelledby="requirement-preview-title">
          <div className="job-requirement-preview-heading">
            <div>
              <p className="eyebrow">
                Hasil ekstraksi
              </p>
              <h3 id="requirement-preview-title">
                {extractedRequirements.length} requirement ditemukan
              </h3>
            </div>
            <div className="job-requirement-preview-actions">
              <div aria-label="Ringkasan prioritas requirement">
                <span>
                  <strong>{extractedRequirements.filter((item) => item.priority === "Wajib").length}</strong>
                  wajib
                </span>
                <span>
                  <strong>{extractedRequirements.filter((item) => item.priority === "Preferensi").length}</strong>
                  preferensi
                </span>
              </div>
              {reviewHref ? (
                <Link href={reviewHref}>Buka Persyaratan <span aria-hidden="true">→</span></Link>
              ) : null}
            </div>
          </div>

          <div className="job-requirement-preview-list">
            {extractedRequirements.map((requirement) => (
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

type ExtractionResponse = {
  data?: {
    requirements?: Array<{
      name: string;
      type: keyof typeof requirementCategoryLabels;
      priority: "required" | "preferred";
    }>;
  };
  error?: { message?: string };
};

const requirementCategoryLabels = {
  skill: "Skill",
  tool: "Tool",
  education: "Pendidikan",
  experience: "Pengalaman",
} as const;

async function readExtractionResponse(response: Response): Promise<ExtractionResponse> {
  try {
    return await response.json() as ExtractionResponse;
  } catch {
    return {};
  }
}

type JobUpdateResponse = {
  data?: { job?: { id: string } };
  error?: { message?: string };
};

async function readJobUpdateResponse(response: Response): Promise<JobUpdateResponse> {
  try { return await response.json() as JobUpdateResponse; } catch { return {}; }
}
