-- YAM Dashboard — schéma initial (aligné sur seed.json)
-- À exécuter dans l’éditeur SQL du projet Supabase après création du projet.

-- Team (membres de l’équipe)
CREATE TABLE IF NOT EXISTS public.team (
  id text PRIMARY KEY,
  name text NOT NULL,
  initials text NOT NULL,
  role text NOT NULL CHECK (role IN ('founder', 'employee', 'freelance')),
  color text NOT NULL,
  email text
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('prospect', 'client')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contacts (liés à un client)
CREATE TABLE IF NOT EXISTS public.contacts (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  email text NOT NULL,
  phone text
);

-- Liens externes (Figma, sites, etc.)
CREATE TABLE IF NOT EXISTS public.client_links (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL
);

-- Documents (briefs, reports, notes)
CREATE TABLE IF NOT EXISTS public.documents (
  id text PRIMARY KEY,
  client_id text NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('brief', 'report', 'note')),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Livrables
CREATE TABLE IF NOT EXISTS public.deliverables (
  id text PRIMARY KEY,
  client_id text REFERENCES public.clients(id) ON DELETE SET NULL,
  name text NOT NULL,
  due_date timestamptz,
  type text NOT NULL CHECK (type IN ('creative', 'document', 'other')),
  status text NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed')),
  assignee_id text REFERENCES public.team(id) ON DELETE SET NULL,
  category text CHECK (category IN ('print', 'digital', 'other')),
  delivered_at timestamptz,
  external_contractor text,
  notes text,
  prix_facture numeric,
  cout_sous_traitance numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Appels / réunions
CREATE TABLE IF NOT EXISTS public.calls (
  id text PRIMARY KEY,
  client_id text REFERENCES public.clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  scheduled_at timestamptz,
  duration integer NOT NULL DEFAULT 30,
  assignee_id text REFERENCES public.team(id) ON DELETE SET NULL,
  call_type text CHECK (call_type IN ('call', 'presentation')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Compta mensuelle (agrégats)
CREATE TABLE IF NOT EXISTS public.compta_monthly (
  id bigserial PRIMARY KEY,
  month text NOT NULL,
  year integer NOT NULL,
  entrees numeric NOT NULL DEFAULT 0,
  sorties numeric NOT NULL DEFAULT 0,
  solde_cumule numeric NOT NULL DEFAULT 0,
  UNIQUE(month, year)
);

-- Index pour les jointures fréquentes
CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_links_client_id ON public.client_links(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_client_id ON public.deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date ON public.deliverables(due_date);
CREATE INDEX IF NOT EXISTS idx_calls_client_id ON public.calls(client_id);
CREATE INDEX IF NOT EXISTS idx_calls_scheduled_at ON public.calls(scheduled_at);

-- RLS : activé mais politique permissive pour l’instant (tout le monde peut lire/écrire)
-- À durcir quand Auth sera en place.
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_monthly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for team" ON public.team FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for client_links" ON public.client_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for deliverables" ON public.deliverables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for calls" ON public.calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for compta_monthly" ON public.compta_monthly FOR ALL USING (true) WITH CHECK (true);
