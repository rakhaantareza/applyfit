"use client";

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

type WorkspaceRequirement = MappingRequirement & {
  autoMatchReason: string | null;
};

type EvidenceMappingWorkspaceProps = {
  requirements: WorkspaceRequirement[];
  skills: MappingSkill[];
};

const reviewStatusMeta: Record<
  RequirementStatus,
  { label: "Proven" | "Partial" | "Learning" | "Missing"; description: string }
> = {
  proven: {
    label: "Proven",
    description: "Ada skill aktif dengan bukti yang terhubung.",
  },
  partial: {
    label: "Partial",
    description: "Skill aktif sudah terhubung, tetapi bukti masih kosong.",
  },
  learning: {
    label: "Learning",
    description: "Skill yang terhubung masih berstatus dipelajari.",
  },
  missing: {
    label: "Missing",
    description: "Belum ada skill dan bukti yang dapat mendukung requirement.",
  },
};

export function EvidenceMappingWorkspace({
  requirements,
  skills,
}: EvidenceMappingWorkspaceProps) {
  const [manualMappings, setManualMappings] = useState<SavedManualMapping[]>([]);
  const [noEvidenceRequirementIds, setNoEvidenceRequirementIds] = useState<string[]>([]);
  const [pendingNoEvidenceId, setPendingNoEvidenceId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

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

  function saveManualMapping(mapping: SavedManualMapping) {
    const requirement = requirements.find(
      (item) => item.id === mapping.requirementId,
    );
    const skill = skills.find((item) => item.id === mapping.skillId);
    if (!requirement || !skill) return;

    setManualMappings((current) => [...current, mapping]);
    setNoEvidenceRequirementIds((current) =>
      current.filter((id) => id !== mapping.requirementId),
    );
    setPendingNoEvidenceId(null);
    setAnnouncement(
      `${skill.name} dihubungkan manual ke requirement sebagai data contoh.`,
    );
  }

  function markWithoutEvidence(requirement: WorkspaceRequirement) {
    setNoEvidenceRequirementIds((current) => [
      ...new Set([...current, requirement.id]),
    ]);
    setPendingNoEvidenceId(null);
    setAnnouncement(
      `Requirement ditandai belum memiliki skill atau bukti yang relevan pada data contoh.`,
    );
  }

  function undoWithoutEvidence(requirement: WorkspaceRequirement) {
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
  const mappingProgress = Math.round(
    (resolvedRequirementCount / requirements.length) * 100,
  );
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
  const reviewStatusOrder: RequirementStatus[] = [
    "proven",
    "partial",
    "learning",
    "missing",
  ];

  return (
    <>
      <section className="mapping-overview" aria-labelledby="mapping-overview-title">
        <div className="mapping-overview-copy">
          <span className="mapping-overview-icon" aria-hidden="true">
            <Waypoints size={22} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">Kesiapan pemetaan</p>
            <h2 id="mapping-overview-title">
              {resolvedRequirementCount} dari {requirements.length} requirement skill sudah ditinjau
            </h2>
            <p>
              Hubungan di bawah ini memakai skill dan bukti dari profil contoh.
              Status requirement nantinya diturunkan dari data tersebut, bukan disimpan di lowongan.
            </p>
          </div>
        </div>
        <div className="mapping-progress" aria-label={`Pemetaan ${mappingProgress} persen`}>
          <div>
            <span>Progres pemetaan</span>
            <strong>{mappingProgress}%</strong>
          </div>
          <span className="mapping-progress-track" aria-hidden="true">
            <span style={{ width: `${mappingProgress}%` }} />
          </span>
          <small>{mappedEvidenceIds.size} bukti unik sudah ikut mendukung pemetaan.</small>
        </div>
      </section>

      <div className="mapping-auto-summary" role="status">
        <span aria-hidden="true">
          <SearchCheck size={19} strokeWidth={1.9} />
        </span>
        <div>
          <strong>{autoMatchedRequirementCount} kecocokan nama ditemukan otomatis</strong>
          <p>
            ApplyFit hanya menautkan nama skill yang cocok langsung. Requirement tanpa
            kecocokan tetap dibiarkan terbuka untuk ditinjau pengguna.
          </p>
        </div>
        <small>Exact match contoh</small>
      </div>

      <ManualEvidenceMappingForm
        requirements={requirements}
        skills={skills}
        savedMappings={manualMappings}
        onSave={saveManualMapping}
      />

      <section className="mapping-requirements" aria-labelledby="mapping-list-title">
        <div className="mapping-section-heading">
          <div>
            <p className="eyebrow">Requirement yang masuk skor</p>
            <h2 id="mapping-list-title">Periksa hubungan satu per satu</h2>
          </div>
          <p>
            Satu requirement dapat terhubung ke lebih dari satu skill. Bukti mengikuti
            skill yang sudah tercatat di profil karier.
          </p>
        </div>

        <div className="mapping-list">
          {requirements.map((requirement, index) => {
            const mappedSkills = getMappedSkills(requirement);
            const manualSkillIds = getManualSkillIds(requirement.id);
            const evidenceCount = new Set(
              mappedSkills.flatMap((skill) =>
                skill.evidence.map((evidence) => evidence.id),
              ),
            ).size;
            const isMapped = mappedSkills.length > 0;
            const isMarkedWithoutEvidence =
              noEvidenceRequirementIds.includes(requirement.id);
            const isPendingNoEvidence = pendingNoEvidenceId === requirement.id;
            const mappingLabel = requirement.autoMatchReason
              ? manualSkillIds.length
                ? "Cocok otomatis + manual"
                : "Cocok otomatis"
              : manualSkillIds.length
                ? "Dihubungkan manual"
                : "Tidak ada kecocokan langsung";

            return (
              <article
                className={`mapping-row${isMapped ? " mapped" : ""}${
                  isMarkedWithoutEvidence ? " without-evidence" : ""
                }`}
                key={requirement.id}
              >
                <span className="mapping-row-number">{index + 1}</span>
                <div className="mapping-requirement-copy">
                  <span className={`mapping-priority ${requirement.priority === "Preferensi" ? "preferred" : ""}`}>
                    {requirement.priority}
                  </span>
                  <h3>{requirement.text}</h3>
                  <small>Requirement skill</small>
                </div>
                <div className="mapping-connection" aria-label={`Hubungan profil untuk ${requirement.text}`}>
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
                      {isMarkedWithoutEvidence ? "Ditandai tanpa bukti" : mappingLabel}
                    </span>
                    {isMapped ? <small>{evidenceCount} bukti terkait</small> : null}
                  </div>

                  {isMapped ? (
                    <div className="mapping-skill-list">
                      {mappedSkills.map((skill) => (
                        <span className={manualSkillIds.includes(skill.id) ? "manual" : undefined} key={skill.id}>
                          <Link2 aria-hidden="true" size={12} strokeWidth={1.9} />
                          {skill.name}
                          <small>{manualSkillIds.includes(skill.id) ? "Manual" : skill.status}</small>
                        </span>
                      ))}
                    </div>
                  ) : isMarkedWithoutEvidence ? (
                    <p>Pengguna sudah mengonfirmasi belum ada skill atau bukti yang relevan.</p>
                  ) : (
                    <p>Nama requirement ini belum cocok langsung dengan skill profil.</p>
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
                        <button type="button" onClick={() => undoWithoutEvidence(requirement)}>
                          Batalkan tanda
                        </button>
                      ) : isPendingNoEvidence ? (
                        <div role="group" aria-label="Konfirmasi tanpa bukti">
                          <span>Konfirmasi belum ada bukti relevan?</span>
                          <button type="button" onClick={() => setPendingNoEvidenceId(null)}>
                            <X aria-hidden="true" size={12} strokeWidth={2} />
                            Batal
                          </button>
                          <button className="confirm" type="button" onClick={() => markWithoutEvidence(requirement)}>
                            <Check aria-hidden="true" size={12} strokeWidth={2.1} />
                            Tandai
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setPendingNoEvidenceId(requirement.id)}>
                          <CircleOff aria-hidden="true" size={13} strokeWidth={1.8} />
                          Tandai tanpa bukti
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`mapping-review${isReviewOpen ? " open" : ""}`} aria-labelledby="mapping-review-title">
        <div className="mapping-review-heading">
          <span aria-hidden="true">
            <ClipboardCheck size={20} strokeWidth={1.8} />
          </span>
          <div>
            <p className="eyebrow">Review hasil pemetaan</p>
            <h2 id="mapping-review-title">Lihat status yang diturunkan dari hubungan saat ini</h2>
            <p>
              Ringkasan ini membantu memeriksa dasar analisis sebelum Fit Score dihitung.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={isReviewOpen}
            aria-controls="mapping-review-content"
            onClick={() => setIsReviewOpen((current) => !current)}
          >
            {isReviewOpen ? "Tutup review" : "Tinjau hasil"}
            <ChevronDown aria-hidden="true" size={15} strokeWidth={1.9} />
          </button>
        </div>

        {isReviewOpen ? (
          <div className="mapping-review-content" id="mapping-review-content">
            <div className="mapping-review-summary" aria-label="Ringkasan status hasil pemetaan">
              {reviewStatusOrder.map((status) => (
                <span className={status} key={status}>
                  <i aria-hidden="true" />
                  {reviewStatusMeta[status].label}
                  <strong>{reviewItems.filter((item) => item.status === status).length}</strong>
                </span>
              ))}
            </div>

            <div className="mapping-review-list">
              {reviewItems.map(({ requirement, mappedSkills, evidence, status }) => {
                const isConfirmedWithoutEvidence =
                  noEvidenceRequirementIds.includes(requirement.id);

                return (
                  <article key={requirement.id}>
                    <span className={`status-badge ${status}`}>
                      {reviewStatusMeta[status].label}
                    </span>
                    <div className="mapping-review-requirement">
                      <span>{requirement.priority}</span>
                      <h3>{requirement.text}</h3>
                      <p>{reviewStatusMeta[status].description}</p>
                    </div>
                    <div className="mapping-review-support">
                      {mappedSkills.length ? (
                        <>
                          <strong>{mappedSkills.map((skill) => skill.name).join(", ")}</strong>
                          <p>
                            {evidence.length
                              ? evidence.map((item) => item.title).join(" · ")
                              : "Belum ada bukti pada skill yang terhubung."}
                          </p>
                        </>
                      ) : (
                        <>
                          <strong>
                            {isConfirmedWithoutEvidence
                              ? "Dikonfirmasi tanpa bukti"
                              : "Belum selesai dipetakan"}
                          </strong>
                          <p>
                            {isConfirmedWithoutEvidence
                              ? "Pengguna sudah meninjau dan menandai kondisi ini."
                              : "Hubungkan skill atau konfirmasi bahwa bukti belum tersedia."}
                          </p>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mapping-review-note">
              <Info aria-hidden="true" size={15} strokeWidth={1.8} />
              <p>
                Status di atas dihitung saat halaman ditampilkan dari mapping, status skill,
                dan bukti yang terhubung. Label tersebut tidak disimpan pada requirement lowongan.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </>
  );
}
