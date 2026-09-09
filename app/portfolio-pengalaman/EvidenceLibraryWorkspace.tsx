"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "../components/ActionControl";
import { WorkspaceLoadingState } from "../components/WorkspaceLoadingState";
import {
  EvidenceLibrary,
  type EvidenceItem,
  type ProfileSkill,
} from "./EvidenceLibrary";

type ApiEvidence = {
  id: string;
  title: string;
  type: "project" | "cert" | "work" | "internship" | "github" | "portfolio";
  url: string | null;
  description: string;
  updatedAt: string;
  skillIds?: string[];
};

type ApiSkill = { id: string; name: string };

type PortfolioWorkspaceResponse = {
  data?: { evidences: ApiEvidence[]; skills: ApiSkill[] };
  error?: { message?: string };
};

export function EvidenceLibraryWorkspace() {
  const [evidences, setEvidences] = useState<EvidenceItem[]>([]);
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLibrary() {
      try {
        const response = await fetch("/api/workspace?scope=portfolio", { cache: "no-store" });
        const result = await readJson<PortfolioWorkspaceResponse>(response);
        if (!response.ok || !result.data) {
          throw new Error(result.error?.message ?? "Portfolio & Pengalaman belum dapat dimuat.");
        }
        const apiEvidences = result.data.evidences;
        const profileSkills = result.data.skills;
        const skillsById = new Map(profileSkills.map((skill) => [skill.id, skill]));

        if (!active) return;
        setSkills(profileSkills);
        setEvidences(apiEvidences.map((evidence) => ({
          id: evidence.id,
          title: evidence.title,
          type: typeLabels[evidence.type],
          backendType: evidence.type,
          description: evidence.description,
          source: evidence.url,
          skills: evidence.skillIds?.flatMap((skillId) => {
            const skill = skillsById.get(skillId);
            return skill ? [skill] : [];
          }) ?? [],
          updatedAt: formatUpdatedAt(evidence.updatedAt),
        })));
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Portfolio & Pengalaman belum dapat dimuat.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLibrary();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <WorkspaceLoadingState rows={4} />;

  if (error) {
    return (
      <div className="career-profile-state error" role="alert">
        <AlertCircle aria-hidden="true" size={22} />
        <strong>{error}</strong>
        <ActionButton size="compact" variant="secondary" type="button" onClick={() => window.location.reload()}>Coba lagi</ActionButton>
      </div>
    );
  }

  return <EvidenceLibrary initialEvidences={evidences} availableSkills={skills} />;
}

const typeLabels = {
  project: "Proyek",
  cert: "Sertifikat",
  work: "Pengalaman",
  internship: "Pengalaman",
  github: "GitHub",
  portfolio: "Portofolio",
} as const;

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru diperbarui";
  return `Diperbarui ${new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`;
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}
