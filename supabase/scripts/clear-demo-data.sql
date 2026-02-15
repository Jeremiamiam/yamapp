-- Vider toutes les données de démo/seed en prod (garder uniquement les comptes réels)
-- À exécuter dans Supabase : SQL Editor → New query → coller ce script → Run
-- Attention : irréversible. À utiliser quand tu veux repartir de zéro (0 client, 0 livrable, 0 appel).

-- 1. Supprimer les données métier (ordre sans conflit de clés)
DELETE FROM public.deliverables;
DELETE FROM public.calls;
DELETE FROM public.documents;
DELETE FROM public.client_links;
DELETE FROM public.contacts;
DELETE FROM public.clients;
DELETE FROM public.compta_monthly;

-- 2. Supprimer uniquement les lignes "seed" de team (Jérémy, Alex, Marie, etc. du seed.json)
--    On garde les lignes avec auth_user_id rempli (= vrais utilisateurs créés via inscription)
DELETE FROM public.team WHERE auth_user_id IS NULL;
