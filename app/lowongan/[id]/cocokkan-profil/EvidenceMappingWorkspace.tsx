"use client";
import { useI18n } from "../../../components/LanguageProvider";

import { RelationshipLane } from "../../../components/RelationshipLane";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CircleOff,
  ClipboardCheck,
  Info,
  Link2,
  SearchCheck,
  Waypoints,
  X,
} from "lucide-react";
import { useState } from "react";
import { ActionButton } from "../../../components/ActionControl";
import {
  deriveRequirementStatus,
  type RequirementStatus,
} from "../../../../server/services/fit-score";
import {
  ManualEvidenceMappingForm,
  type MappingRequirement,
  type MappingSkill,
  type SavedManualMapping,
} from "./ManualEvidenceMappingForm";
import { fitScoreStatusLabels } from "../../../lib/fit-status-labels";

type WorkspaceRequirement = MappingRequirement & {
  autoMatchReason: string | null;
  reviewedWithoutEvidence: boolean;
};

type EvidenceMappingWorkspaceProps = {
  jobId: string;
  requirements: WorkspaceRequirement[];
  skills: MappingSkill[];
};

const scoringStatusMeta: Record<
  RequirementStatus,
  { label: string; description: string }
> = {
  proven: {
    label: fitScoreStatusLabels.proven,
    description: "Ada skill aktif dengan bukti yang terhubung.",
  },
  partial: {
    label: fitScoreStatusLabels.partial,
    description: "Skill aktif sudah terhubung, tetapi bukti masih kosong.",
  },
  learning: {
    label: fitScoreStatusLabels.learning,
    description: "Skill yang terhubung masih berstatus dipelajari.",
  },
  missing: {
    label: fitScoreStatusLabels.missing,
    description: "Belum ada skill dan bukti yang dapat mendukung requirement.",
  },
};

