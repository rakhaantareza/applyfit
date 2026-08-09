CREATE OR REPLACE FUNCTION public.split_job_requirement(
  target_job_id UUID,
  source_requirement_id UUID,
  split_names TEXT[]
)
RETURNS SETOF public.job_requirements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  source_requirement public.job_requirements%ROWTYPE;
  split_name TEXT;
  split_requirement public.job_requirements%ROWTYPE;
  normalized_names TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.job_postings AS job
    WHERE job.id = target_job_id
      AND job.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Job was not found.' USING ERRCODE = 'P0002';
  END IF;

  SELECT ARRAY_AGG(BTRIM(name) ORDER BY position)
  INTO normalized_names
  FROM UNNEST(split_names) WITH ORDINALITY AS part(name, position);

  IF COALESCE(CARDINALITY(normalized_names), 0) < 2
    OR CARDINALITY(normalized_names) > 20
    OR EXISTS (
      SELECT 1 FROM UNNEST(normalized_names) AS candidate(name) WHERE name = ''
    )
    OR (
      SELECT COUNT(DISTINCT LOWER(name))
      FROM UNNEST(normalized_names) AS candidate(name)
    )
      <> CARDINALITY(normalized_names)
  THEN
    RAISE EXCEPTION 'Provide between two and twenty unique requirement names.'
      USING ERRCODE = '22023';
  END IF;

  SELECT requirement.*
  INTO source_requirement
  FROM public.job_requirements AS requirement
  WHERE requirement.id = source_requirement_id
    AND requirement.job_id = target_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requirement was not found.' USING ERRCODE = 'P0002';
  END IF;

  FOREACH split_name IN ARRAY normalized_names LOOP
    INSERT INTO public.job_requirements (job_id, name, type, priority)
    VALUES (
      target_job_id,
      split_name,
      source_requirement.type,
      source_requirement.priority
    )
    RETURNING * INTO split_requirement;

    INSERT INTO public.requirement_mappings (requirement_id, skill_id)
    SELECT split_requirement.id, mapping.skill_id
    FROM public.requirement_mappings AS mapping
    WHERE mapping.requirement_id = source_requirement_id
    ON CONFLICT DO NOTHING;

    RETURN NEXT split_requirement;
  END LOOP;

  DELETE FROM public.job_requirements AS requirement
  WHERE requirement.id = source_requirement_id
    AND requirement.job_id = target_job_id;
END;
$$;

ALTER FUNCTION public.split_job_requirement(UUID, UUID, TEXT[])
  OWNER TO project_admin;

REVOKE ALL ON FUNCTION public.split_job_requirement(UUID, UUID, TEXT[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.split_job_requirement(UUID, UUID, TEXT[])
  TO authenticated;
