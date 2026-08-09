CREATE OR REPLACE FUNCTION public.merge_job_requirements(
  target_job_id UUID,
  source_requirement_ids UUID[],
  merged_name TEXT DEFAULT NULL
)
RETURNS SETOF public.job_requirements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  normalized_ids UUID[];
  selected_count INTEGER;
  classification_count INTEGER;
  combined_name TEXT;
  merged_requirement public.job_requirements%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
  END IF;

  SELECT ARRAY_AGG(DISTINCT requirement_id)
  INTO normalized_ids
  FROM UNNEST(source_requirement_ids) AS requirement_id;

  IF COALESCE(CARDINALITY(normalized_ids), 0) < 2 THEN
    RAISE EXCEPTION 'At least two unique requirements are required.'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.job_postings AS job
    WHERE job.id = target_job_id
      AND job.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Job was not found.' USING ERRCODE = 'P0002';
  END IF;

  PERFORM requirement.id
  FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
    AND requirement.id = ANY(normalized_ids)
  FOR UPDATE;

  SELECT
    COUNT(*),
    COUNT(DISTINCT (requirement.type, requirement.priority)),
    STRING_AGG(requirement.name, '; ' ORDER BY requirement.created_at, requirement.id)
  INTO selected_count, classification_count, combined_name
  FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
    AND requirement.id = ANY(normalized_ids);

  IF selected_count <> CARDINALITY(normalized_ids) THEN
    RAISE EXCEPTION 'One or more requirements were not found.'
      USING ERRCODE = 'P0002';
  END IF;

  IF classification_count <> 1 THEN
    RAISE EXCEPTION 'Requirements must share the same type and priority.'
      USING ERRCODE = '23514';
  END IF;

  combined_name := COALESCE(NULLIF(BTRIM(merged_name), ''), combined_name);

  INSERT INTO public.job_requirements (job_id, name, type, priority)
  SELECT target_job_id, combined_name, requirement.type, requirement.priority
  FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
    AND requirement.id = normalized_ids[1]
  RETURNING * INTO merged_requirement;

  INSERT INTO public.requirement_mappings (requirement_id, skill_id)
  SELECT DISTINCT merged_requirement.id, mapping.skill_id
  FROM public.requirement_mappings AS mapping
  WHERE mapping.requirement_id = ANY(normalized_ids)
  ON CONFLICT DO NOTHING;

  DELETE FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
    AND requirement.id = ANY(normalized_ids);

  RETURN NEXT merged_requirement;
END;
$$;

ALTER FUNCTION public.merge_job_requirements(UUID, UUID[], TEXT)
  OWNER TO project_admin;

REVOKE ALL ON FUNCTION public.merge_job_requirements(UUID, UUID[], TEXT)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_job_requirements(UUID, UUID[], TEXT)
  TO authenticated;
