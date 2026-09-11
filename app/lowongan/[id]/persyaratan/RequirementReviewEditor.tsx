"use client";
import { useI18n } from "../../../components/LanguageProvider";

import {
  Check,
  CircleAlert,
  Combine,
  GraduationCap,
  ListChecks,
  LoaderCircle,
  Pencil,
  Plus,
  Scissors,
  Save,
  Sparkles,
  Trash2,
  UserRoundCheck,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ActionButton, IconButton } from "../../../components/ActionControl";

export type RequirementPriority = "Wajib" | "Preferensi";
export type RequirementType = "Skill" | "Tool" | "Pengalaman" | "Pendidikan";

export type Requirement = {
  id: string;
  persistedId?: string;
  priority: RequirementPriority;
  type: RequirementType;
  text: string;
  reviewed: boolean;
};

type EditorState =
  | { mode: "add" }
  | { mode: "edit"; requirementId: string }
  | null;

const requirementTypeIcons = {
  Skill: Wrench,
  Tool: Wrench,
  Pengalaman: UserRoundCheck,
  Pendidikan: GraduationCap,
} as const;

export function RequirementReviewEditor({
  jobId,
  initialRequirements,
}: {
  jobId: string;
  initialRequirements: Requirement[];
}) {
  const { t } = useI18n();
  const [requirements, setRequirements] = useState(initialRequirements);
  const [editor, setEditor] = useState<EditorState>(null);
  const [draftText, setDraftText] = useState("");
  const [draftPriority, setDraftPriority] =
    useState<RequirementPriority>("Wajib");
  const [draftType, setDraftType] = useState<RequirementType>("Skill");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<
    string[]
  >([]);
  const [selectionError, setSelectionError] = useState("");
  const [splitRequirementId, setSplitRequirementId] = useState<string | null>(
    null,
  );
  const [splitDrafts, setSplitDrafts] = useState<string[]>([]);
  const [splitError, setSplitError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const textId = useId();
  const priorityId = useId();
  const typeId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const requiredRequirements = requirements.filter(
    (item) => item.priority === "Wajib",
  );
  const preferredRequirements = requirements.filter(
    (item) => item.priority === "Preferensi",
  );
  const excludedRequirementCount = requirements.filter(
    (item) => item.type === "Pengalaman" || item.type === "Pendidikan",
  ).length;
  const selectedRequirements = requirements.filter((item) =>
    selectedRequirementIds.includes(item.id),
  );
  const splitRequirement = requirements.find(
    (item) => item.id === splitRequirementId,
  );
  const splitFieldBaseId = useId();

  useEffect(() => {
    if (!editor) return;

    const focusFrame = window.requestAnimationFrame(() =>
      textRef.current?.focus(),
    );
    return () => window.cancelAnimationFrame(focusFrame);
  }, [editor]);

  function markUnsaved() {
    setIsDirty(true);
    setHasSaved(false);
  }

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
    setSplitRequirementId(null);
    setSplitDrafts([]);
    setSplitError("");
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
    setSplitRequirementId(null);
    setSplitDrafts([]);
    setSplitError("");
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
      setAnnouncement("Requirement berhasil diperbarui.");
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
      setAnnouncement("Requirement baru berhasil ditambahkan.");
    }

    markUnsaved();
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
    if (splitRequirementId === requirement.id) {
      setSplitRequirementId(null);
      setSplitDrafts([]);
      setSplitError("");
    }
    markUnsaved();
    setAnnouncement("Requirement dihapus dari daftar review.");
  }

  function openSelectionMode() {
    setEditor(null);
    setPendingDeleteId(null);
    setSelectedRequirementIds([]);
    setSelectionError("");
    setAnnouncement("");
    setSplitRequirementId(null);
    setSplitDrafts([]);
    setSplitError("");
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
    markUnsaved();
    setSelectedRequirementIds([]);
    setSelectionError("");
    setIsSelectionMode(false);
    setAnnouncement(
      `${selectedRequirements.length} requirement berhasil digabungkan.`,
    );
  }

  function openSplitEditor(requirement: Requirement) {
    setEditor(null);
    setPendingDeleteId(null);
    setIsSelectionMode(false);
    setSelectedRequirementIds([]);
    setSelectionError("");
    setSplitRequirementId(requirement.id);
    setSplitDrafts([requirement.text, ""]);
    setSplitError("");
    setAnnouncement("");
  }

  function closeSplitEditor() {
    setSplitRequirementId(null);
    setSplitDrafts([]);
    setSplitError("");
  }

  function updateSplitDraft(index: number, value: string) {
    setSplitDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? value : draft,
      ),
    );
    setSplitError("");
  }

  function splitSelectedRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!splitRequirement) return;

    const parts = splitDrafts.map((draft) => draft.trim()).filter(Boolean);
    if (parts.length < 2) {
      setSplitError("Tulis minimal dua requirement hasil pemisahan.");
      return;
    }

    const uniqueParts = new Set(
      parts.map((part) => part.toLocaleLowerCase("id-ID")),
    );
    if (uniqueParts.size !== parts.length) {
      setSplitError("Setiap hasil pemisahan perlu berbeda.");
      return;
    }

    setRequirements((current) => {
      const sourceIndex = current.findIndex(
        (item) => item.id === splitRequirement.id,
      );
      if (sourceIndex < 0) return current;

      const splitItems: Requirement[] = parts.map((text, index) => ({
        id: `${splitRequirement.id}-split-${Date.now()}-${index}`,
        text,
        priority: splitRequirement.priority,
        type: splitRequirement.type,
        reviewed: true,
      }));

      return [
        ...current.slice(0, sourceIndex),
        ...splitItems,
        ...current.slice(sourceIndex + 1),
      ];
    });
    markUnsaved();
    setSplitRequirementId(null);
    setSplitDrafts([]);
    setSplitError("");
    setAnnouncement(`${parts.length} requirement spesifik berhasil dibuat.`);
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
    markUnsaved();
    setPendingDeleteId(null);
    if (editor?.mode === "edit" && editor.requirementId === requirement.id) {
      setEditor(null);
    }
    setAnnouncement(`Prioritas diubah menjadi ${priority}.`);
  }

  async function saveReview() {
    setIsSaving(true);
    setError("");
    setAnnouncement("Review requirement sedang disimpan.");
    try {
      const response = await fetch(
        `/api/jobs/${encodeURIComponent(jobId)}/requirements/review`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirements: requirements.map((requirement) => ({
              ...(requirement.persistedId
                ? { id: requirement.persistedId }
                : {}),
              name: requirement.text,
              type: toApiType(requirement.type),
              priority:
                requirement.priority === "Wajib" ? "required" : "preferred",
            })),
          }),
        },
      );
      const result = await readReviewResponse(response);
      if (!response.ok || !result.data?.requirements) {
        throw new Error(
          result.error?.message ?? "Review requirement belum dapat disimpan.",
        );
      }

      setRequirements(result.data.requirements.map(fromApiRequirement));
      setIsSaving(false);
      setIsDirty(false);
      setHasSaved(true);
      window.sessionStorage.removeItem(
        `applyfit:extracted-requirements:${jobId}`,
      );
      setAnnouncement("Review requirement berhasil disimpan.");
    } catch (requestError) {
      setIsSaving(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Review requirement belum dapat disimpan.",
      );
    }
  }

  function renderRequirementGroup(
    title: RequirementPriority,
    description: string,
    items: Requirement[],
  ) {
    return (
      <div
        className={`requirement-review-group${title === "Preferensi" ? " preferred" : ""}`}
      >
        <div className="requirement-review-group-heading">
          <span aria-hidden="true">
            <ListChecks size={16} strokeWidth={1.8} />
          </span>
          <div>
            <h3>{t(title)}</h3>
            <p>{t(description)}</p>
          </div>
        </div>
        <div className="requirement-review-list">
          {items.map((requirement, index) => {
            const TypeIcon = requirementTypeIcons[requirement.type];
            const isPendingDelete = pendingDeleteId === requirement.id;

            return (
              <article
                className={`${isSelectionMode ? "selection-mode" : ""}${
                  selectedRequirementIds.includes(requirement.id)
                    ? " selected"
                    : ""
                }`}
                key={requirement.id}
              >
                {isSelectionMode ? (
                  <label className="requirement-selection-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRequirementIds.includes(requirement.id)}
                      onChange={() =>
                        toggleRequirementSelection(requirement.id)
                      }
                    />
                    <span aria-hidden="true">
                      {selectedRequirementIds.includes(requirement.id) ? (
                        <Check size={12} strokeWidth={2.3} />
                      ) : null}
                    </span>
                    <span className="sr-only">
                      {t("Pilih requirement:")} {requirement.text}
                    </span>
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
                    aria-label={t(`Prioritas requirement: ${requirement.text}`)}
                  >
                    {([t("Wajib"), t("Preferensi")] as const).map(
                      (priority) => (
                        <button
                          className={
                            requirement.priority === priority
                              ? "active"
                              : undefined
                          }
                          type="button"
                          aria-pressed={requirement.priority === priority}
                          key={priority}
                          onClick={() =>
                            updateRequirementPriority(requirement, priority)
                          }
                        >
                          {priority}
                        </button>
                      ),
                    )}
                  </div>
                ) : null}
                <span
                  className={`requirement-review-state${requirement.reviewed ? " reviewed" : ""}`}
                >
                  {requirement.reviewed ? (
                    <UserRoundCheck
                      aria-hidden="true"
                      size={12}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Sparkles aria-hidden="true" size={12} strokeWidth={1.8} />
                  )}
                  {requirement.reviewed ? t("Diedit pengguna") : t("Hasil AI")}
                </span>
                {!isSelectionMode ? (
                  <div className="requirement-row-actions">
                    {isPendingDelete ? (
                      <div
                        className="requirement-delete-confirmation"
                        role="group"
                        aria-label={t(`Hapus requirement: ${requirement.text}`)}
                      >
                        <span>{t("Hapus requirement?")}</span>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          {t("Batal")}
                        </button>
                        <button
                          className="danger ui-record-action ui-record-action--delete"
                          type="button"
                          onClick={() => deleteRequirement(requirement)}
                        >
                          {t("Hapus")}
                        </button>
                      </div>
                    ) : (
                      <>
                        <IconButton
                          size="compact"
                          className="requirement-edit-button ui-record-action ui-record-action--edit"
                          type="button"
                          aria-label={t(
                            `Edit requirement: ${requirement.text}`,
                          )}
                          onClick={() => openEditEditor(requirement)}
                        >
                          <Pencil
                            aria-hidden="true"
                            size={14}
                            strokeWidth={1.9}
                          />
                        </IconButton>
                        <IconButton
                          size="compact"
                          className="requirement-split-button ui-record-action ui-record-action--edit"
                          type="button"
                          aria-label={t(
                            `Pisahkan requirement: ${requirement.text}`,
                          )}
                          onClick={() => openSplitEditor(requirement)}
                        >
                          <Scissors
                            aria-hidden="true"
                            size={14}
                            strokeWidth={1.9}
                          />
                        </IconButton>
                        <IconButton
                          size="compact"
                          tone="destructive"
                          className="requirement-delete-button ui-record-action ui-record-action--delete"
                          type="button"
                          aria-label={t(
                            `Hapus requirement: ${requirement.text}`,
                          )}
                          onClick={() => {
                            setPendingDeleteId(requirement.id);
                            setEditor(null);
                          }}
                        >
                          <Trash2
                            aria-hidden="true"
                            size={14}
                            strokeWidth={1.9}
                          />
                        </IconButton>
                      </>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section
      className="requirement-review-list-section"
      aria-labelledby="review-list-title"
    >
      <div className="requirement-review-section-heading">
        <div>
          <h2 id="review-list-title">{t("Hasil yang perlu diperiksa")}</h2>
        </div>
        <div className="requirement-review-heading-actions">
          <div
            className="requirement-review-counts"
            aria-label={t("Ringkasan hasil ekstraksi")}
          >
            <span>
              <strong>{requiredRequirements.length}</strong> {t("wajib")}
            </span>
            <span>
              <strong>{preferredRequirements.length}</strong> {t("preferensi")}
            </span>
            <span>
              <strong>{excludedRequirementCount}</strong>{" "}
              {t("di luar Fit Score")}
            </span>
          </div>
          <div>
            <ActionButton
              className="secondary"
              size="compact"
              variant="secondary"
              type="button"
              onClick={openSelectionMode}
            >
              <Combine aria-hidden="true" size={15} strokeWidth={1.9} />
              {t("Pilih & gabungkan")}
            </ActionButton>
            <ActionButton size="compact" type="button" onClick={openAddEditor}>
              <Plus aria-hidden="true" size={15} strokeWidth={2} />
              {t("Tambah persyaratan")}
            </ActionButton>
          </div>
        </div>
      </div>

      {isSelectionMode ? (
        <div className="requirement-selection-toolbar" role="status">
          <div>
            <strong>
              {selectedRequirementIds.length} {t("dipilih")}
            </strong>
            <span>
              {t("Pilih requirement dengan tipe dan prioritas yang sama.")}
            </span>
          </div>
          {selectionError ? <p role="alert">{selectionError}</p> : null}
          <div>
            <ActionButton
              size="compact"
              variant="secondary"
              type="button"
              onClick={closeSelectionMode}
            >
              {t("Batal")}
            </ActionButton>
            <ActionButton
              className="primary"
              size="compact"
              type="button"
              disabled={selectedRequirementIds.length < 2}
              onClick={mergeSelectedRequirements}
            >
              <Combine aria-hidden="true" size={14} strokeWidth={1.9} />
              {t("Gabungkan")} {selectedRequirementIds.length || ""}
            </ActionButton>
          </div>
        </div>
      ) : null}

      {splitRequirement ? (
        <form
          className="requirement-split-editor"
          onSubmit={splitSelectedRequirement}
        >
          <div className="requirement-split-heading">
            <span aria-hidden="true">
              <Scissors size={17} strokeWidth={1.9} />
            </span>
            <div>
              <strong>{t("Pisahkan menjadi requirement spesifik")}</strong>
              <p>
                {t("Tipe")} <b>{t(splitRequirement.type)}</b>{" "}
                {t("dan prioritas")} <b>{t(splitRequirement.priority)}</b>{" "}
                {t("akan dipertahankan untuk semua hasil.")}
              </p>
            </div>
          </div>

          <blockquote>{splitRequirement.text}</blockquote>

          <div className="requirement-split-fields">
            {splitDrafts.map((draft, index) => (
              <label
                htmlFor={`${splitFieldBaseId}-${index}`}
                key={`${splitFieldBaseId}-${index}`}
              >
                <span>Requirement {index + 1}</span>
                <div>
                  <input
                    id={`${splitFieldBaseId}-${index}`}
                    value={draft}
                    onChange={(event) =>
                      updateSplitDraft(index, event.target.value)
                    }
                  />
                  {splitDrafts.length > 2 ? (
                    <IconButton
                      size="compact"
                      tone="destructive"
                      className="ui-record-action ui-record-action--delete"
                      type="button"
                      aria-label={t(`Hapus kolom requirement ${index + 1}`)}
                      onClick={() =>
                        setSplitDrafts((current) =>
                          current.filter(
                            (_, draftIndex) => draftIndex !== index,
                          ),
                        )
                      }
                    >
                      <X aria-hidden="true" size={14} strokeWidth={1.9} />
                    </IconButton>
                  ) : null}
                </div>
              </label>
            ))}
          </div>

          <div className="requirement-split-actions">
            <ActionButton
              className="add-part"
              size="compact"
              variant="secondary"
              type="button"
              disabled={splitDrafts.length >= 4}
              onClick={() => setSplitDrafts((current) => [...current, ""])}
            >
              <Plus aria-hidden="true" size={14} strokeWidth={2} />
              {t("Tambah bagian")}
            </ActionButton>
            {splitError ? <p role="alert">{splitError}</p> : <span />}
            <div>
              <ActionButton
                className="career-button secondary"
                variant="secondary"
                type="button"
                onClick={closeSplitEditor}
              >
                {t("Batal")}
              </ActionButton>
              <ActionButton className="career-button primary" type="submit">
                <Scissors aria-hidden="true" size={15} strokeWidth={1.9} />
                {t("Pisahkan requirement")}
              </ActionButton>
            </div>
          </div>
        </form>
      ) : null}

      {editor ? (
        <form className="requirement-editor" onSubmit={handleSubmit}>
          <div className="requirement-editor-heading">
            <strong>
              {editor.mode === "add"
                ? t("Tambah requirement")
                : t("Edit requirement")}
            </strong>
            <span>
              {t(
                "Gunakan satu kalimat yang menjelaskan satu requirement dengan jelas.",
              )}
            </span>
          </div>
          <label className="requirement-editor-text" htmlFor={textId}>
            <span>{t("Isi requirement")}</span>
            <textarea
              id={textId}
              ref={textRef}
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={3}
            />
          </label>
          <label htmlFor={priorityId}>
            <span>{t("Prioritas")}</span>
            <select
              id={priorityId}
              value={draftPriority}
              onChange={(event) =>
                setDraftPriority(event.target.value as RequirementPriority)
              }
            >
              <option value={"Wajib"}>{t("Wajib")}</option>
              <option value={"Preferensi"}>{t("Preferensi")}</option>
            </select>
          </label>
          <label htmlFor={typeId}>
            <span>{t("Tipe")}</span>
            <select
              id={typeId}
              value={draftType}
              onChange={(event) =>
                setDraftType(event.target.value as RequirementType)
              }
            >
              <option>Skill</option>
              <option>Tool</option>
              <option value={"Pengalaman"}>{t("Pengalaman")}</option>
              <option value={"Pendidikan"}>{t("Pendidikan")}</option>
            </select>
          </label>
          <div className="requirement-editor-actions">
            {t(error) ? <p role="alert">{t(error)}</p> : <span />}
            <div>
              <ActionButton
                className="career-button secondary"
                variant="secondary"
                type="button"
                onClick={closeEditor}
              >
                <X aria-hidden="true" size={16} strokeWidth={1.9} />
                {t("Batal")}
              </ActionButton>
              <ActionButton className="career-button primary" type="submit">
                <Check aria-hidden="true" size={16} strokeWidth={2} />
                {t("Simpan requirement")}
              </ActionButton>
            </div>
          </div>
        </form>
      ) : null}

      {renderRequirementGroup(
        t("Wajib"),
        t("Requirement utama yang dinyatakan perlu dipenuhi pada lowongan."),
        requiredRequirements,
      )}
      {renderRequirementGroup(
        t("Preferensi"),
        t(
          "Kualifikasi tambahan yang memberi konteks, dengan bobot lebih rendah.",
        ),
        preferredRequirements,
      )}

      <div className="requirement-review-note">
        <CircleAlert aria-hidden="true" size={17} strokeWidth={1.8} />
        <p>
          {t(
            "Requirement pengalaman dan pendidikan tetap disimpan sebagai konteks, tetapi tidak dihitung dalam Fit Score. Halaman ini belum menampilkan status kesiapan profil.",
          )}
        </p>
      </div>

      {!editor && t(error) ? (
        <p className="job-extraction-error" role="alert">
          {t(error)}
        </p>
      ) : null}

      <div className={`requirement-review-savebar${hasSaved ? " saved" : ""}`}>
        <div>
          <span aria-hidden="true">
            {hasSaved ? (
              <Check size={17} strokeWidth={2.1} />
            ) : (
              <Save size={17} strokeWidth={1.9} />
            )}
          </span>
          <div>
            <strong>
              {hasSaved ? t("Review tersimpan") : t("Simpan hasil review")}
            </strong>
            <p>
              {hasSaved
                ? t(
                    "Persyaratan yang sudah diperiksa tersimpan untuk lowongan ini.",
                  )
                : isDirty
                  ? t("Ada perubahan pada requirement yang belum disimpan.")
                  : t(
                      "Simpan daftar ini setelah kamu selesai memeriksa hasil ekstraksi.",
                    )}
            </p>
          </div>
        </div>
        <ActionButton
          size="compact"
          type="button"
          disabled={isSaving || hasSaved}
          onClick={saveReview}
        >
          {isSaving ? (
            <LoaderCircle
              className="spin"
              aria-hidden="true"
              size={15}
              strokeWidth={1.9}
            />
          ) : hasSaved ? (
            <Check aria-hidden="true" size={15} strokeWidth={2} />
          ) : (
            <Save aria-hidden="true" size={15} strokeWidth={1.9} />
          )}
          {isSaving
            ? t("Menyimpan...")
            : hasSaved
              ? t("Tersimpan")
              : t("Simpan review")}
        </ActionButton>
      </div>

      <span className="sr-only" aria-live="polite">
        {t(announcement)}
      </span>
    </section>
  );
}

type ApiRequirement = {
  id: string;
  name: string;
  type: "skill" | "tool" | "education" | "experience";
  priority: "required" | "preferred";
};

type ReviewResponse = {
  data?: { requirements?: ApiRequirement[] };
  error?: { message?: string };
};

function toApiType(type: RequirementType): ApiRequirement["type"] {
  return {
    Skill: "skill",
    Tool: "tool",
    Pendidikan: "education",
    Pengalaman: "experience",
  }[type] as ApiRequirement["type"];
}

function fromApiRequirement(requirement: ApiRequirement): Requirement {
  return {
    id: requirement.id,
    persistedId: requirement.id,
    text: requirement.name,
    type: {
      skill: "Skill",
      tool: "Tool",
      education: "Pendidikan",
      experience: "Pengalaman",
    }[requirement.type] as RequirementType,
    priority: requirement.priority === "required" ? "Wajib" : "Preferensi",
    reviewed: true,
  };
}

async function readReviewResponse(response: Response): Promise<ReviewResponse> {
  try {
    return (await response.json()) as ReviewResponse;
  } catch {
    return {};
  }
}
