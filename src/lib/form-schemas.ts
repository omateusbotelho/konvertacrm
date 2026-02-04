import { z } from 'zod';
import {
  emailSchema,
  nameSchema,
  companyNameSchema,
  phoneSchema,
  cnpjSchema,
  urlSchema,
  notesSchema,
  monetaryRequiredSchema,
  monetarySchema,
  percentageSchema,
  hoursSchema,
  futureDateSchema,
} from './validations';

// ========== CONTACT FORM SCHEMA ==========

export const contactFormSchema = z.object({
  full_name: nameSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  position: z.string().trim().max(100, { message: 'Cargo deve ter menos de 100 caracteres' }).optional(),
  linkedin_url: urlSchema.optional().or(z.literal('')),
  notes: notesSchema.optional(),
  company_id: z.string().uuid({ message: 'Empresa inválida' }).optional().nullable(),
  is_primary: z.boolean().default(false),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ========== COMPANY FORM SCHEMA ==========

export const companyFormSchema = z.object({
  name: companyNameSchema,
  legal_name: z.string().trim().max(200, { message: 'Razão social deve ter menos de 200 caracteres' }).optional(),
  cnpj: cnpjSchema.optional().or(z.literal('')),
  industry: z.string().trim().max(100, { message: 'Setor deve ter menos de 100 caracteres' }).optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional().nullable(),
  website: urlSchema.optional().or(z.literal('')),
  address_street: z.string().trim().max(255).optional(),
  address_city: z.string().trim().max(100).optional(),
  address_state: z.string().trim().max(50).optional(),
  address_zip: z.string().trim().max(20).optional(),
  notes: notesSchema.optional(),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;

// ========== DEAL FORM SCHEMA ==========

export const dealFormSchema = z.object({
  title: z.string().trim().min(1, { message: 'Título é obrigatório' }).max(200, { message: 'Título deve ter menos de 200 caracteres' }),
  company_id: z.string().uuid({ message: 'Empresa é obrigatória' }),
  deal_type: z.enum(['retainer', 'project'], { required_error: 'Tipo de deal é obrigatório' }),
  value: monetaryRequiredSchema,
  monthly_value: monetarySchema.optional().nullable(),
  contract_duration_months: z.number().int().min(1).max(60).optional().nullable(),
  monthly_hours: hoursSchema.optional().nullable(),
  hours_rollover: z.boolean().default(false),
  source: z.enum(['inbound', 'outbound', 'referral', 'event', 'partner', 'other'], { required_error: 'Origem é obrigatória' }),
  expected_close_date: futureDateSchema.optional(),
  probability: percentageSchema.default(10),
  referred_by: z.string().uuid().optional().nullable(),
}).refine(
  (data) => {
    // Retainer requires monthly_value and contract_duration_months
    if (data.deal_type === 'retainer') {
      return data.monthly_value !== null && data.monthly_value !== undefined &&
             data.contract_duration_months !== null && data.contract_duration_months !== undefined;
    }
    return true;
  },
  {
    message: 'Retainer requer valor mensal e duração do contrato',
    path: ['monthly_value'],
  }
);

export type DealFormData = z.infer<typeof dealFormSchema>;

// ========== ACTIVITY FORM SCHEMA ==========

export const activityFormSchema = z.object({
  title: z.string().trim().min(1, { message: 'Título é obrigatório' }).max(200, { message: 'Título deve ter menos de 200 caracteres' }),
  type: z.enum(['call', 'meeting', 'email', 'task', 'note'], { required_error: 'Tipo é obrigatório' }),
  description: notesSchema.optional(),
  due_date: z.string().optional(),
  company_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
}).refine(
  (data) => {
    // Notes don't need future date validation
    if (data.type === 'note') return true;
    
    // Other activity types should have future due_date
    if (data.due_date) {
      const dueDate = new Date(data.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate >= today;
    }
    return true;
  },
  {
    message: 'Data não pode ser no passado (exceto para notas)',
    path: ['due_date'],
  }
);

export type ActivityFormData = z.infer<typeof activityFormSchema>;

// ========== INVOICE FORM SCHEMA ==========

export const invoiceFormSchema = z.object({
  invoice_number: z.string().trim().min(1, { message: 'Número da fatura é obrigatório' }).max(50),
  company_id: z.string().uuid({ message: 'Empresa é obrigatória' }),
  deal_id: z.string().uuid().optional().nullable(),
  amount: monetaryRequiredSchema,
  issue_date: z.string().min(1, { message: 'Data de emissão é obrigatória' }),
  due_date: z.string().min(1, { message: 'Data de vencimento é obrigatória' }),
  notes: notesSchema.optional(),
}).refine(
  (data) => {
    const issueDate = new Date(data.issue_date);
    const dueDate = new Date(data.due_date);
    return dueDate >= issueDate;
  },
  {
    message: 'Data de vencimento deve ser posterior à data de emissão',
    path: ['due_date'],
  }
);

export type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

// ========== COMMISSION RULE FORM SCHEMA ==========

export const commissionRuleFormSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome é obrigatório' }).max(100),
  commission_type: z.enum(['qualification', 'closing', 'delivery', 'referral'], { required_error: 'Tipo é obrigatório' }),
  role: z.enum(['admin', 'closer', 'sdr']).optional().nullable(),
  deal_type: z.enum(['retainer', 'project']).optional().nullable(),
  percentage: percentageSchema.optional().nullable(),
  is_tiered: z.boolean().default(false),
  is_active: z.boolean().default(true),
}).refine(
  (data) => {
    // Non-tiered rules require a percentage
    if (!data.is_tiered) {
      return data.percentage !== null && data.percentage !== undefined;
    }
    return true;
  },
  {
    message: 'Porcentagem é obrigatória para regras não escalonadas',
    path: ['percentage'],
  }
);

export type CommissionRuleFormData = z.infer<typeof commissionRuleFormSchema>;

// ========== USER PROFILE FORM SCHEMA ==========

export const profileFormSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  avatar_url: urlSchema.optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

// ========== AUTH FORM SCHEMAS ==========

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres' }),
  remember: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
    .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' }),
  confirmPassword: z.string(),
  fullName: nameSchema,
  role: z.enum(['admin', 'closer', 'sdr']).default('sdr'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z.object({
  password: z.string()
    .min(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
    .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
    .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
