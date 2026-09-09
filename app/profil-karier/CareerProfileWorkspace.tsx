"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "../components/ActionControl";
import { WorkspaceLoadingState } from "../components/WorkspaceLoadingState";
import { CareerDirectionEditor } from "./CareerDirectionEditor";
import { SkillManager, type CareerSkill } from "./SkillManager";
import {
  EMPTY_CAREER_CATALOG,
  type CareerCatalog,
} from "./catalog-types";

type CareerProfile = {
  id: string;
  targetRole: string;
  targetRoleId: string | null;
  careerField: string;
  careerFieldId: string | null;
};

type ApiSkill = {
  id: string;
  name: string;
  catalogSkillId: string | null;
  status: "active" | "learning";
  level: string | null;
  evidenceCount?: number;
};

type ProfileWorkspaceResponse = {
  data?: {
    profile: CareerProfile | null;
    skills: ApiSkill[];
    catalog: CareerCatalog;
  };
  error?: { message?: string };
};

export function CareerProfileWorkspace() {
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [skills, setSkills] = useState<CareerSkill[]>([]);
  const [catalog, setCatalog] = useState<CareerCatalog>(EMPTY_CAREER_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const response = await fetch("/api/workspace?scope=profile", { cache: "no-store" });
        const result = await readJson<ProfileWorkspaceResponse>(response);
        if (!response.ok || !result.data) {
          throw new Error(result.error?.message ?? "Profil karier belum dapat dimuat.");
        }
        const apiSkills = result.data.skills;

        if (!active) return;
        setProfile(result.data.profile);
        setSkills(apiSkills.map((skill) => toCareerSkill(skill)));
        setCatalog(result.data.catalog ?? EMPTY_CAREER_CATALOG);
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

  if (loading) return <WorkspaceLoadingState />;

  if (error) {
    return (
      <div className="career-profile-state error" role="alert">
        <AlertCircle aria-hidden="true" size={22} />
        <strong>{error}</strong>
        <ActionButton size="compact" variant="secondary" type="button" onClick={() => window.location.reload()}>Coba lagi</ActionButton>
      </div>
    );
  }

  return (
    <>
      <CareerDirectionEditor
        initialCareerField={profile?.careerField ?? ""}
        initialCareerFieldId={profile?.careerFieldId ?? null}
        initialTargetRole={profile?.targetRole ?? ""}
        initialTargetRoleId={profile?.targetRoleId ?? null}
        catalog={catalog}
        onSaved={(direction) => {
          setProfile((current) => ({
            id: current?.id ?? "",
            ...direction,
          }));
        }}
      />
      <SkillManager
        initialSkills={skills}
        catalog={catalog}
        careerFieldId={profile?.careerFieldId ?? null}
        targetRoleId={profile?.targetRoleId ?? null}
      />
    </>
  );
}

function toCareerSkill(skill: ApiSkill): CareerSkill {
  const level = skill.level === "Mahir" || skill.level === "Menengah" || skill.level === "Dasar"
    ? skill.level
    : "Dasar";
  return {
    id: skill.id,
    name: skill.name,
    catalogSkillId: skill.catalogSkillId,
    level,
    status: skill.status === "learning" ? "Dipelajari" : "Aktif",
    evidenceCount: skill.evidenceCount ?? 0,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return {} as T;
  }
}
