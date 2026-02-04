import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RetainerDeal {
  id: string;
  title: string;
  monthly_value: number;
  company_id: string | null;
  contract_duration_months: number | null;
  actual_close_date: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    console.log(`Generating monthly invoices for ${currentMonth}/${currentYear}`);

    // 1. Find all active retainer deals that are closed_won
    const { data: retainerDeals, error: dealsError } = await supabase
      .from('deals')
      .select('id, title, monthly_value, company_id, contract_duration_months, actual_close_date')
      .eq('deal_type', 'retainer')
      .eq('stage', 'closed_won')
      .not('monthly_value', 'is', null);

    if (dealsError) {
      console.error('Error fetching deals:', dealsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deals', details: dealsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${retainerDeals?.length || 0} active retainer deals`);

    if (!retainerDeals || retainerDeals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active retainer deals found',
          invoices_created: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Security check: Get ALL existing invoices for this month/year (regardless of is_recurring)
    // This prevents any duplicate invoice creation for the same deal/month/year combination
    const dealIds = retainerDeals.map(d => d.id);
    
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('deal_id, invoice_number, is_recurring')
      .in('deal_id', dealIds)
      .eq('recurrence_month', currentMonth)
      .eq('recurrence_year', currentYear);

    if (invoicesError) {
      console.error('Error checking existing invoices:', invoicesError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing invoices', details: invoicesError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a set of deal IDs that already have ANY invoice for this month/year
    const existingDealIds = new Set((existingInvoices || []).map(i => i.deal_id));
    console.log(`Security check: ${existingDealIds.size} deals already have invoices for ${currentMonth}/${currentYear}`);
    
    if (existingInvoices && existingInvoices.length > 0) {
      console.log('Existing invoices:', existingInvoices.map(i => ({ 
        deal_id: i.deal_id, 
        invoice_number: i.invoice_number,
        is_recurring: i.is_recurring 
      })));
    }

    // 3. Filter deals that still need invoices
    const dealsNeedingInvoices = retainerDeals.filter((deal: RetainerDeal) => {
      // Skip if already has invoice for this month
      if (existingDealIds.has(deal.id)) {
        console.log(`Deal ${deal.id} already has invoice for ${currentMonth}/${currentYear}`);
        return false;
      }

      // Check if contract is still active based on duration
      if (deal.contract_duration_months && deal.actual_close_date) {
        const closeDate = new Date(deal.actual_close_date);
        const endDate = new Date(closeDate);
        endDate.setMonth(endDate.getMonth() + deal.contract_duration_months);
        
        if (now > endDate) {
          console.log(`Deal ${deal.id} contract expired on ${endDate.toISOString()}`);
          return false;
        }
      }

      return true;
    });

    console.log(`${dealsNeedingInvoices.length} deals need invoices`);

    if (dealsNeedingInvoices.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All invoices already generated for this month',
          invoices_created: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create invoices for each deal
    const issueDate = new Date(currentYear, currentMonth - 1, 1); // 1st of month
    const dueDate = new Date(currentYear, currentMonth - 1, 10); // 10th of month

    const invoicesToCreate = dealsNeedingInvoices.map((deal: RetainerDeal, index: number) => {
      const invoiceNumber = `INV-${currentYear}${String(currentMonth).padStart(2, '0')}-${deal.id.substring(0, 6).toUpperCase()}-${String(index + 1).padStart(3, '0')}`;
      
      return {
        deal_id: deal.id,
        company_id: deal.company_id,
        invoice_number: invoiceNumber,
        amount: deal.monthly_value,
        issue_date: issueDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
        is_recurring: true,
        recurrence_month: currentMonth,
        recurrence_year: currentYear,
        notes: `Mensalidade ${currentMonth}/${currentYear} - ${deal.title}`,
      };
    });

    console.log(`Creating ${invoicesToCreate.length} invoices`);

    const { data: createdInvoices, error: insertError } = await supabase
      .from('invoices')
      .insert(invoicesToCreate)
      .select();

    if (insertError) {
      console.error('Error creating invoices:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoices', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully created ${createdInvoices?.length || 0} invoices`);

    // 5. Log the operation
    await supabase.from('audit_logs').insert({
      user_id: null, // System operation
      action: 'monthly_invoices_generated',
      resource_type: 'invoices',
      resource_id: 'batch',
      changes: {
        month: currentMonth,
        year: currentYear,
        invoices_created: createdInvoices?.length || 0,
        invoice_ids: createdInvoices?.map(i => i.id) || [],
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${createdInvoices?.length || 0} invoices for ${currentMonth}/${currentYear}`,
        invoices_created: createdInvoices?.length || 0,
        invoices: createdInvoices,
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
