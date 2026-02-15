-- Phase 7.1 : Remplacer "Allow all" par "Authenticated only" sur les tables métier.
-- Sans ça, l'anon key permet d'accéder aux données sans être connecté.

-- Clients
DROP POLICY IF EXISTS "Allow all for clients" ON public.clients;
CREATE POLICY "Authenticated users full access clients"
  ON public.clients FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Contacts
DROP POLICY IF EXISTS "Allow all for contacts" ON public.contacts;
CREATE POLICY "Authenticated users full access contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Client links
DROP POLICY IF EXISTS "Allow all for client_links" ON public.client_links;
CREATE POLICY "Authenticated users full access client_links"
  ON public.client_links FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Documents
DROP POLICY IF EXISTS "Allow all for documents" ON public.documents;
CREATE POLICY "Authenticated users full access documents"
  ON public.documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Deliverables
DROP POLICY IF EXISTS "Allow all for deliverables" ON public.deliverables;
CREATE POLICY "Authenticated users full access deliverables"
  ON public.deliverables FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Calls
DROP POLICY IF EXISTS "Allow all for calls" ON public.calls;
CREATE POLICY "Authenticated users full access calls"
  ON public.calls FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
