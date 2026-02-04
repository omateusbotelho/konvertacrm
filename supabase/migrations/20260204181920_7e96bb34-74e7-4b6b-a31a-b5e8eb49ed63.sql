-- Fix lgpd_consents RLS policy to protect privacy
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view consents" ON public.lgpd_consents;

-- Create restrictive SELECT policy - only admins can view consents
CREATE POLICY "Admins can view consents"
ON public.lgpd_consents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Note: INSERT policy for external forms remains unchanged
-- Consents are typically created via public/anonymous endpoints