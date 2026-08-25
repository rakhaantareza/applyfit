import type {
  Requirement,
  RequirementStatus,
} from "../types/fit-analysis";

type RequirementDetailProps = {
  requirement: Requirement;
};

const statusPresentation: Record<
  RequirementStatus,
  { className: string; icon: string; description: string }
> = {
  Proven: {
    className: "proven",
    icon: "✓",
    description: "Skill aktif dan memiliki bukti pendukung",
  },
  Partial: {
    className: "partial",
    icon: "•",
    description: "Skill aktif tetapi belum memiliki bukti pendukung",
  },
  Learning: {
    className: "learning",
    icon: "•",
    description: "Skill sedang dipelajari",
  },
  Missing: {
    className: "missing",
    icon: "!",
    description: "Belum ada skill yang dipetakan",
  },
};

function formatPoint(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function RequirementDetail({ requirement }: RequirementDetailProps) {
  const presentation = statusPresentation[requirement.status];
  const isNonSkill = requirement.score === null;

  return (
    <article className="requirement-row">
      <div className="requirement-main">
        <span
          className={`requirement-icon ${presentation.className}`}
          aria-label={presentation.description}
          role="img"
        >
          {presentation.icon}
        </span>
        <div>
          <div className="requirement-title">
            <h3>{requirement.name}</h3>
            <span className="kind-pill">{requirement.kind}</span>
            <span
              className={`priority-pill ${
                requirement.priority === "Wajib" ? "required" : ""
              }`}
            >
              {requirement.priority}
            </span>
            {isNonSkill && (
              <span
                className="scope-pill"
                title="Requirement non-skill tetap ditampilkan, tetapi tidak memengaruhi Fit Score."
              >
                <span aria-hidden="true">i</span>
                Di luar Fit Score
              </span>
            )}
          </div>
          <p>{requirement.note}</p>
          {requirement.status === "Proven" && requirement.evidence.length > 0 && (
            <div className="evidence-list" aria-label="Bukti pendukung">
              {requirement.evidence.map((evidence) => (
                <div className="evidence-chip" key={`${evidence.type}-${evidence.title}`}>
                  <span aria-hidden="true">◇</span>
                  <span>
                    <strong>{evidence.title}</strong>
                    <small>{evidence.type}</small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="requirement-score">
        <span className={`status-badge ${presentation.className}`}>
          {requirement.status}
        </span>
        {requirement.score ? (
          <div
            className="point-contribution"
            aria-label={`Bobot ${requirement.score.weight} dikali ${requirement.score.multiplier} persen menghasilkan ${requirement.score.earned} poin`}
          >
            <span>
              {requirement.score.weight} × {requirement.score.multiplier}%
            </span>
            <strong>
              {formatPoint(requirement.score.earned)} / {requirement.score.maximum}
            </strong>
          </div>
        ) : (
          <div className="excluded-score">
            <strong>Tidak dihitung</strong>
            <small>Non-skill</small>
          </div>
        )}
      </div>
    </article>
  );
}
