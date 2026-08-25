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
  ListFilter,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  SearchX,
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

export type BackendEvidenceType =
  | "project"
  | "cert"
  | "work"
  | "internship"
  | "github"
  | "portfolio";

export type ProfileSkill = {
  id: string;
  name: string;
};

export type EvidenceItem = {
  id: string;
  title: string;
  type: EvidenceType;
  backendType: BackendEvidenceType;
  description: string;
  source: string | null;
  skills: ProfileSkill[];
  updatedAt: string;
};

type EvidenceLibraryProps = {
  initialEvidences: EvidenceItem[];
  availableSkills: ProfileSkill[];
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
  const [draftSkillIds, setDraftSkillIds] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"Semua" | EvidenceType>("Semua");
  const [skillFilter, setSkillFilter] = useState("Semua");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);
  const titleId = useId();
  const typeId = useId();
  const descriptionId = useId();
  const sourceId = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  const linkedSkillCount = new Set(
    evidences.flatMap((evidence) => evidence.skills.map((skill) => skill.id)),
  ).size;
  const typeSummary = evidenceTypes.map((type) => ({
    type,
    count: evidences.filter((evidence) => evidence.type === type).length,
  }));
  const skillOptions = Array.from(
    new Map([
      ...availableSkills,
      ...evidences.flatMap((evidence) => evidence.skills),
    ].map((skill) => [skill.id, skill])).values(),
  ).sort((first, second) => first.name.localeCompare(second.name, "id-ID"));
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
  const filteredEvidences = evidences.filter((evidence) => {
    const matchesSearch = !normalizedSearchQuery || [
      evidence.title,
      evidence.description,
      evidence.source ?? "",
      evidence.type,
      ...evidence.skills.map((skill) => skill.name),
    ].some((value) =>
      value.toLocaleLowerCase("id-ID").includes(normalizedSearchQuery),
    );
    const matchesType = typeFilter === "Semua" || evidence.type === typeFilter;
    const matchesSkill =
      skillFilter === "Semua" || evidence.skills.some((skill) => skill.id === skillFilter);

    return matchesSearch && matchesType && matchesSkill;
  });
  const hasActiveFilters = Boolean(
    normalizedSearchQuery || typeFilter !== "Semua" || skillFilter !== "Semua",
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
    setDraftSkillIds([]);
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
    setDraftSkillIds(evidence.skills.map((skill) => skill.id));
    setPendingDeleteId(null);
    setError("");
    setAnnouncement("");
    setEditor({ mode: "edit", evidenceId: evidence.id });
  }

  function closeForm() {
    setEditor(null);
    setError("");
  }

  function toggleDraftSkill(skillId: string) {
    setDraftSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((item) => item !== skillId)
        : [...current, skillId],
    );
  }

  function clearFilters() {
    setSearchQuery("");
    setTypeFilter("Semua");
    setSkillFilter("Semua");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draftTitle.trim();
    const description = draftDescription.trim();
    const source = draftSource.trim();

    if (!title || !description) {
      setError("Judul dan deskripsi bukti perlu diisi.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const existingEvidence = editor?.mode === "edit"
        ? evidences.find((evidence) => evidence.id === editor.evidenceId) ?? null
        : null;
      const backendType = toBackendType(draftType, existingEvidence?.backendType);
      const endpoint = existingEvidence
        ? `/api/evidences/${encodeURIComponent(existingEvidence.id)}`
        : "/api/evidences";
      const response = await fetch(endpoint, {
        method: existingEvidence ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          type: backendType,
          description,
          url: source || null,
        }),
      });
      const result = await readEvidenceResponse(response);
      if (!response.ok || !result.data?.evidence) {
        throw new Error(result.error?.message ?? "Bukti belum dapat disimpan.");
      }

      const saved = result.data.evidence;
      await syncEvidenceSkills(
        saved.id,
        existingEvidence?.skills.map((skill) => skill.id) ?? [],
        draftSkillIds,
      );
      const savedSkills = skillOptions.filter((skill) => draftSkillIds.includes(skill.id));
      const savedItem: EvidenceItem = {
        id: saved.id,
        title: saved.title,
        type: typeLabels[saved.type],
        backendType: saved.type,
        description: saved.description,
        source: saved.url,
        skills: savedSkills,
        updatedAt: formatUpdatedAt(saved.updatedAt),
      };

      if (existingEvidence) {
        setEvidences((current) => current.map((evidence) =>
          evidence.id === savedItem.id ? savedItem : evidence));
        setAnnouncement(`${savedItem.title} berhasil diperbarui.`);
      } else {
        setEvidences((current) => [savedItem, ...current]);
        setAnnouncement(`${savedItem.title} berhasil ditambahkan.`);
      }
      setEditor(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Bukti belum dapat disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteEvidence(evidence: EvidenceItem) {
    setDeletingEvidenceId(evidence.id);
    setError("");
    try {
      const response = await fetch(`/api/evidences/${encodeURIComponent(evidence.id)}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const result = await readEvidenceResponse(response);
        throw new Error(result.error?.message ?? "Bukti belum dapat dihapus.");
      }
      setEvidences((current) => current.filter((item) => item.id !== evidence.id));
      setPendingDeleteId(null);
      if (editor?.mode === "edit" && editor.evidenceId === evidence.id) setEditor(null);
      setAnnouncement(`${evidence.title} berhasil dihapus.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Bukti belum dapat dihapus.",
      );
    } finally {
      setDeletingEvidenceId(null);
    }
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
        <div className="evidence-section-heading responsive-card-heading">
          <div>
            <p className="eyebrow">Semua bukti</p>
            <h2 id="evidence-list-title">Koleksi bukti profilmu</h2>
          </div>
          <div className="evidence-heading-actions responsive-card-heading-actions">
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
                <strong>{draftSkillIds.length} dipilih</strong>
              </div>
              <div className="evidence-skill-options">
                {skillOptions.map((skill) => {
                  const isSelected = draftSkillIds.includes(skill.id);

                  return (
                    <label className={isSelected ? "selected" : undefined} key={skill.id}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDraftSkill(skill.id)}
                      />
                      <span aria-hidden="true">
                        {isSelected ? <Check size={12} strokeWidth={2.3} /> : null}
                      </span>
                      {skill.name}
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
                <button className="career-button secondary" type="button" onClick={closeForm} disabled={isSaving}>
                  <X aria-hidden="true" size={16} strokeWidth={1.9} />
                  Batal
                </button>
                <button className="career-button primary" type="submit" disabled={isSaving}>
                  {isSaving ? <LoaderCircle className="spin" aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} strokeWidth={2} />}
                  {isSaving ? "Menyimpan…" : "Simpan bukti"}
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {!editor && error ? <p className="evidence-manager-error" role="alert">{error}</p> : null}

        <div className="evidence-filter-panel" aria-label="Cari dan filter bukti">
          <label className="evidence-search-field">
            <span className="sr-only">Cari bukti</span>
            <Search aria-hidden="true" size={16} strokeWidth={1.8} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari judul, skill, atau sumber"
            />
          </label>

          <label className="evidence-filter-field">
            <ListFilter aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>Jenis</span>
            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "Semua" | EvidenceType)
              }
            >
              <option>Semua</option>
              {evidenceTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="evidence-filter-field">
            <Link2 aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>Skill</span>
            <select
              value={skillFilter}
              onChange={(event) => setSkillFilter(event.target.value)}
            >
              <option>Semua</option>
              {skillOptions.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
            </select>
          </label>

          <div className="evidence-filter-meta" aria-live="polite">
            <span>
              Menampilkan <strong>{filteredEvidences.length}</strong> dari {evidences.length} bukti
            </span>
            {hasActiveFilters ? (
              <button type="button" onClick={clearFilters}>Reset filter</button>
            ) : null}
          </div>
        </div>

        <div className="evidence-library-list">
          {filteredEvidences.map((evidence) => {
            const TypeIcon = evidenceTypeIcons[evidence.type];
            const isPendingDelete = pendingDeleteId === evidence.id;

            return (
              <article className="evidence-row responsive-list-row" key={evidence.id}>
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
                      <span key={skill.id}>{skill.name}</span>
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
                        disabled={deletingEvidenceId === evidence.id}
                        onClick={() => deleteEvidence(evidence)}
                      >
                        {deletingEvidenceId === evidence.id ? "Menghapus…" : "Hapus"}
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
          {!filteredEvidences.length ? (
            <div className="evidence-empty-state">
              <SearchX aria-hidden="true" size={22} strokeWidth={1.7} />
              <div>
                <strong>
                  {hasActiveFilters
                    ? "Tidak ada bukti yang cocok"
                    : "Portfolio & Pengalaman masih kosong"}
                </strong>
                <p>
                  {hasActiveFilters
                    ? "Coba ubah kata pencarian atau longgarkan filter yang dipilih."
                    : "Tambahkan hasil kerja atau pengalaman yang mendukung skill profilmu."}
                </p>
              </div>
              <button
                type="button"
                onClick={hasActiveFilters ? clearFilters : openForm}
              >
                {hasActiveFilters ? "Tampilkan semua bukti" : "Tambah bukti"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </>
  );
}

type ApiEvidence = {
  id: string;
  title: string;
  type: BackendEvidenceType;
  url: string | null;
  description: string;
  updatedAt: string;
};

type EvidenceResponse = {
  data?: { evidence?: ApiEvidence };
  error?: { message?: string };
};

const typeLabels: Record<BackendEvidenceType, EvidenceType> = {
  project: "Proyek",
  cert: "Sertifikat",
  work: "Pengalaman",
  internship: "Pengalaman",
  github: "GitHub",
  portfolio: "Portofolio",
};

function toBackendType(
  type: EvidenceType,
  currentType?: BackendEvidenceType,
): BackendEvidenceType {
  if (type === "Pengalaman" && (currentType === "work" || currentType === "internship")) {
    return currentType;
  }
  return {
    Proyek: "project",
    Pengalaman: "work",
    Sertifikat: "cert",
    GitHub: "github",
    Portofolio: "portfolio",
  }[type] as BackendEvidenceType;
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru diperbarui";
  return `Diperbarui ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

async function syncEvidenceSkills(
  evidenceId: string,
  currentSkillIds: string[],
  nextSkillIds: string[],
) {
  const current = new Set(currentSkillIds);
  const next = new Set(nextSkillIds);
  const removals = currentSkillIds.filter((skillId) => !next.has(skillId));
  const additions = nextSkillIds.filter((skillId) => !current.has(skillId));

  const responses = await Promise.all([
    ...additions.map((skillId) => fetch(
      `/api/evidences/${encodeURIComponent(evidenceId)}/skills`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ skillId }),
      },
    )),
    ...removals.map((skillId) => fetch(
      `/api/evidences/${encodeURIComponent(evidenceId)}/skills/${encodeURIComponent(skillId)}`,
      { method: "DELETE" },
    )),
  ]);

  const failedResponse = responses.find((response) => !response.ok && response.status !== 204);
  if (failedResponse) {
    const result = await readEvidenceResponse(failedResponse);
    throw new Error(result.error?.message ?? "Hubungan bukti dan skill belum dapat disimpan.");
  }
}

async function readEvidenceResponse(response: Response): Promise<EvidenceResponse> {
  try {
    return await response.json() as EvidenceResponse;
  } catch {
    return {};
  }
}
