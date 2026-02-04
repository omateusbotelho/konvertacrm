import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CommissionTier {
  min_value: number;
  max_value: number | null;
  percentage: number;
}

interface CommissionRule {
  id: string;
  name: string;
  commission_type: 'qualification' | 'closing' | 'delivery' | 'referral';
  role: 'admin' | 'closer' | 'sdr' | null;
  deal_type: 'retainer' | 'project' | null;
  percentage: number | null;
  is_tiered: boolean;
  is_active: boolean;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  deal_type: 'retainer' | 'project';
  monthly_value: number | null;
  contract_duration_months: number | null;
  owner_id: string;
  sdr_id: string | null;
  closer_id: string | null;
  stage: string;
  company_id: string | null;
}

// Calculate fixed commission
function calculateFixedCommission(dealValue: number, percentage: number): number {
  return dealValue * (percentage / 100);
}

// Calculate tiered commission
function calculateTieredCommission(dealValue: number, tiers: CommissionTier[]): number {
  let totalCommission = 0;
  let remainingValue = dealValue;

  // Sort tiers by min_value ascending
  const sortedTiers = [...tiers].sort((a, b) => a.min_value - b.min_value);

  for (const tier of sortedTiers) {
    if (remainingValue <= 0) break;

    const tierMin = tier.min_value;
    const tierMax = tier.max_value ?? Infinity;

    if (dealValue >= tierMin) {
      const applicableValue = Math.min(remainingValue, tierMax - tierMin);
      
      if (applicableValue > 0) {
        totalCommission += applicableValue * (tier.percentage / 100);
        remainingValue -= applicableValue;
      }
    }
  }

  return totalCommission;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with service role for full access
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing commissions request from user: ${user.id}`);

    // Parse request body
    const { deal_id, actual_close_date, start_recurring } = await req.json();

    if (!deal_id) {
      return new Response(
        JSON.stringify({ error: 'deal_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing deal: ${deal_id}`);

    // 1. Fetch deal details
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('*')
      .eq('id', deal_id)
      .single();

    if (dealError || !deal) {
      console.error('Deal fetch error:', dealError);
      return new Response(
        JSON.stringify({ error: 'Deal not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deal found: ${deal.title}, type: ${deal.deal_type}, value: ${deal.value}`);

    // NEW: Check if closing commissions already exist for this deal
    const { data: existingCommissions, error: checkError } = await supabaseAdmin
      .from('commissions')
      .select('id, commission_type, status')
      .eq('deal_id', deal_id)
      .eq('commission_type', 'closing');

    if (checkError) {
      console.error('Error checking existing commissions:', checkError);
    }

    // If approved/paid closing commission exists, block processing
    if (existingCommissions && existingCommissions.length > 0) {
      const hasProcessedCommission = existingCommissions.some(
        (c: any) => c.status === 'approved' || c.status === 'paid'
      );
      
      if (hasProcessedCommission) {
        console.log(`Deal ${deal_id} already has processed commissions, blocking`);
        return new Response(
          JSON.stringify({ 
            error: 'Comissões já foram processadas para este deal',
            existing_commissions: existingCommissions.length,
            message: 'Este deal já possui comissões aprovadas ou pagas. Se precisar reprocessar, cancele as comissões existentes primeiro.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Found ${existingCommissions.length} existing commission(s) in pending/cancelled status - allowing reprocess`);
    }

    // Verify deal is being closed
    if (deal.stage === 'closed_won') {
      return new Response(
        JSON.stringify({ 
          error: 'Deal is already closed',
          message: 'Este deal já está marcado como ganho.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch all active commission rules with tiers
    const { data: rules, error: rulesError } = await supabaseAdmin
      .from('commission_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      console.error('Rules fetch error:', rulesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch commission rules' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${rules?.length || 0} active commission rules`);

    // 3. Fetch all tiers
    const { data: allTiers, error: tiersError } = await supabaseAdmin
      .from('commission_tiers')
      .select('*');

    if (tiersError) {
      console.error('Tiers fetch error:', tiersError);
    }

    // Group tiers by rule_id
    const tiersByRule: Record<string, CommissionTier[]> = {};
    (allTiers || []).forEach((tier: any) => {
      if (!tiersByRule[tier.rule_id]) {
        tiersByRule[tier.rule_id] = [];
      }
      tiersByRule[tier.rule_id].push(tier);
    });

    // Deal value for commission calculation
    const dealValue = deal.value;
    const commissionsToCreate: any[] = [];

    // 4. Find and calculate CLOSING commission for Closer
    const closerId = deal.closer_id; // No fallback to owner_id - only actual closers get commission
    
    if (!closerId) {
      console.log('No closer assigned to this deal, skipping closing commission');
    } else {
      // Verify the user is actually a Closer or Admin
      const { data: userRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', closerId)
        .single();

      if (userRole?.role !== 'closer' && userRole?.role !== 'admin') {
        console.log(`User ${closerId} has role '${userRole?.role}', not a closer - skipping closing commission`);
      } else {
        const closingRule = (rules || []).find((r: CommissionRule) => 
          r.commission_type === 'closing' &&
          (r.deal_type === null || r.deal_type === deal.deal_type) &&
          (r.role === null || r.role === 'closer')
        );

        if (closingRule) {
          console.log(`Found closing rule: ${closingRule.name}`);
          
          let closingAmount = 0;
          let closingPercentage = closingRule.percentage || 0;

          if (closingRule.is_tiered && tiersByRule[closingRule.id]) {
            closingAmount = calculateTieredCommission(dealValue, tiersByRule[closingRule.id]);
            // For tiered, calculate effective percentage
            closingPercentage = dealValue > 0 ? (closingAmount / dealValue) * 100 : 0;
            console.log(`Tiered closing commission: R$ ${closingAmount.toFixed(2)}`);
          } else if (closingRule.percentage) {
            closingAmount = calculateFixedCommission(dealValue, closingRule.percentage);
            console.log(`Fixed closing commission (${closingRule.percentage}%): R$ ${closingAmount.toFixed(2)}`);
          }

          if (closingAmount > 0) {
            commissionsToCreate.push({
              deal_id: deal.id,
              user_id: closerId,
              commission_type: 'closing',
              base_value: dealValue,
              percentage: closingPercentage,
              amount: closingAmount,
              status: 'pending',
              notes: `Comissão de fechamento - ${deal.title}`,
            });
          }
        } else {
          console.log('No closing rule found for this deal type');
        }
      }
    }

    // 5. Check for existing QUALIFICATION commission and approve it
    if (deal.sdr_id) {
      const { data: existingQualCommission, error: qualError } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('user_id', deal.sdr_id)
        .eq('commission_type', 'qualification')
        .single();

      if (existingQualCommission) {
        // Update existing qualification commission to approved
        console.log(`Approving existing qualification commission: ${existingQualCommission.id}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('commissions')
          .update({ status: 'approved' })
          .eq('id', existingQualCommission.id);

        if (updateError) {
          console.error('Error approving qualification commission:', updateError);
        } else {
          console.log('Qualification commission approved');
        }
      } else {
        // If no qualification commission exists, create one
        console.log('No existing qualification commission found, creating one');
        
        const qualRule = (rules || []).find((r: CommissionRule) => 
          r.commission_type === 'qualification' &&
          (r.deal_type === null || r.deal_type === deal.deal_type) &&
          (r.role === null || r.role === 'sdr')
        );

        if (qualRule) {
          let qualAmount = 0;
          let qualPercentage = qualRule.percentage || 0;

          if (qualRule.is_tiered && tiersByRule[qualRule.id]) {
            qualAmount = calculateTieredCommission(dealValue, tiersByRule[qualRule.id]);
            qualPercentage = dealValue > 0 ? (qualAmount / dealValue) * 100 : 0;
          } else if (qualRule.percentage) {
            qualAmount = calculateFixedCommission(dealValue, qualRule.percentage);
          }

          if (qualAmount > 0) {
            commissionsToCreate.push({
              deal_id: deal.id,
              user_id: deal.sdr_id,
              commission_type: 'qualification',
              base_value: dealValue,
              percentage: qualPercentage,
              amount: qualAmount,
              status: 'approved', // Auto-approve since deal is won
              notes: `Comissão de qualificação - ${deal.title}`,
            });
          }
        }
      }
    }

    // 6. Create commissions in database
    if (commissionsToCreate.length > 0) {
      console.log(`Creating ${commissionsToCreate.length} commission(s)`);
      
      const { data: createdCommissions, error: insertError } = await supabaseAdmin
        .from('commissions')
        .insert(commissionsToCreate)
        .select();

      if (insertError) {
        console.error('Error creating commissions:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create commissions', details: insertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Created commissions: ${JSON.stringify(createdCommissions)}`);
    }

    // 7. Update deal to closed_won
    const updateData: any = {
      stage: 'closed_won',
      probability: 100,
      actual_close_date: actual_close_date || new Date().toISOString().split('T')[0],
    };

    const { error: updateDealError } = await supabaseAdmin
      .from('deals')
      .update(updateData)
      .eq('id', deal_id);

    if (updateDealError) {
      console.error('Error updating deal:', updateDealError);
      return new Response(
        JSON.stringify({ error: 'Failed to update deal', details: updateDealError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Create first invoice for retainer deals if requested
    let invoiceCreated = false;
    if (deal.deal_type === 'retainer' && start_recurring && deal.monthly_value) {
      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${deal.id.substring(0, 6).toUpperCase()}`;
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days to pay

      const { error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert({
          deal_id: deal.id,
          company_id: deal.company_id,
          invoice_number: invoiceNumber,
          amount: deal.monthly_value,
          issue_date: now.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          is_recurring: true,
          recurrence_month: now.getMonth() + 1,
          recurrence_year: now.getFullYear(),
          status: 'pending',
          notes: `Primeira mensalidade - ${deal.title}`,
        });

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
      } else {
        invoiceCreated = true;
        console.log('First invoice created for retainer deal');
      }
    }

    // 9. Log audit entry
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'deal_closed_won',
        resource_type: 'deals',
        resource_id: deal.id,
        changes: {
          commissions_created: commissionsToCreate.length,
          invoice_created: invoiceCreated,
          actual_close_date: updateData.actual_close_date,
        },
      });

    console.log('Deal successfully closed with commissions processed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deal closed successfully',
        deal_id: deal.id,
        commissions_created: commissionsToCreate.length,
        invoice_created: invoiceCreated,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
