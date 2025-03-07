-- Create a database webhook for purchases
-- This webhook will trigger when a new purchase is inserted
-- It will call our API endpoint to create entitlements

-- First, check if the webhook already exists and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_trigger 
    WHERE tgname = 'purchases_webhook_trigger'
  ) THEN
    DROP TRIGGER IF EXISTS purchases_webhook_trigger ON public.purchases;
  END IF;
END
$$;

-- Create the webhook function
CREATE OR REPLACE FUNCTION public.purchases_webhook()
RETURNS trigger AS $$
DECLARE
  webhook_url text := 'https://pmuprofitsystem.vercel.app/api/webhooks/database';
  payload json;
BEGIN
  -- Create the payload
  payload := json_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW)
  );
  
  -- Make the HTTP request
  PERFORM net.http_post(
    url := webhook_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER purchases_webhook_trigger
AFTER INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.purchases_webhook();

-- Enable the http extension if not already enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA net;

-- Grant permissions
GRANT USAGE ON SCHEMA net TO postgres;
GRANT EXECUTE ON FUNCTION net.http_post TO postgres;
GRANT EXECUTE ON FUNCTION public.purchases_webhook TO postgres; 