import { describe, it, expect } from 'vitest';
import { canEditDeal, isReadOnlyForUser, getReadOnlyReason } from '@/lib/deal-permissions';
import { DealWithCompany } from '@/hooks/useDeals';

// Mock deal data factory
function createMockDeal(overrides: Partial<DealWithCompany> = {}): DealWithCompany {
  return {
    id: 'deal-123',
    title: 'Test Deal',
    owner_id: 'user-owner',
    sdr_id: 'user-sdr',
    closer_id: null,
    company_id: 'company-123',
    deal_type: 'project',
    value: 10000,
    monthly_value: null,
    contract_duration_months: null,
    monthly_hours: null,
    hours_consumed: 0,
    hours_rollover: false,
    stage: 'lead',
    probability: 10,
    source: 'inbound',
    expected_close_date: null,
    actual_close_date: null,
    loss_reason: null,
    loss_notes: null,
    loss_competitor: null,
    referred_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    companies: { id: 'company-123', name: 'Test Company' },
    ...overrides,
  };
}

describe('Deal Permissions', () => {
  describe('canEditDeal', () => {
    it('returns false for null deal', () => {
      expect(canEditDeal(null, 'user-1', 'admin')).toBe(false);
    });

    it('returns false for undefined userId', () => {
      const deal = createMockDeal();
      expect(canEditDeal(deal, undefined, 'admin')).toBe(false);
    });

    it('returns false for null role', () => {
      const deal = createMockDeal();
      expect(canEditDeal(deal, 'user-1', null)).toBe(false);
    });

    describe('Admin permissions', () => {
      it('Admin can edit any deal', () => {
        const deal = createMockDeal();
        expect(canEditDeal(deal, 'admin-user', 'admin')).toBe(true);
      });

      it('Admin can edit deal with closer assigned', () => {
        const deal = createMockDeal({ closer_id: 'closer-1' });
        expect(canEditDeal(deal, 'admin-user', 'admin')).toBe(true);
      });

      it('Admin can edit closed deals', () => {
        const deal = createMockDeal({ stage: 'closed_won' });
        expect(canEditDeal(deal, 'admin-user', 'admin')).toBe(true);
      });
    });

    describe('Closer permissions', () => {
      it('Closer can edit deal where they are the closer', () => {
        const deal = createMockDeal({ closer_id: 'closer-1' });
        expect(canEditDeal(deal, 'closer-1', 'closer')).toBe(true);
      });

      it('Closer can edit deal where they are the owner', () => {
        const deal = createMockDeal({ owner_id: 'closer-1' });
        expect(canEditDeal(deal, 'closer-1', 'closer')).toBe(true);
      });

      it('Closer cannot edit deal owned by another user', () => {
        const deal = createMockDeal({ owner_id: 'other-user', closer_id: 'other-closer' });
        expect(canEditDeal(deal, 'closer-1', 'closer')).toBe(false);
      });
    });

    describe('SDR permissions', () => {
      it('SDR can edit deal they own without closer assigned', () => {
        const deal = createMockDeal({ owner_id: 'sdr-user', sdr_id: 'sdr-user', closer_id: null });
        expect(canEditDeal(deal, 'sdr-user', 'sdr')).toBe(true);
      });

      it('SDR can edit deal where they are sdr_id without closer', () => {
        const deal = createMockDeal({ sdr_id: 'sdr-user', closer_id: null });
        expect(canEditDeal(deal, 'sdr-user', 'sdr')).toBe(true);
      });

      it('SDR cannot edit deal with closer assigned (read-only)', () => {
        const deal = createMockDeal({ sdr_id: 'sdr-user', closer_id: 'closer-1' });
        expect(canEditDeal(deal, 'sdr-user', 'sdr')).toBe(false);
      });

      it('SDR cannot edit deal owned by another user', () => {
        const deal = createMockDeal({ owner_id: 'other-user', sdr_id: 'other-sdr' });
        expect(canEditDeal(deal, 'sdr-user', 'sdr')).toBe(false);
      });
    });
  });

  describe('isReadOnlyForUser', () => {
    it('returns true for null deal', () => {
      expect(isReadOnlyForUser(null, 'user-1', 'admin')).toBe(true);
    });

    it('returns true for undefined userId', () => {
      const deal = createMockDeal();
      expect(isReadOnlyForUser(deal, undefined, 'admin')).toBe(true);
    });

    it('returns false when user can edit (admin)', () => {
      const deal = createMockDeal();
      expect(isReadOnlyForUser(deal, 'admin-user', 'admin')).toBe(false);
    });

    it('returns true when SDR has deal with closer assigned', () => {
      const deal = createMockDeal({ sdr_id: 'sdr-user', closer_id: 'closer-1' });
      expect(isReadOnlyForUser(deal, 'sdr-user', 'sdr')).toBe(true);
    });

    it('returns false when SDR has deal without closer', () => {
      const deal = createMockDeal({ sdr_id: 'sdr-user', closer_id: null });
      expect(isReadOnlyForUser(deal, 'sdr-user', 'sdr')).toBe(false);
    });
  });

  describe('getReadOnlyReason', () => {
    it('returns null for null deal', () => {
      expect(getReadOnlyReason(null, 'user-1', 'admin')).toBeNull();
    });

    it('returns null when user can edit', () => {
      const deal = createMockDeal();
      expect(getReadOnlyReason(deal, 'admin-user', 'admin')).toBeNull();
    });

    it('returns correct message for SDR with closer assigned', () => {
      const deal = createMockDeal({ 
        owner_id: 'sdr-user', 
        sdr_id: 'sdr-user', 
        closer_id: 'closer-1' 
      });
      const reason = getReadOnlyReason(deal, 'sdr-user', 'sdr');
      expect(reason).toContain('atribuído a um Closer');
      expect(reason).toContain('leitura');
    });

    it('returns generic message for users without permission', () => {
      const deal = createMockDeal({ owner_id: 'other-user', sdr_id: 'other-sdr' });
      const reason = getReadOnlyReason(deal, 'random-user', 'sdr');
      expect(reason).toContain('não tem permissão');
    });

    it('returns null for closer who can edit their deal', () => {
      const deal = createMockDeal({ closer_id: 'closer-1' });
      const reason = getReadOnlyReason(deal, 'closer-1', 'closer');
      expect(reason).toBeNull();
    });
  });
});

describe('Edge Cases', () => {
  it('handles deal with both sdr_id and owner_id matching same user', () => {
    const deal = createMockDeal({ owner_id: 'user-1', sdr_id: 'user-1' });
    expect(canEditDeal(deal, 'user-1', 'sdr')).toBe(true);
  });

  it('handles empty string userId', () => {
    const deal = createMockDeal();
    expect(canEditDeal(deal, '', 'admin')).toBe(false);
  });

  it('handles deal in closed_lost stage for admin', () => {
    const deal = createMockDeal({ stage: 'closed_lost' });
    expect(canEditDeal(deal, 'admin-user', 'admin')).toBe(true);
  });
});
