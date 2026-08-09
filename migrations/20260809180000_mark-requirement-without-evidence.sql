CREATE OR REPLACE FUNCTION public.mark_requirement_without_evidence(
  target_job_id UUID,
  target_requirement_id UUID
)
RETURNS SETOF public.requirement_mappings
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  marker public.requirement_mappings%ROWTYPE;
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

  PERFORM requirement.id
  FROM public.job_requirements AS requirement
  WHERE requirement.id = target_requirement_id
    AND requirement.job_id = target_job_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requirement was not found.' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.requirement_mappings AS mapping
  WHERE mapping.requirement_id = target_requirement_id
    AND mapping.user_id = auth.uid();

  INSERT INTO public.requirement_mappings (requirement_id, skill_id)
  VALUES (target_requirement_id, NULL)
  RETURNING * INTO marker;

  RETURN NEXT marker;
END;
$$;

ALTER FUNCTION public.mark_requirement_without_evidence(UUID, UUID)
  OWNER TO project_admin;

REVOKE ALL ON FUNCTION public.mark_requirement_without_evidence(UUID, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_requirement_without_evidence(UUID, UUID)
  TO authenticated;
