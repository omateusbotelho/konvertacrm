// ===========================================
// Centralized Constants - KonvertaCRM
// ===========================================

// Deal Stages
export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export type DealStageKey = keyof typeof DEAL_STAGES;
export type DealStageValue = typeof DEAL_STAGES[DealStageKey];

// Stage Labels (i18n ready)
export const STAGE_LABELS: Record<DealStageValue, string> = {
  [DEAL_STAGES.LEAD]: 'Lead',
  [DEAL_STAGES.QUALIFIED]: 'Qualificado',
  [DEAL_STAGES.PROPOSAL]: 'Proposta',
  [DEAL_STAGES.NEGOTIATION]: 'Negociação',
  [DEAL_STAGES.CLOSED_WON]: 'Ganho',
  [DEAL_STAGES.CLOSED_LOST]: 'Perdido',
};

// Stage Probabilities
export const STAGE_PROBABILITIES: Record<DealStageValue, number> = {
  [DEAL_STAGES.LEAD]: 10,
  [DEAL_STAGES.QUALIFIED]: 25,
  [DEAL_STAGES.PROPOSAL]: 50,
  [DEAL_STAGES.NEGOTIATION]: 75,
  [DEAL_STAGES.CLOSED_WON]: 100,
  [DEAL_STAGES.CLOSED_LOST]: 0,
};

// Stage Colors for UI
export const STAGE_COLORS: Record<DealStageValue, string> = {
  [DEAL_STAGES.LEAD]: 'bg-slate-100 text-slate-700',
  [DEAL_STAGES.QUALIFIED]: 'bg-blue-100 text-blue-700',
  [DEAL_STAGES.PROPOSAL]: 'bg-purple-100 text-purple-700',
  [DEAL_STAGES.NEGOTIATION]: 'bg-amber-100 text-amber-700',
  [DEAL_STAGES.CLOSED_WON]: 'bg-green-100 text-green-700',
  [DEAL_STAGES.CLOSED_LOST]: 'bg-red-100 text-red-700',
};

// Deal Types
export const DEAL_TYPES = {
  RETAINER: 'retainer',
  PROJECT: 'project',
} as const;

export type DealTypeValue = typeof DEAL_TYPES[keyof typeof DEAL_TYPES];

export const DEAL_TYPE_LABELS: Record<DealTypeValue, string> = {
  [DEAL_TYPES.RETAINER]: 'Retainer (Mensalidade)',
  [DEAL_TYPES.PROJECT]: 'Projeto',
};

// Deal Sources
export const DEAL_SOURCES = {
  INBOUND: 'inbound',
  OUTBOUND: 'outbound',
  REFERRAL: 'referral',
  EVENT: 'event',
  PARTNER: 'partner',
  OTHER: 'other',
} as const;

export type DealSourceValue = typeof DEAL_SOURCES[keyof typeof DEAL_SOURCES];

export const DEAL_SOURCE_LABELS: Record<DealSourceValue, string> = {
  [DEAL_SOURCES.INBOUND]: 'Inbound',
  [DEAL_SOURCES.OUTBOUND]: 'Outbound',
  [DEAL_SOURCES.REFERRAL]: 'Indicação',
  [DEAL_SOURCES.EVENT]: 'Evento',
  [DEAL_SOURCES.PARTNER]: 'Parceiro',
  [DEAL_SOURCES.OTHER]: 'Outro',
};

// Commission Types
export const COMMISSION_TYPES = {
  QUALIFICATION: 'qualification',
  CLOSING: 'closing',
  DELIVERY: 'delivery',
  REFERRAL: 'referral',
} as const;

export type CommissionTypeValue = typeof COMMISSION_TYPES[keyof typeof COMMISSION_TYPES];

