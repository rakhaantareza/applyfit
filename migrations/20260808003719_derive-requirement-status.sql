ALTER TABLE public.job_postings
  ADD COLUMN location TEXT,
  ADD COLUMN work_arrangement TEXT;

REVOKE INSERT, UPDATE ON public.job_postings FROM authenticated;
GRANT INSERT (
  title,
  company,
  source,
  source_url,
  location,
  work_arrangement,
  raw_description
) ON public.job_postings TO authenticated;
GRANT UPDATE (
  title,
  company,
  source,
  source_url,
  location,
  work_arrangement,
  raw_description
) ON public.job_postings TO authenticated;

ALTER TABLE public.job_requirements
  DROP COLUMN status;

DROP TYPE public.requirement_status;

REVOKE INSERT, UPDATE ON public.job_requirements FROM authenticated;
GRANT INSERT (job_id, name, type, priority)
  ON public.job_requirements TO authenticated;
GRANT UPDATE (name, type, priority)
  ON public.job_requirements TO authenticated;

CREATE TYPE public.skill_status AS ENUM (
  'active',
  'learning'
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_user_id_idx
  ON public.profiles (user_id);

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status public.skill_status NOT NULL DEFAULT 'active',
  level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX skills_profile_id_idx
  ON public.skills (profile_id);

CREATE UNIQUE INDEX skills_profile_name_unique_idx
  ON public.skills (profile_id, LOWER(name));

ALTER TABLE public.evidences
  ADD CONSTRAINT evidences_profile_id_profiles_id_fk
  FOREIGN KEY (profile_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

CREATE TABLE public.skill_evidences (
  skill_id UUID NOT NULL
    REFERENCES public.skills(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL
    REFERENCES public.evidences(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (skill_id, evidence_id)
);

CREATE INDEX skill_evidences_evidence_id_idx
  ON public.skill_evidences (evidence_id);

CREATE TABLE public.requirement_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL
    REFERENCES public.job_requirements(id) ON DELETE CASCADE,
  skill_id UUID
    REFERENCES public.skills(id) ON DELETE SET NULL,
  user_id UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX requirement_mappings_user_id_idx
  ON public.requirement_mappings (user_id);

CREATE INDEX requirement_mappings_requirement_id_idx
  ON public.requirement_mappings (requirement_id);

CREATE INDEX requirement_mappings_skill_id_idx
  ON public.requirement_mappings (skill_id);

CREATE UNIQUE INDEX requirement_mappings_requirement_skill_user_idx
  ON public.requirement_mappings (requirement_id, skill_id, user_id)
  WHERE skill_id IS NOT NULL;

CREATE UNIQUE INDEX requirement_mappings_unmapped_user_idx
  ON public.requirement_mappings (requirement_id, user_id)
  WHERE skill_id IS NULL;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER requirement_mappings_updated_at
  BEFORE UPDATE ON public.requirement_mappings
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE FUNCTION public.is_profile_owner(profile_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = profile_uuid
      AND user_id = (SELECT auth.uid())
  );
$$;

CREATE FUNCTION public.is_skill_owner(skill_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.skills AS skill
    JOIN public.profiles AS profile
      ON profile.id = skill.profile_id
    WHERE skill.id = skill_uuid
      AND profile.user_id = (SELECT auth.uid())
  );
$$;

CREATE FUNCTION public.is_evidence_owner(evidence_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.evidences AS evidence
    JOIN public.profiles AS profile
      ON profile.id = evidence.profile_id
    WHERE evidence.id = evidence_uuid
      AND profile.user_id = (SELECT auth.uid())
  );
$$;

CREATE FUNCTION public.is_requirement_owner(requirement_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_requirements AS requirement
    JOIN public.job_postings AS job
      ON job.id = requirement.job_id
    WHERE requirement.id = requirement_uuid
      AND job.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_profile_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_skill_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_evidence_owner(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_requirement_owner(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_profile_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_skill_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_evidence_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_requirement_owner(UUID) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY profiles_delete_own
  ON public.profiles
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY skills_select_own
  ON public.skills
  FOR SELECT TO authenticated
  USING ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY skills_insert_own
  ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY skills_update_own
  ON public.skills
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_profile_owner(profile_id)))
  WITH CHECK ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY skills_delete_own
  ON public.skills
  FOR DELETE TO authenticated
  USING ((SELECT public.is_profile_owner(profile_id)));

DROP POLICY evidences_access_deferred ON public.evidences;

CREATE POLICY evidences_select_own
  ON public.evidences
  FOR SELECT TO authenticated
  USING ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY evidences_insert_own
  ON public.evidences
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY evidences_update_own
  ON public.evidences
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_profile_owner(profile_id)))
  WITH CHECK ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY evidences_delete_own
  ON public.evidences
  FOR DELETE TO authenticated
  USING ((SELECT public.is_profile_owner(profile_id)));

CREATE POLICY skill_evidences_select_own
  ON public.skill_evidences
  FOR SELECT TO authenticated
  USING (
    (SELECT public.is_skill_owner(skill_id))
    AND (SELECT public.is_evidence_owner(evidence_id))
  );

CREATE POLICY skill_evidences_insert_own
  ON public.skill_evidences
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_skill_owner(skill_id))
    AND (SELECT public.is_evidence_owner(evidence_id))
  );

CREATE POLICY skill_evidences_delete_own
  ON public.skill_evidences
  FOR DELETE TO authenticated
  USING (
    (SELECT public.is_skill_owner(skill_id))
    AND (SELECT public.is_evidence_owner(evidence_id))
  );

CREATE POLICY requirement_mappings_select_own
  ON public.requirement_mappings
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND (SELECT public.is_requirement_owner(requirement_id))
    AND (
      skill_id IS NULL
      OR (SELECT public.is_skill_owner(skill_id))
    )
  );

