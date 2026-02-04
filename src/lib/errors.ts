// ========== ERROR CODES ==========

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DUPLICATE'
  | 'BUSINESS_RULE'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

// ========== ERROR RESPONSE INTERFACE ==========

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// ========== ERROR MESSAGES ==========

export const ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  'auth/invalid-credentials': 'Email ou senha incorretos',
  'auth/email-not-verified': 'Por favor, verifique seu email antes de fazer login',
  'auth/email-already-exists': 'Este email já está em uso',
  'auth/weak-password': 'A senha deve ter pelo menos 8 caracteres',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos',
  'auth/user-disabled': 'Esta conta foi desativada',
  'auth/session-expired': 'Sua sessão expirou. Faça login novamente',
  
  // Validation
  'validation/email-invalid': 'Email inválido',
  'validation/cnpj-invalid': 'CNPJ inválido',
  'validation/phone-invalid': 'Telefone inválido',
  'validation/date-invalid': 'Data inválida',
  'validation/required-field': 'Este campo é obrigatório',
  'validation/max-length': 'Texto excede o limite de caracteres',
  
  // Resources
  'resource/not-found': 'Recurso não encontrado',
  'resource/already-exists': 'Este registro já existe',
  'resource/in-use': 'Este recurso está em uso e não pode ser removido',
  
  // Permissions
  'permission/denied': 'Você não tem permissão para esta ação',
  'permission/role-required': 'Permissão de acesso insuficiente',
  
  // Business rules
  'deal/cannot-reopen-won': 'Não é possível reabrir um deal fechado como ganho',
  'deal/sdr-stage-limit': 'SDRs só podem mover deals até Qualificado',
  'deal/closer-only': 'Apenas Closers podem realizar esta ação',
  'deal/loss-reason-required': 'Motivo da perda é obrigatório',
  'deal/close-date-required': 'Data de fechamento é obrigatória',
  'commission/already-paid': 'Esta comissão já foi paga',
  
  // Network
  'network/offline': 'Sem conexão com a internet',
  'network/timeout': 'A requisição demorou muito. Tente novamente',
  'network/server-error': 'Erro no servidor. Tente novamente mais tarde',
  
  // Default
  'unknown': 'Ocorreu um erro inesperado. Tente novamente',
};

// ========== ERROR FACTORY ==========

export function createError(
  code: ErrorCode,
  message: string,
  field?: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(field && { field }),
      ...(details && { details }),
    },
  };
}

export function createValidationError(
  field: string,
  message: string
): ErrorResponse {
  return createError('VALIDATION_ERROR', message, field);
}

export function createNotFoundError(resource: string): ErrorResponse {
  return createError('NOT_FOUND', `${resource} não encontrado(a)`);
}

export function createUnauthorizedError(message?: string): ErrorResponse {
  return createError(
    'UNAUTHORIZED',
    message || ERROR_MESSAGES['permission/denied']
  );
}

export function createDuplicateError(field: string): ErrorResponse {
  return createError(
    'DUPLICATE',
    `${field} já está em uso`,
    field.toLowerCase()
  );
}

export function createBusinessRuleError(message: string): ErrorResponse {
  return createError('BUSINESS_RULE', message);
}

// ========== SUCCESS FACTORY ==========

export function createSuccess<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

// ========== ERROR PARSING ==========

/**
 * Parse various error types into a user-friendly message
 */
export function parseErrorMessage(error: unknown): string {
  // Already an ErrorResponse
  if (isErrorResponse(error)) {
    return error.error.message;
  }

  // Supabase error
  if (isSupabaseError(error)) {
    const code = error.code || error.message;
    return ERROR_MESSAGES[code] || error.message || ERROR_MESSAGES['unknown'];
  }

  // Standard Error
  if (error instanceof Error) {
    // Check if message matches a known error code
    const knownMessage = ERROR_MESSAGES[error.message];
    if (knownMessage) return knownMessage;
    
    // Return the error message if it looks user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // String error
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  return ERROR_MESSAGES['unknown'];
}

/**
 * Extract error code from various error types
 */
export function getErrorCode(error: unknown): ErrorCode {
  if (isErrorResponse(error)) {
    return error.error.code;
  }

  if (isSupabaseError(error)) {
    if (error.code?.startsWith('PGRST')) return 'SERVER_ERROR';
    if (error.code === '23505') return 'DUPLICATE';
    if (error.code === '42501') return 'UNAUTHORIZED';
    if (error.status === 404) return 'NOT_FOUND';
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

// ========== TYPE GUARDS ==========

export function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ErrorResponse).success === false &&
    'error' in error
  );
}

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
}

export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error || 'status' in error)
  );
}

// ========== ERROR LOGGING ==========

export function logError(error: unknown, context?: string): void {
  const errorInfo = {
    context,
    code: getErrorCode(error),
    message: parseErrorMessage(error),
    timestamp: new Date().toISOString(),
    raw: error,
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorInfo);
  }

  // TODO: In production, send to error tracking service (e.g., Sentry)
}
