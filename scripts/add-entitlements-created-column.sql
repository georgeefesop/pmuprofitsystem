-- Add entitlements_created column to purchases table
ALTER TABLE public.purchases 
ADD COLUMN IF NOT EXISTS entitlements_created BOOLEAN DEFAULT FALSE;

-- Update existing records to have entitlements_created = true if they have entitlements
UPDATE public.purchases
SET entitlements_created = TRUE
WHERE id IN (
  SELECT DISTINCT source_id 
  FROM public.user_entitlements 
  WHERE source_type = 'purchase'
); 