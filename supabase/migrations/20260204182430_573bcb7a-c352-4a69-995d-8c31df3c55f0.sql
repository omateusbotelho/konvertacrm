-- Create atomic function to create deal with activity
CREATE OR REPLACE FUNCTION public.create_deal_with_activity(
  deal_data JSONB,
  activity_title TEXT,
  activity_company_id UUID,
  activity_created_by UUID
)
RETURNS TABLE (deal_id UUID, activity_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_deal_id UUID;
  new_activity_id UUID;
BEGIN
  -- Insert deal
  INSERT INTO public.deals (
    title,
    company_id,
    deal_type,
    value,
    monthly_value,
    contract_duration_months,
    source,
    expected_close_date,
    owner_id,
    sdr_id,
    closer_id,
    monthly_hours,
    hours_rollover,
    stage,
    probability
  )
  VALUES (
    (deal_data->>'title')::VARCHAR,
    NULLIF(deal_data->>'company_id', '')::UUID,
    (deal_data->>'deal_type')::deal_type,
    (deal_data->>'value')::DECIMAL,
    NULLIF(deal_data->>'monthly_value', '')::DECIMAL,
    NULLIF(deal_data->>'contract_duration_months', '')::INTEGER,
    (deal_data->>'source')::deal_source,
    NULLIF(deal_data->>'expected_close_date', '')::DATE,
    (deal_data->>'owner_id')::UUID,
    NULLIF(deal_data->>'sdr_id', '')::UUID,
    NULLIF(deal_data->>'closer_id', '')::UUID,
    NULLIF(deal_data->>'monthly_hours', '')::INTEGER,
    COALESCE((deal_data->>'hours_rollover')::BOOLEAN, false),
    COALESCE((deal_data->>'stage')::deal_stage, 'lead'),
    COALESCE((deal_data->>'probability')::INTEGER, 10)
  )
  RETURNING id INTO new_deal_id;

  -- Insert activity
  INSERT INTO public.activities (
    title,
    type,
    deal_id,
    company_id,
    created_by,
    is_completed,
    completed_at
  )
  VALUES (
    activity_title,
    'note',
    new_deal_id,
    activity_company_id,
    activity_created_by,
    true,
    NOW()
  )
  RETURNING id INTO new_activity_id;

  -- Return both IDs
  RETURN QUERY SELECT new_deal_id, new_activity_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_deal_with_activity TO authenticated;