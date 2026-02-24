-- Table pour stocker les overrides de prompts des agents IA
-- Permet l'édition des prompts depuis le wiki sans redéploiement

CREATE TABLE public.agent_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  style TEXT, -- NULL pour les agents sans variante de style
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index unique : un seul override par (agent_id, style)
CREATE UNIQUE INDEX agent_prompts_unique ON public.agent_prompts(agent_id, COALESCE(style, ''));

-- Trigger pour auto-update de updated_at
CREATE OR REPLACE FUNCTION public.update_agent_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_prompts_updated_at
  BEFORE UPDATE ON public.agent_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_prompts_updated_at();

-- RLS
ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read agent_prompts"
  ON public.agent_prompts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert agent_prompts"
  ON public.agent_prompts FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update agent_prompts"
  ON public.agent_prompts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agent_prompts"
  ON public.agent_prompts FOR DELETE
  TO authenticated USING (true);

COMMENT ON TABLE public.agent_prompts IS 'Overrides de system prompts pour les agents IA — éditable depuis le wiki';
COMMENT ON COLUMN public.agent_prompts.agent_id IS 'Identifiant unique de l''agent (ex: strategist, web-architect)';
COMMENT ON COLUMN public.agent_prompts.feature IS 'Feature d''appartenance (creative-board, web-brief, plaud, layout, retroplanning)';
COMMENT ON COLUMN public.agent_prompts.style IS 'Variante de style pour Creative Board (corporate, audacieux, subversif) ou NULL';
COMMENT ON COLUMN public.agent_prompts.content IS 'Contenu du system prompt personnalisé';
