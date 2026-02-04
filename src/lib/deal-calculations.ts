import { AppRole } from '@/types/auth';

// ========== DEAL VALUE CALCULATIONS ==========

export interface DealValues {
  monthlyValue: number | null;
  contractDurationMonths: number | null;
  totalValue: number;
}

/**
 * Calculate total value for a Retainer deal
 * total_value = monthly_value * contract_duration_months
 */
export function calculateRetainerValue(monthlyValue: number, contractDurationMonths: number): number {
  return monthlyValue * contractDurationMonths;
}

/**
 * Calculate deal values based on type
 */
export function calculateDealValues(
  dealType: 'retainer' | 'project',
  value: number,
  monthlyValue?: number,
  contractDurationMonths?: number
): DealValues {
  if (dealType === 'retainer' && monthlyValue && contractDurationMonths) {
    return {
      monthlyValue,
      contractDurationMonths,
      totalValue: calculateRetainerValue(monthlyValue, contractDurationMonths),
    };
  }

  // Project type - value is already the total
  return {
    monthlyValue: null,
    contractDurationMonths: null,
    totalValue: value,
  };
}

// ========== COMMISSION CALCULATIONS ==========

export interface CommissionTier {
  minValue: number;
  maxValue: number | null;
  percentage: number;
}

export interface CommissionRule {
  percentage: number | null;
  isTiered: boolean;
  tiers?: CommissionTier[];
}

/**
 * Calculate fixed commission
 * commission_amount = deal.value * (rule.percentage / 100)
 */
export function calculateFixedCommission(dealValue: number, percentage: number): number {
  return dealValue * (percentage / 100);
}

/**
 * Calculate tiered commission
 * Applies different percentages to different value ranges
 */
export function calculateTieredCommission(dealValue: number, tiers: CommissionTier[]): number {
  let totalCommission = 0;
  let remainingValue = dealValue;

  // Sort tiers by minValue ascending
  const sortedTiers = [...tiers].sort((a, b) => a.minValue - b.minValue);

  for (const tier of sortedTiers) {
    if (remainingValue <= 0) break;

    const tierMin = tier.minValue;
    const tierMax = tier.maxValue ?? Infinity;

    if (dealValue >= tierMin) {
      const applicableValue = Math.min(
        remainingValue,
        tierMax - tierMin
      );
      
      if (applicableValue > 0) {
        totalCommission += applicableValue * (tier.percentage / 100);
        remainingValue -= applicableValue;
      }
    }
  }

  return totalCommission;
}

/**
 * Calculate commission based on rule type
 */
export function calculateCommission(dealValue: number, rule: CommissionRule): number {
  if (rule.isTiered && rule.tiers && rule.tiers.length > 0) {
    return calculateTieredCommission(dealValue, rule.tiers);
  }

  if (rule.percentage !== null) {
    return calculateFixedCommission(dealValue, rule.percentage);
  }

  return 0;
}

// ========== REVENUE PROJECTION ==========

/**
 * Calculate projected revenue based on deal probability
 * projected_revenue = deal.value * (deal.probability / 100)
 */
export function calculateProjectedRevenue(dealValue: number, probability: number): number {
  return dealValue * (probability / 100);
}

/**
 * Calculate weighted pipeline value for multiple deals
 */
export function calculateWeightedPipelineValue(
  deals: Array<{ value: number; probability: number }>
): number {
  return deals.reduce((sum, deal) => {
    return sum + calculateProjectedRevenue(deal.value, deal.probability);
  }, 0);
}

// ========== PIPELINE MOVEMENT VALIDATION ==========

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';

export interface MoveValidationResult {
  allowed: boolean;
  error?: string;
  requiresLossReason?: boolean;
  requiresCloseDate?: boolean;
}

// Stage order for progression checks
const STAGE_ORDER: Record<DealStage, number> = {
  lead: 0,
  qualified: 1,
  proposal: 2,
  negotiation: 3,
  closed_won: 4,
  closed_lost: 4,
};

// Stages that SDR can access
const SDR_ALLOWED_STAGES: DealStage[] = ['lead', 'qualified'];

/**
 * Validate if a role can move a deal from one stage to another
 */
export function validateDealMovement(
  role: AppRole | null,
  fromStage: DealStage,
  toStage: DealStage,
  isOwner: boolean = false
): MoveValidationResult {
  // No role = no permission
  if (!role) {
    return { allowed: false, error: 'Você precisa estar autenticado' };
  }

  // Rule: Deal cannot move back from Closed Won
  if (fromStage === 'closed_won') {
    return { allowed: false, error: 'Não é possível reabrir um deal fechado como ganho' };
  }

  // Admin and Closer can move anywhere
  if (role === 'admin' || role === 'closer') {
    // Check if moving to closed_lost requires loss reason
    if (toStage === 'closed_lost') {
      return { allowed: true, requiresLossReason: true };
    }
    // Check if moving to closed_won requires close date
    if (toStage === 'closed_won') {
      return { allowed: true, requiresCloseDate: true };
    }
    return { allowed: true };
  }

  // SDR rules
  if (role === 'sdr') {
    // SDR can move to Lead or Qualified
    if (SDR_ALLOWED_STAGES.includes(toStage)) {
      return { allowed: true };
    }

    // SDR can mark as Closed Lost if they are the owner
    if (toStage === 'closed_lost' && isOwner) {
      return { allowed: true, requiresLossReason: true };
    }

    // SDR cannot move to Proposal, Negotiation, or Closed Won
    if (toStage === 'proposal' || toStage === 'negotiation') {
      return { allowed: false, error: 'Apenas Closers podem mover para esta etapa' };
    }

    if (toStage === 'closed_won') {
      return { allowed: false, error: 'Apenas Closers podem fechar deals como ganhos' };
    }

    return { allowed: false, error: 'SDRs só podem mover deals até Qualificado' };
  }

  return { allowed: false, error: 'Permissão inválida' };
}

/**
 * Get probability based on stage
 */
export function getStageProbability(stage: DealStage): number {
  const probabilityMap: Record<DealStage, number> = {
    lead: 10,
    qualified: 30,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0,
  };
  return probabilityMap[stage];
}

// ========== HOURS TRACKING (RETAINER) ==========

export interface HoursInfo {
  monthlyHours: number;
  hoursConsumed: number;
  hoursRollover: boolean;
  hoursRemaining: number;
  usagePercentage: number;
}

/**
 * Calculate hours info for a retainer deal
 */
export function calculateHoursInfo(
  monthlyHours: number,
  hoursConsumed: number,
  hoursRollover: boolean,
  previousRolloverHours: number = 0
): HoursInfo {
  const totalAvailable = hoursRollover 
    ? monthlyHours + previousRolloverHours 
    : monthlyHours;
  
  const hoursRemaining = Math.max(0, totalAvailable - hoursConsumed);
  const usagePercentage = totalAvailable > 0 
    ? Math.min(100, (hoursConsumed / totalAvailable) * 100) 
    : 0;

  return {
    monthlyHours,
    hoursConsumed,
    hoursRollover,
    hoursRemaining,
    usagePercentage,
  };
}

/**
 * Calculate rollover hours for next month
 */
export function calculateRolloverHours(
  monthlyHours: number,
  hoursConsumed: number,
  hoursRollover: boolean
): number {
  if (!hoursRollover) return 0;
  return Math.max(0, monthlyHours - hoursConsumed);
}
