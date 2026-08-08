"use client";

import {
  Check,
  CheckCircle2,
  CircleDashed,
  CircleOff,
  Link2,
  SearchCheck,
  Waypoints,
  X,
} from "lucide-react";
import { useState } from "react";
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

export function EvidenceMappingWorkspace({
  requirements,
  skills,
}: EvidenceMappingWorkspaceProps) {
  const [manualMappings, setManualMappings] = useState<SavedManualMapping[]>([]);
  const [noEvidenceRequirementIds, setNoEvidenceRequirementIds] = useState<string[]>([]);
  const [pendingNoEvidenceId, setPendingNoEvidenceId] = useState<string | null>(null);
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

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </>
  );
}
