-- Create the exec_sql function to execute arbitrary SQL
-- This function should only be used by the service role
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Revoke execute permission from public
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;

-- Grant execute permission only to service_role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role; 