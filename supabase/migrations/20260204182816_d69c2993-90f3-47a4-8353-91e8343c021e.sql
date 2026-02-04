-- ===========================================
-- Performance Indexes - KonvertaCRM
-- ===========================================

-- Enable extension for fuzzy search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Commissions indexes
CREATE INDEX IF NOT EXISTS idx_commissions_deal_id ON public.commissions(deal_id);
CREATE INDEX IF NOT EXISTS idx_commissions_user_status ON public.commissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_type_status ON public.commissions(commission_type, status);

-- Invoices indexes  
CREATE INDEX IF NOT EXISTS idx_invoices_deal_id ON public.invoices(deal_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_status ON public.invoices(company_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON public.invoices(is_recurring, recurrence_year, recurrence_month) WHERE is_recurring = true;

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_assigned_completed ON public.activities(assigned_to, is_completed);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON public.activities(due_date) WHERE is_completed = false;

-- Deals composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deals_stage_date ON public.deals(stage, expected_close_date);
CREATE INDEX IF NOT EXISTS idx_deals_type_stage ON public.deals(deal_type, stage);
CREATE INDEX IF NOT EXISTS idx_deals_value ON public.deals(value DESC) WHERE stage IN ('proposal', 'negotiation');
CREATE INDEX IF NOT EXISTS idx_deals_owner ON public.deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_sdr ON public.deals(sdr_id) WHERE sdr_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_closer ON public.deals(closer_id) WHERE closer_id IS NOT NULL;

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON public.audit_logs(user_id, created_at DESC);

-- LGPD indexes (adjusted for actual schema)
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_contact ON public.lgpd_consents(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_company ON public.lgpd_consents(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_revoked ON public.lgpd_consents(revoked, consent_type);
CREATE INDEX IF NOT EXISTS idx_lgpd_tokens_email ON public.lgpd_tokens(email);
CREATE INDEX IF NOT EXISTS idx_lgpd_tokens_token ON public.lgpd_tokens(token) WHERE used = false;

-- Profiles for searches
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = true;

-- Companies for searches
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm ON public.companies USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON public.companies(created_by);

-- Contacts for searches
CREATE INDEX IF NOT EXISTS idx_contacts_full_name_trgm ON public.contacts USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_company_primary ON public.contacts(company_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email) WHERE email IS NOT NULL;

-- Commission rules/tiers
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON public.commission_rules(is_active, commission_type);
CREATE INDEX IF NOT EXISTS idx_commission_tiers_rule ON public.commission_tiers(rule_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);