-- ===========================================
-- KonvertaOS Database Schema
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE public.app_role AS ENUM ('admin', 'closer', 'sdr');
CREATE TYPE public.company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+');
CREATE TYPE public.deal_type AS ENUM ('retainer', 'project');
CREATE TYPE public.deal_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
CREATE TYPE public.deal_source AS ENUM ('inbound', 'outbound', 'referral', 'event', 'partner', 'other');
CREATE TYPE public.loss_reason AS ENUM ('price', 'timing', 'competitor', 'no_budget', 'no_fit', 'other');
CREATE TYPE public.activity_type AS ENUM ('call', 'meeting', 'email', 'task', 'note');
CREATE TYPE public.commission_type AS ENUM ('qualification', 'closing', 'delivery', 'referral');
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.consent_type AS ENUM ('marketing', 'data_processing', 'both');

-- ===========================================
-- PROFILES TABLE (linked to auth.users)
-- ===========================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- ===========================================
-- USER ROLES TABLE (separate for security)
-- ===========================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- ===========================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECK
-- ===========================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ===========================================
-- COMPANIES TABLE
-- ===========================================

CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE,
  industry VARCHAR(100),
  company_size company_size,
  website TEXT,
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX idx_companies_created_by ON public.companies(created_by);

-- ===========================================
-- CONTACTS TABLE
-- ===========================================

CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_is_primary ON public.contacts(is_primary);
CREATE INDEX idx_contacts_created_by ON public.contacts(created_by);

-- ===========================================
-- DEALS TABLE
-- ===========================================

CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  deal_type deal_type NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  monthly_value DECIMAL(12,2),
  contract_duration_months INTEGER,
  monthly_hours INTEGER,
  hours_consumed INTEGER DEFAULT 0,
  hours_rollover BOOLEAN DEFAULT false,
  stage deal_stage NOT NULL DEFAULT 'lead',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  source deal_source NOT NULL,
  referred_by UUID REFERENCES public.companies(id),
  loss_reason loss_reason,
  loss_competitor VARCHAR(255),
  loss_notes TEXT,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  sdr_id UUID REFERENCES auth.users(id),
  closer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deals_company_id ON public.deals(company_id);
CREATE INDEX idx_deals_stage ON public.deals(stage);
CREATE INDEX idx_deals_owner_id ON public.deals(owner_id);
CREATE INDEX idx_deals_deal_type ON public.deals(deal_type);
CREATE INDEX idx_deals_expected_close_date ON public.deals(expected_close_date);
CREATE INDEX idx_deals_sdr_id ON public.deals(sdr_id);
CREATE INDEX idx_deals_closer_id ON public.deals(closer_id);

-- ===========================================
-- ACTIVITIES TABLE
-- ===========================================

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type activity_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX idx_activities_company_id ON public.activities(company_id);
CREATE INDEX idx_activities_assigned_to ON public.activities(assigned_to);
CREATE INDEX idx_activities_is_completed ON public.activities(is_completed);
CREATE INDEX idx_activities_due_date ON public.activities(due_date);

-- ===========================================
-- COMMISSION RULES TABLE
-- ===========================================

CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  role app_role,
  deal_type deal_type,
  commission_type commission_type NOT NULL,
  is_tiered BOOLEAN DEFAULT false,
  percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commission_rules_is_active ON public.commission_rules(is_active);
CREATE INDEX idx_commission_rules_role ON public.commission_rules(role);

-- ===========================================
-- COMMISSION TIERS TABLE
-- ===========================================

CREATE TABLE public.commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.commission_rules(id) ON DELETE CASCADE,
  min_value DECIMAL(12,2) NOT NULL,
  max_value DECIMAL(12,2),
  percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commission_tiers_rule_id ON public.commission_tiers(rule_id);

-- ===========================================
-- COMMISSIONS TABLE
-- ===========================================

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_type commission_type NOT NULL,
  base_value DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status commission_status DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commissions_deal_id ON public.commissions(deal_id);
CREATE INDEX idx_commissions_user_id ON public.commissions(user_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);
CREATE INDEX idx_commissions_payment_date ON public.commissions(payment_date);

-- ===========================================
-- INVOICES TABLE
-- ===========================================

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status invoice_status DEFAULT 'pending',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_month INTEGER,
  recurrence_year INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_deal_id ON public.invoices(deal_id);
CREATE INDEX idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_payment_date ON public.invoices(payment_date);

-- ===========================================
-- AUDIT LOGS TABLE
-- ===========================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ===========================================
-- LGPD CONSENTS TABLE
-- ===========================================

CREATE TABLE public.lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  consent_given BOOLEAN NOT NULL,
  consent_type consent_type NOT NULL,
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lgpd_consents_contact_id ON public.lgpd_consents(contact_id);
CREATE INDEX idx_lgpd_consents_company_id ON public.lgpd_consents(company_id);

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES - PROFILES
-- ===========================================

CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ===========================================
-- RLS POLICIES - USER ROLES
-- ===========================================

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - COMPANIES
-- ===========================================

CREATE POLICY "Authenticated users can view companies"
ON public.companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update companies"
ON public.companies FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete companies"
ON public.companies FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - CONTACTS
-- ===========================================

CREATE POLICY "Authenticated users can view contacts"
ON public.contacts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create contacts"
ON public.contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update contacts"
ON public.contacts FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - DEALS
-- ===========================================

CREATE POLICY "Authenticated users can view deals"
ON public.deals FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create deals"
ON public.deals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners, SDRs, Closers and admins can update deals"
ON public.deals FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid() 
  OR sdr_id = auth.uid() 
  OR closer_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete deals"
ON public.deals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - ACTIVITIES
-- ===========================================

CREATE POLICY "Authenticated users can view activities"
ON public.activities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create activities"
ON public.activities FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and assigned can update activities"
ON public.activities FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators and admins can delete activities"
ON public.activities FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - COMMISSION RULES
-- ===========================================

CREATE POLICY "Authenticated users can view commission rules"
ON public.commission_rules FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage commission rules"
ON public.commission_rules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - COMMISSION TIERS
-- ===========================================

CREATE POLICY "Authenticated users can view commission tiers"
ON public.commission_tiers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage commission tiers"
ON public.commission_tiers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - COMMISSIONS
-- ===========================================

CREATE POLICY "Users can view own commissions, admins see all"
ON public.commissions FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage commissions"
ON public.commissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - INVOICES
-- ===========================================

CREATE POLICY "Authenticated users can view invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- RLS POLICIES - AUDIT LOGS
-- ===========================================

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ===========================================
-- RLS POLICIES - LGPD CONSENTS
-- ===========================================

CREATE POLICY "Authenticated users can view consents"
ON public.lgpd_consents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create consents"
ON public.lgpd_consents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage consents"
ON public.lgpd_consents FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON public.commission_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();