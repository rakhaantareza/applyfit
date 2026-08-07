export type ExampleRequirement = {
  label: string;
  name: string;
  priority: "Wajib" | "Preferensi";
  status: "Proven" | "Partial" | "Learning" | "Missing";
  weight: 1 | 3;
  multiplier: 0 | 20 | 50 | 100;
  contribution: number;
  className: "proven" | "partial" | "learning" | "missing";
};

type ExampleRequirementListProps = {
  requirements: ExampleRequirement[];
};

function formatContribution(value: number) {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function ExampleRequirementList({
  requirements,
}: ExampleRequirementListProps) {
  return (
    <div className="example-requirements">
      {requirements.map((requirement, index) => (
        <article className="example-requirement" key={requirement.label}>
          <span className="step-number">{index + 1}</span>
          <div className="example-requirement-copy">
            <small>{requirement.label}</small>
            <h3>{requirement.name}</h3>
            <div>
              <span
                className={`priority-pill ${
                  requirement.priority === "Wajib" ? "required" : ""
                }`}
              >
                {requirement.priority}
              </span>
              <span className={`status-badge ${requirement.className}`}>
                {requirement.status}
              </span>
            </div>
          </div>
          <div
            className="example-equation"
            aria-label={`${requirement.weight} dikali ${requirement.multiplier} persen sama dengan ${requirement.contribution}`}
          >
            <span>
              <small>Bobot</small>
              <strong>{requirement.weight}</strong>
            </span>
            <b>×</b>
            <span>
              <small>Multiplier</small>
              <strong>{requirement.multiplier}%</strong>
            </span>
            <b>=</b>
            <span className="equation-result">
              <small>Kontribusi</small>
              <strong>{formatContribution(requirement.contribution)}</strong>
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
