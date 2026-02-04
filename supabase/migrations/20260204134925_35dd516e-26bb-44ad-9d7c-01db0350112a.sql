-- Drop existing overly permissive SELECT policy for deals
DROP POLICY IF EXISTS "Authenticated users can view deals" ON deals;

-- Create new policy: Admins and Closers see all, SDRs see only their own
CREATE POLICY "Role-based deal visibility"
ON deals FOR SELECT
TO authenticated
USING (
  -- Admins see all deals
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Closers see all deals
  has_role(auth.uid(), 'closer'::app_role)
  OR
  -- SDRs see only deals they own or are assigned to
  (
    has_role(auth.uid(), 'sdr'::app_role)
    AND (owner_id = auth.uid() OR sdr_id = auth.uid())
  )
);