-- Allow admins to update any team member
-- Fix: admin settings page was blocked from updating other members

DROP POLICY IF EXISTS "Users update own team row" ON public.team;

CREATE POLICY "Users and admins can update team"
  ON public.team FOR UPDATE TO authenticated
  USING (
    -- Own row OR current user is admin
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team
      WHERE auth_user_id = auth.uid() AND app_role = 'admin'
    )
  )
  WITH CHECK (
    -- Own row OR current user is admin
    auth_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team
      WHERE auth_user_id = auth.uid() AND app_role = 'admin'
    )
  );
