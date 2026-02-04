import { z } from 'zod';

// ========== EMAIL VALIDATION ==========

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'Email é obrigatório' })
  .max(255, { message: 'Email deve ter menos de 255 caracteres' })
  .regex(emailRegex, { message: 'Email inválido' });

export function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

// ========== CNPJ VALIDATION ==========

export function validateCNPJ(cnpj: string): boolean {
  // Remove non-digits
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Calculate first check digit
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Calculate second check digit
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

export const cnpjSchema = z
  .string()
  .trim()
  .refine((val) => val === '' || validateCNPJ(val), {
    message: 'CNPJ inválido',
  });

export const cnpjRequiredSchema = z
  .string()
  .trim()
  .min(1, { message: 'CNPJ é obrigatório' })
  .refine(validateCNPJ, { message: 'CNPJ inválido' });

// Format CNPJ: 00.000.000/0001-00
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/[^\d]/g, '');
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

// ========== PHONE VALIDATION (BR) ==========

const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

export function validatePhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

export const phoneSchema = z
  .string()
  .trim()
  .refine((val) => val === '' || validatePhone(val), {
    message: 'Telefone inválido. Use o formato (00) 00000-0000',
  });

export const phoneRequiredSchema = z
  .string()
  .trim()
  .min(1, { message: 'Telefone é obrigatório' })
  .refine(validatePhone, {
    message: 'Telefone inválido. Use o formato (00) 00000-0000',
  });

// Format phone: (00) 00000-0000
export function formatPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
}

// ========== DATE VALIDATION ==========

export function validateFutureDate(date: Date | string, allowToday: boolean = true): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (allowToday) {
    return inputDate >= today;
  }
  return inputDate > today;
}

export function validatePastDate(date: Date | string): boolean {
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  return inputDate <= today;
}

export const futureDateSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      return validateFutureDate(val);
    },
    { message: 'Data não pode ser no passado' }
  );

export const pastDateSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      return validatePastDate(val);
    },
    { message: 'Data não pode ser no futuro' }
  );

// ========== MONETARY VALUE VALIDATION ==========

export const monetarySchema = z
  .number({ invalid_type_error: 'Valor deve ser um número' })
  .min(0, { message: 'Valor não pode ser negativo' })
  .max(999999999.99, { message: 'Valor excede o limite máximo' });

export const monetaryRequiredSchema = z
  .number({ invalid_type_error: 'Valor deve ser um número' })
  .min(0.01, { message: 'Valor deve ser maior que zero' })
  .max(999999999.99, { message: 'Valor excede o limite máximo' });

// Format as Brazilian Real
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Parse Brazilian currency string to number
export function parseCurrency(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// ========== TEXT VALIDATION ==========

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Nome é obrigatório' })
  .max(100, { message: 'Nome deve ter menos de 100 caracteres' })
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message: 'Nome contém caracteres inválidos',
  });

export const companyNameSchema = z
  .string()
  .trim()
  .min(1, { message: 'Nome da empresa é obrigatório' })
  .max(200, { message: 'Nome deve ter menos de 200 caracteres' });

export const notesSchema = z
  .string()
  .trim()
  .max(5000, { message: 'Observações devem ter menos de 5000 caracteres' });

export const urlSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'URL inválida' }
  );

// ========== PERCENTAGE VALIDATION ==========

export const percentageSchema = z
  .number({ invalid_type_error: 'Valor deve ser um número' })
  .min(0, { message: 'Porcentagem não pode ser negativa' })
  .max(100, { message: 'Porcentagem não pode exceder 100%' });

// ========== HOURS VALIDATION ==========

export const hoursSchema = z
  .number({ invalid_type_error: 'Valor deve ser um número' })
  .int({ message: 'Horas deve ser um número inteiro' })
  .min(0, { message: 'Horas não pode ser negativo' })
  .max(744, { message: 'Horas excede o limite mensal' }); // 31 days * 24 hours

// ========== DEAL VALIDATION SCHEMAS ==========

const optionalUuidSchema = z.string().uuid('ID inválido').nullable().optional();

export const createDealSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres'),
  company_id: optionalUuidSchema,
  deal_type: z.enum(['retainer', 'project'], {
    required_error: 'Tipo de deal é obrigatório',
  }),
  value: z
    .number()
    .min(0.01, 'Valor deve ser positivo')
    .max(999999999.99, 'Valor muito alto'),
  monthly_value: z
    .number()
    .min(0.01, 'Valor mensal deve ser positivo')
    .max(999999999.99, 'Valor mensal muito alto')
    .nullable()
    .optional(),
  contract_duration_months: z
    .number()
    .int('Duração deve ser um número inteiro')
    .min(1, 'Duração mínima é 1 mês')
    .max(120, 'Duração máxima é 120 meses')
    .nullable()
    .optional(),
  source: z.enum(
    ['inbound', 'outbound', 'referral', 'event', 'partner', 'other'],
    { required_error: 'Origem é obrigatória' }
  ),
  expected_close_date: z.string().nullable().optional(),
  sdr_id: optionalUuidSchema,
  closer_id: optionalUuidSchema,
  monthly_hours: z
    .number()
    .int('Horas deve ser um número inteiro')
    .min(1, 'Mínimo 1 hora')
    .max(744, 'Máximo 744 horas')
    .nullable()
    .optional(),
  hours_rollover: z.boolean().optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

// ========== VALIDATION HELPER FUNCTIONS ==========

/**
 * Validate data against a schema and return a friendly error message
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T; 
} | { 
  success: false; 
  error: string; 
  errors: z.ZodError['errors'];
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError.message,
        errors: error.errors,
      };
    }
    throw error;
  }
}

/**
 * Sanitize string input (trim and remove dangerous characters)
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '');
}
