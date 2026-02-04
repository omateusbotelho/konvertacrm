-- Fix Function Search Path Mutable warnings
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix overly permissive RLS policies for INSERT operations

-- Drop and recreate audit_logs INSERT policy with proper check
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Drop and recreate lgpd_consents INSERT policy with proper check
DROP POLICY IF EXISTS "Authenticated users can create consents" ON public.lgpd_consents;
CREATE POLICY "Authenticated users can create consents"
ON public.lgpd_consents FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts c WHERE c.id = contact_id
  ) OR EXISTS (
    SELECT 1 FROM public.companies co WHERE co.id = company_id
  )
);