-- Fix activities RLS policy for proper access control
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view activities" ON public.activities;

-- Create role-based policy for activities
CREATE POLICY "Role-based activity access"
ON public.activities FOR SELECT
TO authenticated
USING (
  -- Admins can see all
  public.has_role(auth.uid(), 'admin')
  OR
  -- User created the activity
  created_by = auth.uid()
  OR
  -- Activity is assigned to user
  assigned_to = auth.uid()
  OR
  -- User is involved in the related deal
  (
    deal_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = activities.deal_id
      AND (
        d.owner_id = auth.uid()
        OR d.sdr_id = auth.uid()
        OR d.closer_id = auth.uid()
      )
    )
  )
  OR
  -- Closers can see all activities (for coordination)
  public.has_role(auth.uid(), 'closer')
);