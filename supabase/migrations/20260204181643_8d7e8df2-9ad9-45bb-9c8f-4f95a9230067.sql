-- Fix invoices RLS policy for financial data protection
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;

-- Create restrictive role-based policy for invoices
CREATE POLICY "Role-based invoice access"
ON public.invoices FOR SELECT
TO authenticated
USING (
  -- Admins can view all invoices
  public.has_role(auth.uid(), 'admin')
  OR
  -- Users can view invoices for deals where they are involved
  EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = invoices.deal_id
    AND (
      d.owner_id = auth.uid()
      OR d.sdr_id = auth.uid()
      OR d.closer_id = auth.uid()
    )
  )
);