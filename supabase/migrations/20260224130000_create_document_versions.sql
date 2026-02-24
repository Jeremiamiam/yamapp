-- Table d'historique de versions pour les documents
-- Fonctionne pour tous les types : docs client (project_id IS NULL) et docs projet (project_id SET)
-- Le ON DELETE CASCADE garantit que la suppression d'un document purge ses versions

CREATE TABLE IF NOT EXISTS public.document_versions (
  id text PRIMARY KEY,
  document_id text NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  label text,                    -- Label optionnel : "V1 - structure initiale"
  content text NOT NULL,         -- Snapshot du content JSON au moment de la sauvegarde
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT document_versions_unique_number UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);

-- RLS : même politique que documents (tout auth)
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for document_versions"
  ON public.document_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
