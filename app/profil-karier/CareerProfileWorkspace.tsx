"use client";

import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { CareerDirectionEditor } from "./CareerDirectionEditor";
import { ProfileIdentity } from "./ProfileIdentity";
import { SkillManager, type CareerSkill } from "./SkillManager";

type CareerProfile = {
  id: string;
  targetRole: string;
  careerField: string;
};

type ApiSkill = {
  id: string;
  name: string;
  status: "active" | "learning";
  level: string | null;
};

type CareerProfileResponse = {
  data?: { profile?: CareerProfile | null };
  error?: { message?: string };
};

type SkillsResponse = {
  data?: { skills?: ApiSkill[] };
  error?: { message?: string };
};

type EvidenceResponse = {
  data?: { total?: number };
};

export function CareerProfileWorkspace() {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [skills, setSkills] = useState<CareerSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const [profileResponse, skillsResponse] = await Promise.all([
          fetch("/api/career-profile"),
          fetch("/api/career-profile/skills"),
        ]);
        const profileResult = await readJson<CareerProfileResponse>(profileResponse);
        const skillsResult = await readJson<SkillsResponse>(skillsResponse);
        if (!profileResponse.ok || !skillsResponse.ok) {
          throw new Error(
            profileResult.error?.message ??
              skillsResult.error?.message ??
              "Profil karier belum dapat dimuat.",
          );
        }

        const apiSkills = skillsResult.data?.skills ?? [];
        const evidenceCounts = await Promise.all(
          apiSkills.map(async (skill) => {
            const response = await fetch(`/api/evidences?skillId=${encodeURIComponent(skill.id)}`);
            if (!response.ok) return 0;
            const result = await readJson<EvidenceResponse>(response);
            return result.data?.total ?? 0;
          }),
        );

        if (!active) return;
        setProfile(profileResult.data?.profile ?? null);
        setSkills(apiSkills.map((skill, index) => toCareerSkill(skill, evidenceCounts[index] ?? 0)));
      } catch (requestError) {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Profil karier belum dapat dimuat.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWorkspace();
    return () => {
      active = false;
    };
  }, []);

  if (loading || error) {
    return (
      <div className={`career-profile-state${error ? " error" : ""}`} role={error ? "alert" : "status"}>
        {error ? <AlertCircle aria-hidden="true" size={22} /> : <LoaderCircle className="spin" aria-hidden="true" size={22} />}
        <strong>{error || "Memuat profil karier…"}</strong>
        {error ? <button type="button" onClick={() => window.location.reload()}>Coba lagi</button> : null}
      </div>
    );
  }

  return (
    <>
      <section className="career-profile-hero" aria-labelledby="profile-name">
        <ProfileIdentity
          fallbackName="Pengguna ApplyFit"
          summary="Identitas akunmu dan arah karier di bawah ini menjadi konteks untuk setiap analisis kesiapan."
        />
        <CareerDirectionEditor
          initialCareerField={profile?.careerField ?? ""}
          initialTargetRole={profile?.targetRole ?? ""}
        />
      </section>
      <SkillManager initialSkills={skills} />
    </>
  );
}

function toCareerSkill(skill: ApiSkill, evidenceCount: number): CareerSkill {
  const level = skill.level === "Mahir" || skill.level === "Menengah" || skill.level === "Dasar"
    ? skill.level
    : "Dasar";
  return {
    id: skill.id,
    name: skill.name,
    level,
    status: skill.status === "learning" ? "Dipelajari" : "Aktif",
    evidenceCount,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}
