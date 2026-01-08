-- Cleanup function for old anonymous users
-- This function deletes anonymous users that haven't been converted to permanent users
-- and were created more than 30 days ago
--
-- To run this cleanup, you can:
-- 1. Set up a pg_cron job (if pg_cron extension is enabled)
-- 2. Call this function manually via Supabase dashboard
-- 3. Set up an external cron job to call this function

CREATE OR REPLACE FUNCTION cleanup_old_anonymous_users()
RETURNS TABLE(deleted_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count BIGINT;
BEGIN
  -- Delete anonymous users created more than 30 days ago
  -- This uses CASCADE to automatically delete related data via foreign keys
  WITH deleted AS (
    DELETE FROM auth.users
    WHERE is_anonymous IS TRUE
      AND created_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN QUERY SELECT deleted_count;
END;
$$;

-- Grant execute permission to authenticated users (or service role)
-- In production, you might want to restrict this to service role only
GRANT EXECUTE ON FUNCTION cleanup_old_anonymous_users() TO authenticated;

-- Optional: Set up automatic cleanup using pg_cron (if extension is enabled)
-- Uncomment the following if you have pg_cron enabled:
--
-- SELECT cron.schedule(
--   'cleanup-anonymous-users',
--   '0 2 * * *', -- Run daily at 2 AM
--   $$SELECT cleanup_old_anonymous_users()$$
-- );
