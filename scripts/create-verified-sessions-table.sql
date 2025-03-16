-- Create the verified_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.verified_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  payment_intent_id TEXT,
  user_id UUID,
  customer_email TEXT,
  payment_status TEXT,
  metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verified_sessions_session_id ON public.verified_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_verified_sessions_payment_intent_id ON public.verified_sessions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_verified_sessions_user_id ON public.verified_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_sessions_customer_email ON public.verified_sessions(customer_email);

-- Enable row level security
ALTER TABLE public.verified_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
DROP POLICY IF EXISTS "Service role can do anything with verified_sessions" ON public.verified_sessions;
CREATE POLICY "Service role can do anything with verified_sessions"
  ON public.verified_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
  
DROP POLICY IF EXISTS "Users can read their own verified sessions" ON public.verified_sessions;
CREATE POLICY "Users can read their own verified sessions"
  ON public.verified_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
  
DROP POLICY IF EXISTS "Anyone can read sessions by payment_intent_id" ON public.verified_sessions;
CREATE POLICY "Anyone can read sessions by payment_intent_id"
  ON public.verified_sessions
  FOR SELECT
  TO anon
  USING (payment_intent_id IS NOT NULL); 