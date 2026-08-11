"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
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
};

type ApiSkill = { id: string; name: string };
type EvidenceLink = { skillId: string };

type EvidenceResponse = {
  data?: { evidences?: ApiEvidence[] };
  error?: { message?: string };
};

type SkillsResponse = {
  data?: { skills?: ApiSkill[] };
  error?: { message?: string };
};

type LinksResponse = {
  data?: { links?: EvidenceLink[] };
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
        const [evidenceResponse, skillsResponse] = await Promise.all([
          fetch("/api/evidences"),
          fetch("/api/career-profile/skills"),
        ]);
        const evidenceResult = await readJson<EvidenceResponse>(evidenceResponse);
        const skillsResult = await readJson<SkillsResponse>(skillsResponse);
        if (!evidenceResponse.ok || !skillsResponse.ok) {
          throw new Error(
            evidenceResult.error?.message ??
              skillsResult.error?.message ??
              "Pustaka bukti belum dapat dimuat.",
          );
        }

        const apiEvidences = evidenceResult.data?.evidences ?? [];
        const profileSkills = skillsResult.data?.skills ?? [];
        const links = await Promise.all(apiEvidences.map(async (evidence) => {
          const response = await fetch(`/api/evidences/${encodeURIComponent(evidence.id)}/skills`);
          if (!response.ok) return [];
          const result = await readJson<LinksResponse>(response);
          return result.data?.links ?? [];
        }));

        if (!active) return;
        setSkills(profileSkills);
        setEvidences(apiEvidences.map((evidence, index) => ({
          id: evidence.id,
          title: evidence.title,
          type: typeLabels[evidence.type],
          backendType: evidence.type,
          description: evidence.description,
          source: evidence.url,
          skills: links[index]?.flatMap((link) => {
            const skill = profileSkills.find((item) => item.id === link.skillId);
            return skill ? [skill] : [];
          }) ?? [],
          updatedAt: formatUpdatedAt(evidence.updatedAt),
        })));
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Pustaka bukti belum dapat dimuat.",
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

  if (loading) return null;

  if (error) {
    return (
      <div className="career-profile-state error" role="alert">
        <AlertCircle aria-hidden="true" size={22} />
        <strong>{error}</strong>
        <button type="button" onClick={() => window.location.reload()}>Coba lagi</button>
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