export const COMMISSION_TYPE_LABELS: Record<CommissionTypeValue, string> = {
  [COMMISSION_TYPES.QUALIFICATION]: 'Qualificação',
  [COMMISSION_TYPES.CLOSING]: 'Fechamento',
  [COMMISSION_TYPES.DELIVERY]: 'Entrega',
  [COMMISSION_TYPES.REFERRAL]: 'Indicação',
};

// Commission Status
export const COMMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export type CommissionStatusValue = typeof COMMISSION_STATUS[keyof typeof COMMISSION_STATUS];

export const COMMISSION_STATUS_LABELS: Record<CommissionStatusValue, string> = {
  [COMMISSION_STATUS.PENDING]: 'Pendente',
  [COMMISSION_STATUS.APPROVED]: 'Aprovada',
  [COMMISSION_STATUS.PAID]: 'Paga',
  [COMMISSION_STATUS.CANCELLED]: 'Cancelada',
};

// App Roles
export const APP_ROLES = {
  ADMIN: 'admin',
  CLOSER: 'closer',
  SDR: 'sdr',
} as const;

export type AppRoleValue = typeof APP_ROLES[keyof typeof APP_ROLES];

export const ROLE_LABELS: Record<AppRoleValue, string> = {
  [APP_ROLES.ADMIN]: 'Administrador',
  [APP_ROLES.CLOSER]: 'Closer',
  [APP_ROLES.SDR]: 'SDR',
};

// Invoice Status
export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type InvoiceStatusValue = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatusValue, string> = {
  [INVOICE_STATUS.PENDING]: 'Pendente',
  [INVOICE_STATUS.PAID]: 'Paga',
  [INVOICE_STATUS.OVERDUE]: 'Vencida',
  [INVOICE_STATUS.CANCELLED]: 'Cancelada',
};

// Activity Types
export const ACTIVITY_TYPES = {
  CALL: 'call',
  MEETING: 'meeting',
  EMAIL: 'email',
  TASK: 'task',
  NOTE: 'note',
} as const;

export type ActivityTypeValue = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

export const ACTIVITY_TYPE_LABELS: Record<ActivityTypeValue, string> = {
  [ACTIVITY_TYPES.CALL]: 'Ligação',
  [ACTIVITY_TYPES.MEETING]: 'Reunião',
  [ACTIVITY_TYPES.EMAIL]: 'Email',
  [ACTIVITY_TYPES.TASK]: 'Tarefa',
  [ACTIVITY_TYPES.NOTE]: 'Nota',
};

// Loss Reasons
export const LOSS_REASONS = {
  PRICE: 'price',
  TIMING: 'timing',
  COMPETITOR: 'competitor',
  NO_BUDGET: 'no_budget',
  NO_FIT: 'no_fit',
  OTHER: 'other',
} as const;

export type LossReasonValue = typeof LOSS_REASONS[keyof typeof LOSS_REASONS];

export const LOSS_REASON_LABELS: Record<LossReasonValue, string> = {
  [LOSS_REASONS.PRICE]: 'Preço',
  [LOSS_REASONS.TIMING]: 'Timing',
  [LOSS_REASONS.COMPETITOR]: 'Concorrência',
  [LOSS_REASONS.NO_BUDGET]: 'Sem Orçamento',
  [LOSS_REASONS.NO_FIT]: 'Não é fit',
  [LOSS_REASONS.OTHER]: 'Outro',
};

// Company Sizes
export const COMPANY_SIZES = {
  MICRO: '1-10',
  SMALL: '11-50',
  MEDIUM: '51-200',
  LARGE: '201-500',
  ENTERPRISE: '500+',
} as const;

// Validation Constants
export const VALIDATION = {
  MAX_TITLE_LENGTH: 255,
  MAX_NOTES_LENGTH: 5000,
  MAX_DEAL_VALUE: 999999999.99,
  MIN_DEAL_VALUE: 0.01,
  MAX_CONTRACT_MONTHS: 120,
  MAX_MONTHLY_HOURS: 744, // 31 days * 24 hours
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
