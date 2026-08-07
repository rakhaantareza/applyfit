CREATE TYPE public.requirement_type AS ENUM (
  'skill',
  'tool',
  'education',
  'experience'
);

CREATE TYPE public.requirement_priority AS ENUM (
  'required',
  'preferred'
);

CREATE TYPE public.requirement_status AS ENUM (
  'proven',
  'partial',
  'learning',
  'missing'
);

CREATE TYPE public.evidence_type AS ENUM (
  'project',
  'cert',
  'work',
  'internship',
  'github',
  'portfolio'
);

CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source TEXT,
  source_url TEXT,
  raw_description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX job_postings_user_id_idx
  ON public.job_postings (user_id);

CREATE INDEX job_postings_user_created_at_idx
  ON public.job_postings (user_id, created_at DESC);

CREATE TABLE public.job_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL
    REFERENCES public.job_postings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.requirement_type NOT NULL,
  priority public.requirement_priority NOT NULL,
  status public.requirement_status NOT NULL DEFAULT 'missing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX job_requirements_job_id_idx
  ON public.job_requirements (job_id);

CREATE INDEX job_requirements_job_type_idx
  ON public.job_requirements (job_id, type);

-- Evidence ownership will be completed when the Profile feature introduces
-- its parent table. Until then this table remains inaccessible to app roles.
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  title TEXT NOT NULL,
  type public.evidence_type NOT NULL,
  url TEXT,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX evidences_profile_id_idx
  ON public.evidences (profile_id);

CREATE INDEX evidences_profile_type_idx
  ON public.evidences (profile_id, type);

CREATE TRIGGER job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER job_requirements_updated_at
  BEFORE UPDATE ON public.job_requirements
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER evidences_updated_at
  BEFORE UPDATE ON public.evidences
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE FUNCTION public.is_job_owner(job_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_postings
    WHERE id = job_uuid
      AND user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_job_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_job_owner(UUID) TO authenticated;

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_postings_select_own
  ON public.job_postings
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY job_postings_insert_own
  ON public.job_postings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY job_postings_update_own
  ON public.job_postings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY job_postings_delete_own
  ON public.job_postings
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY job_requirements_select_own
  ON public.job_requirements
  FOR SELECT TO authenticated
  USING ((SELECT public.is_job_owner(job_id)));

CREATE POLICY job_requirements_insert_own
  ON public.job_requirements
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_job_owner(job_id)));

CREATE POLICY job_requirements_update_own
  ON public.job_requirements
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_job_owner(job_id)))
  WITH CHECK ((SELECT public.is_job_owner(job_id)));

CREATE POLICY job_requirements_delete_own
  ON public.job_requirements
  FOR DELETE TO authenticated
  USING ((SELECT public.is_job_owner(job_id)));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON TYPE public.requirement_type TO authenticated;
GRANT USAGE ON TYPE public.requirement_priority TO authenticated;
GRANT USAGE ON TYPE public.requirement_status TO authenticated;

REVOKE ALL ON public.job_postings FROM anon, authenticated;
REVOKE ALL ON public.job_requirements FROM anon, authenticated;
REVOKE ALL ON public.evidences FROM anon, authenticated;

GRANT SELECT, DELETE ON public.job_postings TO authenticated;
GRANT INSERT (title, company, source, source_url, raw_description)
  ON public.job_postings TO authenticated;
GRANT UPDATE (title, company, source, source_url, raw_description)
  ON public.job_postings TO authenticated;

GRANT SELECT, DELETE ON public.job_requirements TO authenticated;
GRANT INSERT (job_id, name, type, priority, status)
  ON public.job_requirements TO authenticated;
GRANT UPDATE (name, type, priority, status)
  ON public.job_requirements TO authenticated;
