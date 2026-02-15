-- Phase 7.2: Admin vs Member — table user_roles + RLS compta (admins only)
-- Les membres voient tout sauf Compta et les champs prix. Les admins ont accès total.

-- 1. Table user_roles (2 rôles: admin, member)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  team_member_id text REFERENCES public.team(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_id ON public.user_roles(id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. Remplir user_roles depuis team (auth_user_id + app_role → admin/member)
INSERT INTO public.user_roles (id, email, role, team_member_id)
SELECT
  t.auth_user_id,
  COALESCE(t.email, ''),
  CASE WHEN t.app_role = 'admin' THEN 'admin' ELSE 'member' END,
  t.id
FROM public.team t
WHERE t.auth_user_id IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  team_member_id = EXCLUDED.team_member_id;

-- 3. Trigger: à chaque nouvel utilisateur dans team (avec auth_user_id), créer ligne user_roles
CREATE OR REPLACE FUNCTION public.sync_team_to_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (id, email, role, team_member_id)
    VALUES (
      NEW.auth_user_id,
      COALESCE(NEW.email, ''),
      CASE WHEN NEW.app_role = 'admin' THEN 'admin' ELSE 'member' END,
      NEW.id
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      team_member_id = EXCLUDED.team_member_id;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS sync_team_to_user_roles_trigger ON public.team;
CREATE TRIGGER sync_team_to_user_roles_trigger
  AFTER INSERT OR UPDATE OF auth_user_id, email, app_role ON public.team
  FOR EACH ROW EXECUTE FUNCTION public.sync_team_to_user_roles();

-- 4. RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Tout le monde (authenticated) peut lire les rôles (pour afficher son propre rôle)
CREATE POLICY "Authenticated can read user_roles"
  ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Seuls les admins peuvent modifier les rôles (toggle admin/member dans Settings)
CREATE POLICY "Admins can update user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );

-- 5. Compta: accès réservé aux admins
DROP POLICY IF EXISTS "Allow all for compta_monthly" ON public.compta_monthly;
DROP POLICY IF EXISTS "Authenticated users full access compta" ON public.compta_monthly;

CREATE POLICY "Admins only access compta"
  ON public.compta_monthly FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.id = auth.uid() AND ur.role = 'admin'
    )
  );
