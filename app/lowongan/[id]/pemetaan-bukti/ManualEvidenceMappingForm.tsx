"use client";

import {
  Check,
  CircleAlert,
  LibraryBig,
  Link2,
  Plus,
  Waypoints,
  X,
} from "lucide-react";
import { useId, useState, type FormEvent } from "react";

export type MappingEvidence = {
  id: string;
  title: string;
};

export type MappingSkill = {
  id: string;
  name: string;
  status: "Aktif" | "Dipelajari";
  evidence: MappingEvidence[];
};

export type MappingRequirement = {
  id: string;
  text: string;
  priority: "Wajib" | "Preferensi";
  skillIds: string[];
};

export type SavedManualMapping = {
  requirementId: string;
  skillId: string;
};

type ManualEvidenceMappingFormProps = {
  requirements: MappingRequirement[];
  skills: MappingSkill[];
  savedMappings: SavedManualMapping[];
  onSave: (mapping: SavedManualMapping) => void;
};

export function ManualEvidenceMappingForm({
  requirements,
  skills,
  savedMappings,
  onSave,
}: ManualEvidenceMappingFormProps) {
  const firstUnmappedRequirement =
    requirements.find((requirement) => requirement.skillIds.length === 0) ??
    requirements[0];
  const [isOpen, setIsOpen] = useState(false);
  const [requirementId, setRequirementId] = useState(
    firstUnmappedRequirement?.id ?? "",
  );
  const [skillId, setSkillId] = useState(skills[0]?.id ?? "");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const requirementFieldId = useId();
  const skillFieldId = useId();

  const selectedRequirement = requirements.find(
    (requirement) => requirement.id === requirementId,
  );
  const selectedSkill = skills.find((skill) => skill.id === skillId);
  const selectedRequirementSkillIds = new Set([
    ...(selectedRequirement?.skillIds ?? []),
    ...savedMappings
      .filter((mapping) => mapping.requirementId === requirementId)
      .map((mapping) => mapping.skillId),
  ]);
  const availableSkills = skills.filter(
    (skill) => !selectedRequirementSkillIds.has(skill.id),
  );

  function openForm() {
    const nextRequirement =
      requirements.find((requirement) =>
        skills.some(
          (skill) =>
            !requirement.skillIds.includes(skill.id) &&
            !savedMappings.some(
              (mapping) =>
                mapping.requirementId === requirement.id &&
                mapping.skillId === skill.id,
            ),
        ),
      ) ?? requirements[0];
    const nextRequirementLinkedSkillIds = new Set([
      ...(nextRequirement?.skillIds ?? []),
      ...savedMappings
        .filter((mapping) => mapping.requirementId === nextRequirement?.id)
        .map((mapping) => mapping.skillId),
    ]);
    const nextSkill = skills.find(
      (skill) => !nextRequirementLinkedSkillIds.has(skill.id),
    );

    setRequirementId(nextRequirement?.id ?? "");
    setSkillId(nextSkill?.id ?? "");
    setError("");
    setAnnouncement("");
    setIsOpen(true);
  }

  function closeForm() {
    setIsOpen(false);
    setError("");
  }

  function chooseRequirement(nextRequirementId: string) {
    const nextRequirement = requirements.find(
      (requirement) => requirement.id === nextRequirementId,
    );
    const linkedSkillIds = new Set([
      ...(nextRequirement?.skillIds ?? []),
      ...savedMappings
        .filter((mapping) => mapping.requirementId === nextRequirementId)
        .map((mapping) => mapping.skillId),
    ]);
    const nextSkill = skills.find((skill) => !linkedSkillIds.has(skill.id));

    setRequirementId(nextRequirementId);
    setSkillId(nextSkill?.id ?? "");
    setError("");
  }

  function saveMapping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequirement || !selectedSkill) {
      setError("Pilih requirement dan skill yang ingin dihubungkan.");
      return;
    }

    if (selectedRequirementSkillIds.has(selectedSkill.id)) {
      setError("Skill ini sudah terhubung ke requirement yang dipilih.");
      return;
    }

    onSave({ requirementId: selectedRequirement.id, skillId: selectedSkill.id });
    setAnnouncement(
      `${selectedSkill.name} berhasil dihubungkan ke requirement sebagai data contoh.`,
    );
    setError("");
    setIsOpen(false);
  }

  return (
    <section className="manual-mapping-panel" aria-labelledby="manual-mapping-title">
      <div className="manual-mapping-intro">
        <span aria-hidden="true">
          <Waypoints size={19} strokeWidth={1.8} />
        </span>
        <div>
          <p className="eyebrow">Hubungan manual</p>
          <h2 id="manual-mapping-title">Tidak menemukan kecocokan yang tepat?</h2>
          <p>
            Pilih skill profil yang benar-benar relevan. Bukti yang sudah tertaut ke
            skill tersebut akan ikut terlihat sebagai konteks pendukung.
          </p>
        </div>
        <button type="button" onClick={isOpen ? closeForm : openForm}>
          {isOpen ? (
            <X aria-hidden="true" size={15} strokeWidth={1.9} />
          ) : (
            <Plus aria-hidden="true" size={15} strokeWidth={2} />
          )}
          {isOpen ? "Tutup form" : "Hubungkan manual"}
        </button>
      </div>

      {isOpen ? (
        <form className="manual-mapping-form" onSubmit={saveMapping}>
          <div className="manual-mapping-fields">
            <label htmlFor={requirementFieldId}>
              <span>Requirement</span>
              <select
                id={requirementFieldId}
                value={requirementId}
                onChange={(event) => chooseRequirement(event.target.value)}
              >
                {requirements.map((requirement) => (
                  <option key={requirement.id} value={requirement.id}>
                    {requirement.priority} — {requirement.text}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor={skillFieldId}>
              <span>Skill profil</span>
              <select
                id={skillFieldId}
                value={skillId}
                onChange={(event) => {
                  setSkillId(event.target.value);
                  setError("");
                }}
                disabled={!availableSkills.length}
              >
                {availableSkills.length ? (
                  availableSkills.map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} — {skill.status}
                    </option>
                  ))
                ) : (
                  <option value="">Semua skill sudah terhubung</option>
                )}
              </select>
            </label>
          </div>

          <div className="manual-evidence-preview" aria-live="polite">
            <div>
              <span aria-hidden="true">
                <LibraryBig size={16} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Bukti yang mengikuti skill</strong>
                <p>
                  {selectedSkill?.evidence.length
                    ? `${selectedSkill.evidence.length} bukti di profil akan mendukung hubungan ini.`
                    : "Skill ini belum memiliki bukti terhubung di profil."}
                </p>
              </div>
            </div>
            {selectedSkill?.evidence.length ? (
              <ul>
                {selectedSkill.evidence.map((evidence) => (
                  <li key={evidence.id}>
                    <Link2 aria-hidden="true" size={12} strokeWidth={1.8} />
                    {evidence.title}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="manual-evidence-warning">
                <CircleAlert aria-hidden="true" size={14} strokeWidth={1.8} />
                Hubungan tetap dapat dibuat, tetapi skill tanpa bukti tidak dianggap
                sepenuhnya terbukti.
              </div>
            )}
          </div>

          <div className="manual-mapping-actions">
            {error ? <p role="alert">{error}</p> : <span />}
            <div>
              <button type="button" onClick={closeForm}>Batal</button>
              <button className="primary" type="submit" disabled={!availableSkills.length}>
                <Link2 aria-hidden="true" size={14} strokeWidth={1.9} />
                Hubungkan requirement
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {savedMappings.length ? (
        <div className="manual-mapping-results" aria-label="Hubungan manual contoh">
          {savedMappings.map((mapping) => {
            const requirement = requirements.find(
              (item) => item.id === mapping.requirementId,
            );
            const skill = skills.find((item) => item.id === mapping.skillId);
            if (!requirement || !skill) return null;

            return (
              <article key={`${mapping.requirementId}-${mapping.skillId}`}>
                <span aria-hidden="true"><Check size={13} strokeWidth={2.1} /></span>
                <div>
                  <strong>{skill.name} dihubungkan manual</strong>
                  <p>{requirement.text}</p>
                </div>
                <small>{skill.evidence.length} bukti terkait</small>
              </article>
            );
          })}
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">{announcement}</span>
    </section>
  );
}
