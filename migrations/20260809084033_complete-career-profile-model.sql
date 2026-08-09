ALTER TABLE public.profiles
  ADD COLUMN career_field TEXT NOT NULL DEFAULT '';

GRANT INSERT (career_field)
  ON public.profiles TO authenticated;

GRANT UPDATE (career_field)
  ON public.profiles TO authenticated;
