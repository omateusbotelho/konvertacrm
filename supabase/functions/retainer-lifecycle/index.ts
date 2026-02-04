import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RetainerDeal {
  id: string;
  company_id: string;
  monthly_value: number;
  monthly_hours: number;
  hours_consumed: number;
  hours_rollover: boolean;
  contract_duration_months: number;
  created_at: string;
  closer_id: string;
  title: string;
  actual_close_date: string | null;
  companies?: {
    name: string;
  } | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const dueDate = new Date(currentYear, now.getMonth(), 10); // Day 10 of current month

    // Get all active retainer deals that are closed_won
    const { data: retainerDeals, error: dealsError } = await supabase
      .from("deals")
      .select("*")
      .eq("deal_type", "retainer")
      .eq("stage", "closed_won")
      .not("monthly_value", "is", null);

    if (dealsError) {
      throw new Error(`Error fetching deals: ${dealsError.message}`);
    }

    const results = {
      invoicesCreated: 0,
      hoursReset: 0,
      errors: [] as string[],
    };

    for (const deal of retainerDeals as RetainerDeal[]) {
      // Check if invoice already exists for this month
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("deal_id", deal.id)
        .eq("recurrence_month", currentMonth)
        .eq("recurrence_year", currentYear)
        .maybeSingle();

      if (!existingInvoice) {
        // Generate invoice number
        const invoiceNumber = `INV-${deal.id.slice(0, 8).toUpperCase()}-${currentYear}${String(currentMonth).padStart(2, "0")}`;

        // Create monthly invoice
        const { error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            deal_id: deal.id,
            company_id: deal.company_id,
            amount: deal.monthly_value,
            issue_date: now.toISOString().split("T")[0],
            due_date: dueDate.toISOString().split("T")[0],
            is_recurring: true,
            recurrence_month: currentMonth,
            recurrence_year: currentYear,
            invoice_number: invoiceNumber,
            status: "pending",
          });

        if (invoiceError) {
          results.errors.push(`Invoice error for deal ${deal.id}: ${invoiceError.message}`);
        } else {
          results.invoicesCreated++;
        }
      }

      // Calculate rollover hours if enabled
      let rolloverHours = 0;
      if (deal.hours_rollover && deal.monthly_hours) {
        rolloverHours = Math.max(0, deal.monthly_hours - (deal.hours_consumed || 0));
      }

      // Reset hours_consumed for the new month
      // If rollover is enabled, we add the unused hours to the new month's allocation
      const { error: hoursError } = await supabase
        .from("deals")
        .update({
          hours_consumed: 0,
          // Note: In a real implementation, you might want to track rollover separately
          updated_at: now.toISOString(),
        })
        .eq("id", deal.id);

      if (hoursError) {
        results.errors.push(`Hours reset error for deal ${deal.id}: ${hoursError.message}`);
      } else {
        results.hoursReset++;
      }
    }

    // Check for contracts expiring soon (30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringDeals } = await supabase
      .from("deals")
      .select(`
        id, 
        title, 
        closer_id, 
        company_id, 
        actual_close_date, 
        created_at, 
        contract_duration_months,
        companies!deals_company_id_fkey (name)
      `)
      .eq("deal_type", "retainer")
      .eq("stage", "closed_won");

    const contractAlerts: string[] = [];
    const notificationsCreated: string[] = [];
    
    for (const deal of expiringDeals || []) {
      // Use actual_close_date as contract start date if available
      const startDateStr = deal.actual_close_date || deal.created_at;
      if (startDateStr && deal.contract_duration_months && deal.closer_id) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + deal.contract_duration_months);
        
        // Check if contract ends within 30 days
        if (endDate <= thirtyDaysFromNow && endDate > now) {
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          // Handle companies which may be returned as array or single object
          const companiesData = deal.companies as { name: string } | { name: string }[] | null;
          const companyName = Array.isArray(companiesData) 
            ? companiesData[0]?.name 
            : companiesData?.name || 'Cliente';
          
          contractAlerts.push(`Deal ${deal.id} (${deal.title}) expires in ${daysUntilExpiry} days`);
          
          // Check if notification already exists for this deal this month
          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("deal_id", deal.id)
            .eq("type", "contract_expiring")
            .gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
            .maybeSingle();

          if (!existingNotification) {
            // Create in-app notification for the closer
            const { error: notifError } = await supabase.from("notifications").insert({
              user_id: deal.closer_id,
              title: `Cliente ${companyName} renova em ${daysUntilExpiry} dias`,
              message: `O contrato "${deal.title}" vence em ${endDate.toLocaleDateString('pt-BR')}. Entre em contato para iniciar o processo de renovação.`,
              type: "contract_expiring",
              deal_id: deal.id,
              company_id: deal.company_id,
            });

            if (!notifError) {
              notificationsCreated.push(`Notification sent to closer for deal ${deal.id}`);
            } else {
              results.errors.push(`Notification error for deal ${deal.id}: ${notifError.message}`);
            }
          }

          // Check if renewal activity already exists this month
          const { data: existingActivity } = await supabase
            .from("activities")
            .select("id")
            .eq("deal_id", deal.id)
            .eq("title", "Alerta: Contrato próximo do vencimento")
            .gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
            .maybeSingle();

          if (!existingActivity) {
            // Create renewal alert activity for the closer
            await supabase.from("activities").insert({
              title: "Alerta: Contrato próximo do vencimento",
              description: `O contrato "${deal.title}" vence em ${daysUntilExpiry} dias (${endDate.toLocaleDateString('pt-BR')}). Agende uma reunião de renovação com o cliente.`,
              type: "task",
              deal_id: deal.id,
              company_id: deal.company_id,
              assigned_to: deal.closer_id,
              created_by: deal.closer_id,
              due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
              is_completed: false,
            });
          }
        }
      }
    }

    console.log("Retainer lifecycle completed:", {
      invoicesCreated: results.invoicesCreated,
      hoursReset: results.hoursReset,
      contractAlerts: contractAlerts.length,
      notificationsCreated: notificationsCreated.length,
      errors: results.errors.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          ...results,
          contractAlerts,
          notificationsCreated,
        },
        processedAt: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Retainer lifecycle error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
