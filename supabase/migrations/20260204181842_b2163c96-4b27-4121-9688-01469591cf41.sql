-- Fix audit_logs RLS policy to prevent log manipulation
-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;

-- Create restrictive INSERT policy
CREATE POLICY "Restricted audit log insertion"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can insert manually
  public.has_role(auth.uid(), 'admin')
  OR
  -- Or the log is about the user themselves
  user_id = auth.uid()
);

-- Note: SELECT policy "Admins can view audit logs" already exists and is correct
-- Edge Functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS