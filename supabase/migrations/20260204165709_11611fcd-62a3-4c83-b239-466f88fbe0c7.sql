-- =====================================================
-- SECURITY AUDIT AND REINFORCEMENT
-- =====================================================

-- 1. COMMISSIONS: Only admins can approve/pay commissions
-- Drop existing policy and create more restrictive ones

DROP POLICY IF EXISTS "Admins can manage commissions" ON public.commissions;

-- Admins can do everything
CREATE POLICY "Admins have full access to commissions"
ON public.commissions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Non-admins can only INSERT with status = 'pending'
CREATE POLICY "Edge functions can insert pending commissions"
ON public.commissions
FOR INSERT
WITH CHECK (
  status = 'pending' OR has_role(auth.uid(), 'admin')
);

-- Non-admins cannot UPDATE status to approved/paid
CREATE POLICY "Only admins can approve or pay commissions"
ON public.commissions
FOR UPDATE
USING (
  user_id = auth.uid() OR has_role(auth.uid(), 'admin')
)
WITH CHECK (
  -- If not admin, cannot change status to approved or paid
  has_role(auth.uid(), 'admin') OR (
    status IS NOT DISTINCT FROM 'pending' OR
    status IS NOT DISTINCT FROM 'cancelled'
  )
);

-- 2. DEALS: Prevent value changes after closed_won (except admin)
-- Create a trigger function to enforce this rule

CREATE OR REPLACE FUNCTION public.prevent_closed_deal_value_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If deal was already closed_won
  IF OLD.stage = 'closed_won' THEN
    -- Only admins can modify closed deals
    IF NOT has_role(auth.uid(), 'admin') THEN
      -- Check if value is being changed
      IF NEW.value IS DISTINCT FROM OLD.value THEN
        RAISE EXCEPTION 'Cannot change deal value after closing. Only admins can modify closed deals.';
      END IF;
      
      -- Check if monthly_value is being changed
      IF NEW.monthly_value IS DISTINCT FROM OLD.monthly_value THEN
        RAISE EXCEPTION 'Cannot change deal monthly value after closing. Only admins can modify closed deals.';
      END IF;
      
      -- Prevent reopening a closed deal
      IF NEW.stage IS DISTINCT FROM 'closed_won' AND NEW.stage IS DISTINCT FROM 'closed_lost' THEN
        RAISE EXCEPTION 'Cannot reopen a closed deal. Only admins can modify closed deals.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS prevent_closed_deal_changes ON public.deals;
CREATE TRIGGER prevent_closed_deal_changes
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_closed_deal_value_change();

-- 3. DEALS: Reinforce RLS for proper visibility by role
-- The existing policy looks correct, but let's make it more explicit

DROP POLICY IF EXISTS "Role-based deal visibility" ON public.deals;

CREATE POLICY "Role-based deal visibility"
ON public.deals
FOR SELECT
USING (
  -- Admins see everything
  has_role(auth.uid(), 'admin') OR
  -- Closers see everything  
  has_role(auth.uid(), 'closer') OR
  -- SDRs only see deals they own or are assigned as SDR
  (
    has_role(auth.uid(), 'sdr') AND 
    (owner_id = auth.uid() OR sdr_id = auth.uid())
  )
);

-- 4. DEALS: Reinforce UPDATE policy to respect ownership
DROP POLICY IF EXISTS "Owners, SDRs, Closers and admins can update deals" ON public.deals;

CREATE POLICY "Role-based deal updates"
ON public.deals
FOR UPDATE
USING (
  -- Admins can update any deal
  has_role(auth.uid(), 'admin') OR
  -- Closers can update deals they own or are assigned to
  (has_role(auth.uid(), 'closer') AND (owner_id = auth.uid() OR closer_id = auth.uid())) OR
  -- SDRs can only update deals they own or are assigned as SDR
  (has_role(auth.uid(), 'sdr') AND (owner_id = auth.uid() OR sdr_id = auth.uid()))
)
WITH CHECK (
  -- Same conditions apply for the new row
  has_role(auth.uid(), 'admin') OR
  (has_role(auth.uid(), 'closer') AND (owner_id = auth.uid() OR closer_id = auth.uid())) OR
  (has_role(auth.uid(), 'sdr') AND (owner_id = auth.uid() OR sdr_id = auth.uid()))
);

-- 5. Create function to validate commission status changes
CREATE OR REPLACE FUNCTION public.validate_commission_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status is being changed to approved or paid
  IF (NEW.status = 'approved' OR NEW.status = 'paid') AND 
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Only admins can approve or pay commissions
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can approve or mark commissions as paid.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for commission status validation
DROP TRIGGER IF EXISTS validate_commission_status ON public.commissions;
CREATE TRIGGER validate_commission_status
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commission_status_change();

-- 6. Audit log for security-sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_sensitive_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log commission status changes
  IF TG_TABLE_NAME = 'commissions' AND TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
      VALUES (
        auth.uid(),
        'commission_status_change',
        'commission',
        NEW.id,
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'amount', NEW.amount
        )
      );
    END IF;
  END IF;

  -- Log deal value changes after closing
  IF TG_TABLE_NAME = 'deals' AND TG_OP = 'UPDATE' THEN
    IF OLD.stage = 'closed_won' AND (OLD.value IS DISTINCT FROM NEW.value OR OLD.monthly_value IS DISTINCT FROM NEW.monthly_value) THEN
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes)
      VALUES (
        auth.uid(),
        'closed_deal_modified',
        'deal',
        NEW.id,
        jsonb_build_object(
          'old_value', OLD.value,
          'new_value', NEW.value,
          'old_monthly_value', OLD.monthly_value,
          'new_monthly_value', NEW.monthly_value
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers for security logging
DROP TRIGGER IF EXISTS log_commission_security ON public.commissions;
CREATE TRIGGER log_commission_security
  AFTER UPDATE ON public.commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_security_sensitive_action();

DROP TRIGGER IF EXISTS log_deal_security ON public.deals;
CREATE TRIGGER log_deal_security
  AFTER UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.log_security_sensitive_action();