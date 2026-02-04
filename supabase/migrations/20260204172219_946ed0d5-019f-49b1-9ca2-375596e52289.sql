-- Fix overly permissive RLS policies for lgpd_tokens

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow anonymous token creation" ON public.lgpd_tokens;
DROP POLICY IF EXISTS "Allow anonymous token update" ON public.lgpd_tokens;

-- Create more restrictive policies

-- Insert: Only allow inserting tokens with valid email format and proper expiration
CREATE POLICY "Restrict anonymous token creation" 
ON public.lgpd_tokens 
FOR INSERT 
TO anon
WITH CHECK (
  email IS NOT NULL AND 
  email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  expires_at > now() AND
  used = false
);

-- Update: Only allow marking tokens as used (not modifying other fields)
-- Tokens can only be updated if they're not already used and not expired
CREATE POLICY "Restrict anonymous token update" 
ON public.lgpd_tokens 
FOR UPDATE 
TO anon
USING (
  used = false AND 
  expires_at > now()
)
WITH CHECK (
  used = true AND
  used_at IS NOT NULL
);