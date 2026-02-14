-- Profils utilisateurs (lié à auth.users) pour les rôles app
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor'))
);

-- RLS : chaque utilisateur lit/met à jour son propre profil
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger : à chaque nouvel utilisateur Auth, créer une ligne dans profiles
-- Premier utilisateur = admin, les suivants = editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'email',
    CASE WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin' ELSE 'editor' END
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
