export type RequirementStatus = "Proven" | "Partial" | "Learning" | "Missing";

export type Requirement = {
  name: string;
  kind: "Skill" | "Tool" | "Education" | "Experience";
  priority: "Wajib" | "Preferensi";
  status: RequirementStatus;
  note: string;
  skills: Array<{
    name: string;
    status: "active" | "learning";
  }>;
  evidence: Array<{
    title: string;
    type: "Proyek" | "Portofolio" | "Sertifikat" | "Pengalaman";
  }>;
  score: {
    weight: number;
    multiplier: number;
    earned: number;
    maximum: number;
  } | null;
};
