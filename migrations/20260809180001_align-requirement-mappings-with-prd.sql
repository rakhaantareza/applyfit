-- Requirement status is derived from real requirement-to-skill mappings.
-- A missing requirement therefore has no mapping row; an empty skill marker is
-- not part of the latest ApplyFit data model.
DELETE FROM public.requirement_mappings
WHERE skill_id IS NULL;

DROP FUNCTION IF EXISTS public.mark_requirement_without_evidence(UUID, UUID);

DROP INDEX IF EXISTS public.requirement_mappings_unmapped_user_idx;
DROP INDEX IF EXISTS public.requirement_mappings_requirement_skill_user_idx;

ALTER TABLE public.requirement_mappings
  DROP CONSTRAINT IF EXISTS requirement_mappings_skill_id_fkey;

ALTER TABLE public.requirement_mappings
  ALTER COLUMN skill_id SET NOT NULL;

ALTER TABLE public.requirement_mappings
  ADD CONSTRAINT requirement_mappings_skill_id_fkey
  FOREIGN KEY (skill_id)
  REFERENCES public.skills(id)
  ON DELETE CASCADE;

CREATE UNIQUE INDEX requirement_mappings_requirement_skill_user_idx
  ON public.requirement_mappings (requirement_id, skill_id, user_id);
