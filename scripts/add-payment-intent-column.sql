-- Add payment_intent_id column to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Create an index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent_id ON purchases(payment_intent_id);

-- Add a comment explaining the purpose of the column
COMMENT ON COLUMN purchases.payment_intent_id IS 'Stripe payment intent ID for tracking and preventing duplicate payments'; 