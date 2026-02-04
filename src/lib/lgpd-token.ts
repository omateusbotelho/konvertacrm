/**
 * LGPD Token Verification System
 * 
 * This module provides token-based access control for LGPD public routes.
 * Tokens are generated per-contact/company and have an expiration time.
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Token expires in 24 hours
const TOKEN_EXPIRY_HOURS = 24;

type LGPDTokenType = 'consent' | 'optout' | 'deletion';

interface LGPDToken {
  id: string;
  token: string;
  email: string;
  contact_id: string | null;
  company_id: string | null;
  token_type: LGPDTokenType;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Validate a LGPD access token
 * Returns the associated data if valid, null if invalid/expired
 */
export async function validateLGPDToken(token: string): Promise<{
  valid: boolean;
  contact_id?: string;
  company_id?: string;
  email?: string;
  type?: LGPDTokenType;
  error?: string;
}> {
  if (!token || token.length < 20) {
    return { valid: false, error: 'Token inválido' };
  }

  try {
    // Query the lgpd_tokens table using raw query since table is not in types yet
    const { data, error } = await supabase
      .from('lgpd_tokens' as any)
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .maybeSingle();

    if (error) {
      console.error('Error validating LGPD token:', error);
      return { valid: false, error: 'Erro ao validar token' };
    }

    if (!data) {
      return { valid: false, error: 'Token não encontrado ou já utilizado' };
    }

    const tokenData = data as unknown as LGPDToken;

    // Check expiration
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      return { valid: false, error: 'Token expirado' };
    }

    return {
      valid: true,
      contact_id: tokenData.contact_id || undefined,
      company_id: tokenData.company_id || undefined,
      email: tokenData.email,
      type: tokenData.token_type,
    };
  } catch (err) {
    console.error('Unexpected error validating token:', err);
    return { valid: false, error: 'Erro interno' };
  }
}

/**
 * Mark a token as used after successful operation
 */
export async function markTokenAsUsed(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('lgpd_tokens' as any)
      .update({ 
        used: true, 
        used_at: new Date().toISOString() 
      })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as used:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error marking token as used:', err);
    return false;
  }
}

/**
 * Generate a random secure token
 */
export function generateSecureToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 64;
  let token = '';
  
  // Use crypto API if available
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      token += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback for server-side
    for (let i = 0; i < length; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return token;
}

/**
 * Get expiration date for a new token
 */
export function getTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + TOKEN_EXPIRY_HOURS);
  return expiration;
}

/**
 * Create a new LGPD token
 */
export async function createLGPDToken(
  email: string,
  type: LGPDTokenType,
  contactId?: string,
  companyId?: string
): Promise<{ token: string | null; error?: string }> {
  try {
    const token = generateSecureToken();
    const expiresAt = getTokenExpiration();

    const { error } = await supabase
      .from('lgpd_tokens' as any)
      .insert({
        token,
        email,
        token_type: type,
        contact_id: contactId || null,
        company_id: companyId || null,
        expires_at: expiresAt.toISOString(),
        used: false,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

    if (error) {
      console.error('Error creating LGPD token:', error);
      return { token: null, error: 'Erro ao criar token' };
    }

    return { token };
  } catch (err) {
    console.error('Unexpected error creating token:', err);
    return { token: null, error: 'Erro interno' };
  }
}
