DROP POLICY skills_select_own ON public.skills;
DROP POLICY skills_insert_own ON public.skills;
DROP POLICY skills_update_own ON public.skills;
DROP POLICY skills_delete_own ON public.skills;

DROP POLICY evidences_select_own ON public.evidences;
DROP POLICY evidences_insert_own ON public.evidences;
DROP POLICY evidences_update_own ON public.evidences;
DROP POLICY evidences_delete_own ON public.evidences;

DROP POLICY skill_evidences_select_own ON public.skill_evidences;
DROP POLICY skill_evidences_insert_own ON public.skill_evidences;
DROP POLICY skill_evidences_delete_own ON public.skill_evidences;

DROP POLICY requirement_mappings_select_own ON public.requirement_mappings;
DROP POLICY requirement_mappings_insert_own ON public.requirement_mappings;
DROP POLICY requirement_mappings_update_own ON public.requirement_mappings;
DROP POLICY requirement_mappings_delete_own ON public.requirement_mappings;

DROP FUNCTION public.is_profile_owner(UUID);
DROP FUNCTION public.is_skill_owner(UUID);
DROP FUNCTION public.is_evidence_owner(UUID);
DROP FUNCTION public.is_requirement_owner(UUID);

CREATE POLICY skills_select_own
  ON public.skills
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = skills.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY skills_insert_own
  ON public.skills
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = skills.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY skills_update_own
  ON public.skills
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = skills.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = skills.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY skills_delete_own
  ON public.skills
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = skills.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY evidences_select_own
  ON public.evidences
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = evidences.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY evidences_insert_own
  ON public.evidences
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = evidences.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY evidences_update_own
  ON public.evidences
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = evidences.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = evidences.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY evidences_delete_own
  ON public.evidences
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = evidences.profile_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY skill_evidences_select_own
  ON public.skill_evidences
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.skills AS skill
      JOIN public.profiles AS profile
        ON profile.id = skill.profile_id
      WHERE skill.id = skill_evidences.skill_id
        AND profile.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.evidences AS evidence
      JOIN public.profiles AS profile
        ON profile.id = evidence.profile_id
      WHERE evidence.id = skill_evidences.evidence_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY skill_evidences_insert_own
  ON public.skill_evidences
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.skills AS skill
      JOIN public.profiles AS profile
        ON profile.id = skill.profile_id
      WHERE skill.id = skill_evidences.skill_id
        AND profile.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.evidences AS evidence
      JOIN public.profiles AS profile
        ON profile.id = evidence.profile_id
      WHERE evidence.id = skill_evidences.evidence_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY skill_evidences_delete_own
  ON public.skill_evidences
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.skills AS skill
      JOIN public.profiles AS profile
        ON profile.id = skill.profile_id
      WHERE skill.id = skill_evidences.skill_id
        AND profile.user_id = (SELECT auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM public.evidences AS evidence
      JOIN public.profiles AS profile
        ON profile.id = evidence.profile_id
      WHERE evidence.id = skill_evidences.evidence_id
        AND profile.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY requirement_mappings_select_own
  ON public.requirement_mappings
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.job_requirements AS requirement
      JOIN public.job_postings AS job
        ON job.id = requirement.job_id
      WHERE requirement.id = requirement_mappings.requirement_id
        AND job.user_id = (SELECT auth.uid())
    )
    AND (
      skill_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.skills AS skill
        JOIN public.profiles AS profile
          ON profile.id = skill.profile_id
        WHERE skill.id = requirement_mappings.skill_id
          AND profile.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY requirement_mappings_insert_own
  ON public.requirement_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.job_requirements AS requirement
      JOIN public.job_postings AS job
        ON job.id = requirement.job_id
      WHERE requirement.id = requirement_mappings.requirement_id
        AND job.user_id = (SELECT auth.uid())
    )
    AND (
      skill_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.skills AS skill
        JOIN public.profiles AS profile
          ON profile.id = skill.profile_id
        WHERE skill.id = requirement_mappings.skill_id
          AND profile.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY requirement_mappings_update_own
  ON public.requirement_mappings
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.job_requirements AS requirement
      JOIN public.job_postings AS job
        ON job.id = requirement.job_id
      WHERE requirement.id = requirement_mappings.requirement_id
        AND job.user_id = (SELECT auth.uid())
    )
    AND (
      skill_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.skills AS skill
        JOIN public.profiles AS profile
          ON profile.id = skill.profile_id
        WHERE skill.id = requirement_mappings.skill_id
          AND profile.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.job_requirements AS requirement
      JOIN public.job_postings AS job
        ON job.id = requirement.job_id
      WHERE requirement.id = requirement_mappings.requirement_id
        AND job.user_id = (SELECT auth.uid())
    )
    AND (
      skill_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.skills AS skill
        JOIN public.profiles AS profile
          ON profile.id = skill.profile_id
        WHERE skill.id = requirement_mappings.skill_id
          AND profile.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY requirement_mappings_delete_own
  ON public.requirement_mappings
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.job_requirements AS requirement
      JOIN public.job_postings AS job
        ON job.id = requirement.job_id
      WHERE requirement.id = requirement_mappings.requirement_id
        AND job.user_id = (SELECT auth.uid())
    )
  );
