-- Create the verified_sessions table
CREATE TABLE IF NOT EXISTS public.verified_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  payment_intent_id TEXT,
  user_id UUID,
  customer_email TEXT,
  payment_status TEXT,
  metadata JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_verified_sessions_session_id ON public.verified_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_verified_sessions_payment_intent_id ON public.verified_sessions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_verified_sessions_user_id ON public.verified_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_sessions_customer_email ON public.verified_sessions(customer_email);

-- Add RLS policies
ALTER TABLE public.verified_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can do anything with verified_sessions"
  ON public.verified_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
  
-- Allow authenticated users to read their own sessions
CREATE POLICY "Users can read their own verified sessions"
  ON public.verified_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
  
-- Allow anon to read sessions by payment_intent_id (for verification)
CREATE POLICY "Anyone can read sessions by payment_intent_id"
  ON public.verified_sessions
  FOR SELECT
  TO anon
  USING (payment_intent_id IS NOT NULL);

-- Create the stored procedure for creating the table
CREATE OR REPLACE FUNCTION create_verified_sessions_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'verified_sessions'
  ) THEN
    -- Create the table
    CREATE TABLE public.verified_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id TEXT NOT NULL,
      payment_intent_id TEXT,
      user_id UUID,
      customer_email TEXT,
      payment_status TEXT,
      metadata JSONB,
      verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add indexes
    CREATE INDEX idx_verified_sessions_session_id ON public.verified_sessions(session_id);
    CREATE INDEX idx_verified_sessions_payment_intent_id ON public.verified_sessions(payment_intent_id);
    CREATE INDEX idx_verified_sessions_user_id ON public.verified_sessions(user_id);
    CREATE INDEX idx_verified_sessions_customer_email ON public.verified_sessions(customer_email);
    
    -- Add RLS policies
    ALTER TABLE public.verified_sessions ENABLE ROW LEVEL SECURITY;
    
    -- Allow service role full access
    CREATE POLICY "Service role can do anything with verified_sessions"
      ON public.verified_sessions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
      
    -- Allow authenticated users to read their own sessions
    CREATE POLICY "Users can read their own verified sessions"
      ON public.verified_sessions
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
      
    -- Allow anon to read sessions by payment_intent_id (for verification)
    CREATE POLICY "Anyone can read sessions by payment_intent_id"
      ON public.verified_sessions
      FOR SELECT
      TO anon
      USING (payment_intent_id IS NOT NULL);
  END IF;
END;
$$; 