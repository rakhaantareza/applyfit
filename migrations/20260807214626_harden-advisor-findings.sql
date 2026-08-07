DROP POLICY job_requirements_select_own ON public.job_requirements;
DROP POLICY job_requirements_insert_own ON public.job_requirements;
DROP POLICY job_requirements_update_own ON public.job_requirements;
DROP POLICY job_requirements_delete_own ON public.job_requirements;

DROP FUNCTION public.is_job_owner(UUID);

CREATE POLICY job_requirements_select_own
  ON public.job_requirements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings AS jobs
      WHERE jobs.id = job_requirements.job_id
        AND jobs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY job_requirements_insert_own
  ON public.job_requirements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_postings AS jobs
      WHERE jobs.id = job_requirements.job_id
        AND jobs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY job_requirements_update_own
  ON public.job_requirements
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings AS jobs
      WHERE jobs.id = job_requirements.job_id
        AND jobs.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_postings AS jobs
      WHERE jobs.id = job_requirements.job_id
        AND jobs.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY job_requirements_delete_own
  ON public.job_requirements
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings AS jobs
      WHERE jobs.id = job_requirements.job_id
        AND jobs.user_id = (SELECT auth.uid())
    )
  );

-- Keep evidence inaccessible until the Profile feature adds ownership.
-- This explicit deny policy documents the intentional closed state.
CREATE POLICY evidences_access_deferred
  ON public.evidences
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