CREATE POLICY requirement_mappings_insert_own
  ON public.requirement_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT public.is_requirement_owner(requirement_id))
    AND (
      skill_id IS NULL
      OR (SELECT public.is_skill_owner(skill_id))
    )
  );

CREATE POLICY requirement_mappings_update_own
  ON public.requirement_mappings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT public.is_requirement_owner(requirement_id))
    AND (
      skill_id IS NULL
      OR (SELECT public.is_skill_owner(skill_id))
    )
  );

CREATE POLICY requirement_mappings_delete_own
  ON public.requirement_mappings
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT USAGE ON TYPE public.skill_status TO authenticated;

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.skills FROM anon, authenticated;
REVOKE ALL ON public.evidences FROM anon, authenticated;
REVOKE ALL ON public.skill_evidences FROM anon, authenticated;
REVOKE ALL ON public.requirement_mappings FROM anon, authenticated;

GRANT SELECT, DELETE ON public.profiles TO authenticated;
GRANT INSERT (target_role) ON public.profiles TO authenticated;
GRANT UPDATE (target_role) ON public.profiles TO authenticated;

GRANT SELECT, DELETE ON public.skills TO authenticated;
GRANT INSERT (profile_id, name, status, level)
  ON public.skills TO authenticated;
GRANT UPDATE (name, status, level)
  ON public.skills TO authenticated;

GRANT SELECT, DELETE ON public.evidences TO authenticated;
GRANT INSERT (profile_id, title, type, url, description)
  ON public.evidences TO authenticated;
GRANT UPDATE (title, type, url, description)
  ON public.evidences TO authenticated;

GRANT SELECT, INSERT, DELETE
  ON public.skill_evidences TO authenticated;

GRANT SELECT, DELETE ON public.requirement_mappings TO authenticated;
GRANT INSERT (requirement_id, skill_id)
  ON public.requirement_mappings TO authenticated;
GRANT UPDATE (skill_id)
  ON public.requirement_mappings TO authenticated;
