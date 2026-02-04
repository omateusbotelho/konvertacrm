-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- Note: INSERT operations will be handled by edge functions using service role key
-- which bypasses RLS, so no INSERT policy is needed for regular users