export function EvidenceMappingWorkspace({
  jobId,
  requirements,
  skills,
}: EvidenceMappingWorkspaceProps) {
  const { t } = useI18n();
  const [manualMappings, setManualMappings] = useState<SavedManualMapping[]>(
    [],
  );
  const [noEvidenceRequirementIds, setNoEvidenceRequirementIds] = useState<
    string[]
  >(() =>
    requirements
      .filter((requirement) => requirement.reviewedWithoutEvidence)
      .map((requirement) => requirement.id),
  );
  const [pendingNoEvidenceId, setPendingNoEvidenceId] = useState<string | null>(
    null,
  );
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [requestError, setRequestError] = useState("");

  function getManualSkillIds(requirementId: string) {
    return manualMappings
      .filter((mapping) => mapping.requirementId === requirementId)
      .map((mapping) => mapping.skillId);
  }

  function getMappedSkills(requirement: WorkspaceRequirement) {
    const skillIds = new Set([
      ...requirement.skillIds,
      ...getManualSkillIds(requirement.id),
    ]);

    return skills.filter((skill) => skillIds.has(skill.id));
  }

  async function saveManualMapping(mapping: SavedManualMapping) {
    const requirement = requirements.find(
      (item) => item.id === mapping.requirementId,
    );
    const skill = skills.find((item) => item.id === mapping.skillId);
    if (!requirement || !skill) return;

    setRequestError("");
    const response = await fetch(
      `/api/jobs/${encodeURIComponent(jobId)}/requirements/${encodeURIComponent(mapping.requirementId)}/mappings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: mapping.skillId }),
      },
    );
    const result = await readMutationResponse(response);
    if (!response.ok) {
      const message =
        result.error?.message ??
        "Skill belum dapat dihubungkan ke requirement.";
      setRequestError(message);
      throw new Error(message);
    }

    setManualMappings((current) => [...current, mapping]);
    setNoEvidenceRequirementIds((current) =>
      current.filter((id) => id !== mapping.requirementId),
    );
    setPendingNoEvidenceId(null);
    setAnnouncement(`${skill.name} berhasil dihubungkan ke requirement.`);
  }

  async function markWithoutEvidence(requirement: WorkspaceRequirement) {
    setRequestError("");
    const response = await fetch(
      `/api/jobs/${encodeURIComponent(jobId)}/requirements/${encodeURIComponent(requirement.id)}/without-evidence`,
      { method: "POST" },
    );
    const result = await readMutationResponse(response);
    if (!response.ok) {
      setRequestError(
        result.error?.message ??
          "Requirement belum dapat ditandai tanpa bukti.",
      );
      return;
    }
    setNoEvidenceRequirementIds((current) => [
      ...new Set([...current, requirement.id]),
    ]);
    setPendingNoEvidenceId(null);
    setAnnouncement(
      `Requirement ditandai belum memiliki skill atau bukti yang relevan.`,
    );
  }

  async function undoWithoutEvidence(requirement: WorkspaceRequirement) {
    setRequestError("");
    const response = await fetch(
      `/api/jobs/${encodeURIComponent(jobId)}/requirements/${encodeURIComponent(requirement.id)}/without-evidence`,
      { method: "DELETE" },
    );
    const result = await readMutationResponse(response);
    if (!response.ok) {
      setRequestError(
        result.error?.message ?? "Tanda tanpa bukti belum dapat dibatalkan.",
      );
      return;
    }
    setNoEvidenceRequirementIds((current) =>
      current.filter((id) => id !== requirement.id),
    );
    setAnnouncement(`Tanda tanpa bukti untuk requirement dibatalkan.`);
  }

  const resolvedRequirementCount = requirements.filter(
    (requirement) =>
      getMappedSkills(requirement).length > 0 ||
      noEvidenceRequirementIds.includes(requirement.id),
  ).length;
  const mappedEvidenceIds = new Set(
    requirements.flatMap((requirement) =>
      getMappedSkills(requirement).flatMap((skill) =>
        skill.evidence.map((evidence) => evidence.id),
      ),
    ),
  );
  const mappingProgress = requirements.length
    ? Math.round((resolvedRequirementCount / requirements.length) * 100)
    : 0;
  const autoMatchedRequirementCount = requirements.filter(
    (requirement) => requirement.autoMatchReason !== null,
  ).length;
  const reviewItems = requirements.map((requirement) => {
    const mappedSkills = getMappedSkills(requirement);
    const status = deriveRequirementStatus(
      mappedSkills.map((skill) => ({
        skill: {
          id: skill.id,
          status: skill.status === "Aktif" ? "active" : "learning",
        },
        linkedEvidenceIds: skill.evidence.map((evidence) => evidence.id),
      })),
    );
    const evidence = Array.from(
      new Map(
        mappedSkills
          .flatMap((skill) => skill.evidence)
          .map((item) => [item.id, item]),
      ).values(),
    );

    return { requirement, mappedSkills, evidence, status };
  });
  const scoringStatusOrder: RequirementStatus[] = [
    "proven",
    "partial",
    "learning",
    "missing",
  ];

  const pendingRequirements = requirements.filter(
    (requirement) =>
      getMappedSkills(requirement).length === 0 &&
      !noEvidenceRequirementIds.includes(requirement.id),
  );
  const reviewedRequirements = requirements.filter(
    (requirement) =>
      getMappedSkills(requirement).length > 0 ||
      noEvidenceRequirementIds.includes(requirement.id),
  );
  function renderRequirement(requirement: WorkspaceRequirement, index: number) {
    const mappedSkills = getMappedSkills(requirement);
    const manualSkillIds = getManualSkillIds(requirement.id);
    const evidenceCount = new Set(
      mappedSkills.flatMap((skill) =>
        skill.evidence.map((evidence) => evidence.id),
      ),
    ).size;
    const isMapped = mappedSkills.length > 0;
    const isMarkedWithoutEvidence = noEvidenceRequirementIds.includes(
      requirement.id,
    );
    const isPendingNoEvidence = pendingNoEvidenceId === requirement.id;
    const mappingLabel = isMapped ? "Skill terhubung" : "Perlu dicocokkan";

    return (
      <article
        className={`mapping-row${isMapped ? " mapped" : ""}${
          isMarkedWithoutEvidence ? " without-evidence" : ""
        }`}
        key={requirement.id}
      >
        <span className="mapping-row-number">{index + 1}</span>
        <div className="mapping-requirement-copy">
          <span
            className={`mapping-priority ${requirement.priority === "Preferensi" ? "preferred" : ""}`}
          >
            {t(requirement.priority)}
          </span>
          <h3>{requirement.text}</h3>
          <small>{t("Persyaratan")}</small>
        </div>
        <RelationshipLane
          className="mapping-connection"
          aria-label={t(`Hubungan profil untuk ${requirement.text}`)}
        >
          <div className="mapping-connection-heading">
            <span>
              {isMapped ? (
                requirement.autoMatchReason ? (
                  <SearchCheck aria-hidden="true" size={15} strokeWidth={1.9} />
                ) : (
                  <Link2 aria-hidden="true" size={15} strokeWidth={1.9} />
                )
              ) : isMarkedWithoutEvidence ? (
                <CircleOff aria-hidden="true" size={15} strokeWidth={1.8} />
              ) : (
                <CircleDashed aria-hidden="true" size={15} strokeWidth={1.8} />
              )}
              {isMarkedWithoutEvidence
                ? t("Sudah ditinjau · tanpa bukti")
                : mappingLabel}
            </span>
            {isMapped ? (
              <small>
                {evidenceCount} {t("bukti terkait")}
              </small>
            ) : null}
          </div>

          {isMapped ? (
            <div className="mapping-skill-list">
              {mappedSkills.map((skill) => (
                <span
                  className={
                    manualSkillIds.includes(skill.id) ? "manual" : undefined
                  }
                  key={skill.id}
                >
                  <Link2 aria-hidden="true" size={12} strokeWidth={1.9} />
                  {skill.name}
                  <small>{t(skill.status)}</small>
                </span>
              ))}
            </div>
          ) : isMarkedWithoutEvidence ? (
            <p>{t("Belum ada skill atau pengalaman yang sesuai.")}</p>
          ) : (
            <p>{t("Belum menemukan skill yang cocok.")}</p>
          )}

          {requirement.autoMatchReason ? (
            <p className="mapping-auto-reason">
              <CheckCircle2 aria-hidden="true" size={12} strokeWidth={1.9} />
              {requirement.autoMatchReason}
            </p>
          ) : null}

          {!isMapped ? (
            <div className="mapping-no-evidence-action">
              {isMarkedWithoutEvidence ? (
                <ActionButton
                  size="compact"
                  variant="ghost"
                  type="button"
                  onClick={() => undoWithoutEvidence(requirement)}
                >
                  {t("Batalkan tanda")}
                </ActionButton>
              ) : isPendingNoEvidence ? (
                <div role="group" aria-label={t("Konfirmasi tanpa bukti")}>
                  <span>{t("Konfirmasi belum ada bukti relevan?")}</span>
                  <ActionButton
                    size="compact"
                    variant="secondary"
                    type="button"
                    onClick={() => setPendingNoEvidenceId(null)}
                  >
                    <X aria-hidden="true" size={12} strokeWidth={2} />
                    {t("Batal")}
                  </ActionButton>
                  <ActionButton
                    className="confirm"
                    size="compact"
                    type="button"
                    onClick={() => markWithoutEvidence(requirement)}
                  >
                    <Check aria-hidden="true" size={12} strokeWidth={2.1} />
                    {t("Tandai")}
                  </ActionButton>
                </div>
              ) : (
                <ActionButton
                  size="compact"
                  variant="ghost"
                  type="button"
                  onClick={() => setPendingNoEvidenceId(requirement.id)}
                >
                  <CircleOff aria-hidden="true" size={13} strokeWidth={1.8} />
                  {t("Tandai tanpa bukti")}
                </ActionButton>
              )}
            </div>
          ) : null}
        </RelationshipLane>
      </article>
    );
  }

  return (
    <>
      <section
        className="mapping-overview"
        aria-labelledby="mapping-overview-title"
      >
        <div className="mapping-overview-copy">
          <span className="mapping-overview-icon" aria-hidden="true">
            <Waypoints size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">{t("Cocokkan Profil")}</p>
            <h2 id="mapping-overview-title">
              {resolvedRequirementCount} {t("dari")} {requirements.length}{" "}
              {t("persyaratan sudah diperiksa")}
            </h2>
            <p>
              {t(
                "Skill dan pengalaman dari profilmu digunakan kembali di sini.",
              )}
            </p>
          </div>
        </div>
        <div
          className="mapping-progress"
          aria-label={t(`Kecocokan profil ${mappingProgress} persen`)}
        >
          <div>
            <span>{t("Progres kecocokan")}</span>
            <strong>{mappingProgress}%</strong>
          </div>
          <span className="mapping-progress-track" aria-hidden="true">
            <span style={{ width: `${mappingProgress}%` }} />
          </span>
          <small>
            {mappedEvidenceIds.size}{" "}
            {t("bukti unik sudah ikut mendukung kecocokan.")}
          </small>
        </div>
      </section>

      {autoMatchedRequirementCount > 0 ? (
        <div className="mapping-auto-summary" role="status">
          <span aria-hidden="true">
            <SearchCheck size={19} strokeWidth={1.9} />
          </span>
          <div>
            <strong>
              {autoMatchedRequirementCount} {t("persyaratan sudah terhubung")}
            </strong>
            <p>
              {t(
                "Periksa persyaratan lain yang belum menemukan skill yang sesuai.",
              )}
            </p>
          </div>
          <small>{t("Cocok otomatis")}</small>
        </div>
      ) : null}

      <ManualEvidenceMappingForm
        requirements={requirements}
        skills={skills}
        savedMappings={manualMappings}
        onSave={saveManualMapping}
      />

      {requestError ? (
        <p className="job-extraction-error" role="alert">
          {requestError}
        </p>
      ) : null}

      <section
        className="mapping-requirements"
        aria-labelledby="mapping-list-title"
      >
        <div className="mapping-section-heading">
          <h2 id="mapping-list-title">{t("Persyaratan dan profilmu")}</h2>
        </div>
        {pendingRequirements.length > 0 ? (
          <div className="mapping-pending">
            <h3>
              {t("Perlu kamu cek")} <span>{pendingRequirements.length}</span>
            </h3>
            <div className="mapping-list">
              {pendingRequirements.map(renderRequirement)}
            </div>
          </div>
        ) : (
          <p className="mapping-all-reviewed">
            {t("Semua persyaratan sudah ditinjau.")}
          </p>
        )}
        {reviewedRequirements.length > 0 ? (
          <details className="mapping-resolved">
            <summary>
              <span>
                {t("Sudah ditinjau")}{" "}
                <small>
                  {reviewedRequirements.length} {t("persyaratan")}
                </small>
              </span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className="mapping-list">
              {reviewedRequirements.map(renderRequirement)}
            </div>
          </details>
        ) : null}
      </section>

      <section
        className={`mapping-review${isReviewOpen ? " open" : ""}`}
        aria-labelledby="mapping-review-title"
      >
        <div className="mapping-review-heading">
          <span aria-hidden="true">
            <ClipboardCheck size={20} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">{t("Hasil Cocokkan Profil")}</p>
            <h2 id="mapping-review-title">{t("Ringkasan kecocokan")}</h2>
            <p>{t("Lihat dukungan untuk setiap persyaratan.")}</p>
          </div>
          <ActionButton
            size="compact"
            variant="secondary"
            type="button"
            aria-expanded={isReviewOpen}
            aria-controls="mapping-review-content"
            onClick={() => setIsReviewOpen((current) => !current)}
          >
            {isReviewOpen ? t("Tutup review") : t("Tinjau hasil")}
            <ChevronDown aria-hidden="true" size={15} strokeWidth={1.9} />
          </ActionButton>
        </div>

        {isReviewOpen ? (
          <div className="mapping-review-content" id="mapping-review-content">
            <div
              className="mapping-review-summary"
              aria-label={t("Ringkasan hasil Cocokkan Profil")}
            >
              {scoringStatusOrder.map((status) => (
                <span className={status} key={status}>
                  <i aria-hidden="true" />
                  {t(scoringStatusMeta[status].label)}
                  <strong>
                    {
                      reviewItems.filter((item) => item.status === status)
                        .length
                    }
                  </strong>
                </span>
              ))}
            </div>

            <div className="mapping-review-list">
              {reviewItems.map(
                ({ requirement, mappedSkills, evidence, status }) => {
                  const isConfirmedWithoutEvidence =
                    noEvidenceRequirementIds.includes(requirement.id);

                  return (
                    <article key={requirement.id}>
                      <span className={`status-badge ${status}`}>
                        {t(scoringStatusMeta[status].label)}
                      </span>
                      <div className="mapping-review-requirement">
                        <span>{t(requirement.priority)}</span>
                        <h3>{requirement.text}</h3>
                        <p>{t(scoringStatusMeta[status].description)}</p>
                      </div>
                      <div className="mapping-review-support">
                        {mappedSkills.length ? (
                          <>
                            <strong>
                              {mappedSkills
                                .map((skill) => skill.name)
                                .join(", ")}
                            </strong>
                            <p>
                              {evidence.length
                                ? evidence.map((item) => item.title).join(" · ")
                                : t(
                                    "Belum ada bukti pada skill yang terhubung.",
                                  )}
                            </p>
                          </>
                        ) : (
                          <>
                            <strong>
                              {isConfirmedWithoutEvidence
                                ? t("Sudah ditinjau · tanpa bukti")
                                : t("Perlu dicocokkan")}
                            </strong>
                            <p>
                              {isConfirmedWithoutEvidence
                                ? t(
                                    "Pengguna sudah meninjau dan menandai kondisi ini.",
                                  )
                                : t(
                                    "Hubungkan skill atau konfirmasi bahwa bukti belum tersedia.",
                                  )}
                            </p>
                          </>
                        )}
                      </div>
                    </article>
                  );
                },
              )}
            </div>

            <div className="mapping-review-note">
              <Info aria-hidden="true" size={15} strokeWidth={1.8} />
              <p>
                {t(
                  "Hasil ini mengikuti skill dan pengalaman yang terhubung saat ini.",
                )}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <span className="sr-only" aria-live="polite">
        {t(announcement)}
      </span>
    </>
  );
}

type MutationResponse = { error?: { message?: string } };

async function readMutationResponse(
  response: Response,
): Promise<MutationResponse> {
  try {
    return (await response.json()) as MutationResponse;
  } catch {
    return {};
  }
}
