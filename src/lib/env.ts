/**
 * Environment Variables Validation
 * Valida que todas as variáveis de ambiente obrigatórias estão presentes
 */

interface EnvironmentVariables {
  // Supabase (Required)
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
  VITE_SUPABASE_PROJECT_ID: string;
  
  // App
  NODE_ENV: 'development' | 'staging' | 'production';
  VITE_APP_URL: string;
  
  // Optional
  VITE_SENTRY_DSN?: string;
  VITE_DEBUG_MODE?: string;
  VITE_VERBOSE_LOGGING?: string;
}

function validateEnv(): EnvironmentVariables {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    NODE_ENV: (import.meta.env.MODE || 'development') as 'development' | 'staging' | 'production',
    VITE_APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:8080',
  };

  // Required variables
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ] as const;

  // Check for missing required variables
  const missing: string[] = [];
  
  requiredVars.forEach((key) => {
    if (!env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      '',
      ...missing.map(v => `  • ${v}`),
      '',
      'Please check your .env file and ensure all required variables are set.',
      'See .env.example for reference.',
      '',
      'Quick fix:',
      '  cp .env.example .env',
      '  # Then edit .env with your values',
    ].join('\n');

    console.error(errorMessage);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL format
  try {
    new URL(env.VITE_SUPABASE_URL);
  } catch {
    throw new Error(
      'VITE_SUPABASE_URL must be a valid URL.\n' +
      `Current value: "${env.VITE_SUPABASE_URL}"\n` +
      'Expected format: https://your-project.supabase.co'
    );
  }

  // Validate Supabase URL is a Supabase URL
  if (!env.VITE_SUPABASE_URL.includes('supabase.co')) {
    console.warn(
      '⚠️ VITE_SUPABASE_URL does not appear to be a Supabase URL.\n' +
      'Expected format: https://your-project.supabase.co'
    );
  }

  return {
    ...env,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE,
    VITE_VERBOSE_LOGGING: import.meta.env.VITE_VERBOSE_LOGGING,
  };
}

// Validate on module load
export const env = validateEnv();

// Environment helpers
export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
export const isStaging = env.NODE_ENV === 'staging';

// Debug mode: enabled explicitly or in development
export const isDebugMode = env.VITE_DEBUG_MODE === 'true' || isDev;
export const isVerbose = env.VITE_VERBOSE_LOGGING === 'true';

// Log environment info in development
if (isDev) {
  console.log('🔧 Environment Configuration:', {
    mode: env.NODE_ENV,
    supabaseProject: env.VITE_SUPABASE_PROJECT_ID,
    appUrl: env.VITE_APP_URL,
    debugMode: isDebugMode,
  });
}
