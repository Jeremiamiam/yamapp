-- Projects can be scheduled on the timeline (like calls)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
COMMENT ON COLUMN public.projects.scheduled_at IS 'Date de planification sur la timeline';
