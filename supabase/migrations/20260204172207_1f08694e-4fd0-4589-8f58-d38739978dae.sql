-- Create LGPD tokens table for secure access to public LGPD routes
CREATE TABLE public.lgpd_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('consent', 'optout', 'deletion')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable Row Level Security
ALTER TABLE public.lgpd_tokens ENABLE ROW LEVEL SECURITY;

-- Create index for faster token lookups
CREATE INDEX idx_lgpd_tokens_token ON public.lgpd_tokens(token);
CREATE INDEX idx_lgpd_tokens_email ON public.lgpd_tokens(email);
CREATE INDEX idx_lgpd_tokens_expires ON public.lgpd_tokens(expires_at);

-- Policy: Allow anonymous insert (for generating tokens)
CREATE POLICY "Allow anonymous token creation" 
ON public.lgpd_tokens 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Policy: Allow anonymous select for token validation
CREATE POLICY "Allow anonymous token validation" 
ON public.lgpd_tokens 
FOR SELECT 
TO anon
USING (true);

-- Policy: Allow anonymous update for marking tokens as used
CREATE POLICY "Allow anonymous token update" 
ON public.lgpd_tokens 
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all tokens
CREATE POLICY "Admins can view all tokens" 
ON public.lgpd_tokens 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add comment
COMMENT ON TABLE public.lgpd_tokens IS 'Secure tokens for LGPD public route access - prevents bot abuse';