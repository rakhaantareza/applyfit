ALTER TABLE public.job_requirements
  ADD COLUMN reviewed_without_evidence BOOLEAN NOT NULL DEFAULT FALSE;

GRANT UPDATE (reviewed_without_evidence)
  ON public.job_requirements TO authenticated;

CREATE FUNCTION public.clear_reviewed_without_evidence_on_mapping()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.job_requirements AS requirement
  SET reviewed_without_evidence = FALSE
  WHERE requirement.id = NEW.requirement_id
    AND requirement.reviewed_without_evidence;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.clear_reviewed_without_evidence_on_mapping()
  OWNER TO project_admin;

REVOKE ALL ON FUNCTION public.clear_reviewed_without_evidence_on_mapping()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER requirement_mappings_clear_reviewed_without_evidence
  BEFORE INSERT ON public.requirement_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_reviewed_without_evidence_on_mapping();

CREATE FUNCTION public.set_requirement_without_evidence(
  target_job_id UUID,
  target_requirement_id UUID,
  reviewed_without_evidence_value BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
  END IF;

  PERFORM requirement.id
  FROM public.job_requirements AS requirement
  JOIN public.job_postings AS job
    ON job.id = requirement.job_id
  WHERE requirement.id = target_requirement_id
    AND requirement.job_id = target_job_id
    AND requirement.type IN ('skill', 'tool')
    AND job.user_id = auth.uid()
  FOR UPDATE OF requirement;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requirement was not found.' USING ERRCODE = 'P0002';
  END IF;

  IF reviewed_without_evidence_value THEN
    DELETE FROM public.requirement_mappings AS mapping
    WHERE mapping.requirement_id = target_requirement_id
      AND mapping.user_id = auth.uid();
  END IF;

  UPDATE public.job_requirements AS requirement
  SET reviewed_without_evidence = reviewed_without_evidence_value
  WHERE requirement.id = target_requirement_id
    AND requirement.job_id = target_job_id;

  RETURN reviewed_without_evidence_value;
END;
$$;

ALTER FUNCTION public.set_requirement_without_evidence(UUID, UUID, BOOLEAN)
  OWNER TO project_admin;

REVOKE ALL ON FUNCTION public.set_requirement_without_evidence(UUID, UUID, BOOLEAN)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_requirement_without_evidence(UUID, UUID, BOOLEAN)
  TO authenticated;
