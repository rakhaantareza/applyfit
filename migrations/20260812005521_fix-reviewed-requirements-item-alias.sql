CREATE OR REPLACE FUNCTION public.save_reviewed_job_requirements(
  target_job_id UUID,
  reviewed_requirements JSONB
)
RETURNS SETOF public.job_requirements
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  reviewed_item JSONB;
  item_id UUID;
  provided_ids UUID[];
  provided_id_count INTEGER;
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

  IF JSONB_TYPEOF(reviewed_requirements) <> 'array'
    OR JSONB_ARRAY_LENGTH(reviewed_requirements) > 200
  THEN
    RAISE EXCEPTION 'Reviewed requirements must be an array of at most 200 items.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSONB_ARRAY_ELEMENTS(reviewed_requirements) AS entry(item)
    WHERE JSONB_TYPEOF(entry.item) <> 'object'
      OR NULLIF(BTRIM(entry.item->>'name'), '') IS NULL
      OR entry.item->>'type' NOT IN ('skill', 'tool', 'education', 'experience')
      OR entry.item->>'priority' NOT IN ('required', 'preferred')
      OR entry.item ? 'status'
  ) THEN
    RAISE EXCEPTION 'A reviewed requirement is invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT
    ARRAY_AGG((entry.item->>'id')::UUID),
    COUNT(*)
  INTO provided_ids, provided_id_count
  FROM JSONB_ARRAY_ELEMENTS(reviewed_requirements) AS entry(item)
  WHERE NULLIF(entry.item->>'id', '') IS NOT NULL;

  IF provided_id_count <> (
    SELECT COUNT(DISTINCT entry.item->>'id')
    FROM JSONB_ARRAY_ELEMENTS(reviewed_requirements) AS entry(item)
    WHERE NULLIF(entry.item->>'id', '') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Reviewed requirement IDs must be unique.' USING ERRCODE = '22023';
  END IF;

  PERFORM requirement.id
  FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
  FOR UPDATE;

  IF provided_id_count > 0 AND (
    SELECT COUNT(*)
    FROM public.job_requirements AS requirement
    WHERE requirement.job_id = target_job_id
      AND requirement.id = ANY(provided_ids)
  ) <> provided_id_count THEN
    RAISE EXCEPTION 'One or more requirements were not found.' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
    AND (
      provided_ids IS NULL
      OR NOT (requirement.id = ANY(provided_ids))
    );

  FOR reviewed_item IN
    SELECT entry.item
    FROM JSONB_ARRAY_ELEMENTS(reviewed_requirements) WITH ORDINALITY AS entry(item, position)
    ORDER BY entry.position
  LOOP
    item_id := NULLIF(reviewed_item->>'id', '')::UUID;
    IF item_id IS NULL THEN
      INSERT INTO public.job_requirements (job_id, name, type, priority)
      VALUES (
        target_job_id,
        BTRIM(reviewed_item->>'name'),
        (reviewed_item->>'type')::public.requirement_type,
        (reviewed_item->>'priority')::public.requirement_priority
      );
    ELSE
      UPDATE public.job_requirements AS requirement
      SET
        name = BTRIM(reviewed_item->>'name'),
        type = (reviewed_item->>'type')::public.requirement_type,
        priority = (reviewed_item->>'priority')::public.requirement_priority
      WHERE requirement.id = item_id
        AND requirement.job_id = target_job_id;
    END IF;
  END LOOP;

  RETURN QUERY
  SELECT requirement.*
  FROM public.job_requirements AS requirement
  WHERE requirement.job_id = target_job_id
  ORDER BY requirement.created_at, requirement.id;
END;
$$;

ALTER FUNCTION public.save_reviewed_job_requirements(UUID, JSONB)
  OWNER TO project_admin;

REVOKE ALL ON FUNCTION public.save_reviewed_job_requirements(UUID, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_reviewed_job_requirements(UUID, JSONB)
  TO authenticated;
