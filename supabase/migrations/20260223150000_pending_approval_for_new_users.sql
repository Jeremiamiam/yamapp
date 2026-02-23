-- Nouveaux comptes en attente d'autorisation admin
-- Premier utilisateur = admin direct. Les suivants = pending jusqu'à validation.
-- Admin autorise via Settings > Gestion de l'équipe > bouton "Autoriser".

-- 1. team.app_role : ajouter 'pending'
ALTER TABLE public.team
  DROP CONSTRAINT IF EXISTS team_app_role_check;

ALTER TABLE public.team
  ADD CONSTRAINT team_app_role_check
  CHECK (app_role IN ('admin', 'editor', 'pending'));

-- 2. user_roles.role : ajouter 'pending'
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('admin', 'member', 'pending'));

-- 3. Trigger handle_new_user_team : nouveaux users = pending (sauf premier)
CREATE OR REPLACE FUNCTION public.handle_new_user_team()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  first_two text;
  is_first boolean;
BEGIN
  first_two := upper(substring(coalesce(new.raw_user_meta_data->>'email', 'user') from 1 for 2));
  IF first_two = '' OR length(first_two) < 2 THEN first_two := 'U1'; END IF;

  is_first := (SELECT count(*) FROM public.team WHERE auth_user_id IS NOT NULL) = 0;

  INSERT INTO public.team (id, name, initials, role, color, email, auth_user_id, app_role)
  VALUES (
    'tm-' || new.id::text,
    coalesce(trim(split_part(new.raw_user_meta_data->>'email', '@', 1)), 'Utilisateur'),
    first_two,
    'employee',
    '#22d3ee',
    new.raw_user_meta_data->>'email',
    new.id,
    CASE WHEN is_first THEN 'admin' ELSE 'pending' END
  );
  RETURN new;
END;
$$;

-- 4. sync_team_to_user_roles : mapper pending -> pending
CREATE OR REPLACE FUNCTION public.sync_team_to_user_roles()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.auth_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (id, email, role, team_member_id)
    VALUES (
      NEW.auth_user_id,
      COALESCE(NEW.email, ''),
      CASE
        WHEN NEW.app_role = 'admin' THEN 'admin'
        WHEN NEW.app_role = 'pending' THEN 'pending'
        ELSE 'member'
      END,
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
