-- RPC function to atomically increment a usage counter in the organizations.usage_this_period JSONB column.
-- Called by the worker (extract processor, query handler, etc.) via supabase.rpc('increment_usage', ...).
CREATE OR REPLACE FUNCTION increment_usage(
  p_org_id UUID,
  p_field TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organizations
  SET
    usage_this_period = jsonb_set(
      usage_this_period,
      ARRAY[p_field],
      to_jsonb(COALESCE((usage_this_period->>p_field)::integer, 0) + p_amount)
    ),
    updated_at = NOW()
  WHERE id = p_org_id;
END;
$$;
