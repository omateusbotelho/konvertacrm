import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  company_id: string | null;
  updated_at: string;
}

interface Activity {
  created_at: string;
}

interface Deal {
  created_at: string;
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
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Get all contacts that haven't been updated in 2 years
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select(`
        id,
        full_name,
        email,
        phone,
        linkedin_url,
        notes,
        company_id,
        updated_at
      `)
      .lt("updated_at", twoYearsAgo.toISOString());

    if (contactsError) {
      throw new Error(`Error fetching contacts: ${contactsError.message}`);
    }

    const results = {
      contactsChecked: contacts?.length || 0,
      contactsAnonymized: 0,
      errors: [] as string[],
    };

    for (const contact of contacts as Contact[]) {
      // Check for recent activities related to this contact's company
      let lastInteraction = new Date(contact.updated_at);

      // Get activities for the contact's company
      if (contact.company_id) {
        const { data: activities } = await supabase
          .from("activities")
          .select("created_at")
          .eq("company_id", contact.company_id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (activities && activities.length > 0) {
          const activityDate = new Date(activities[0].created_at);
          if (activityDate > lastInteraction) {
            lastInteraction = activityDate;
          }
        }

        // Get deals for the contact's company
        const { data: deals } = await supabase
          .from("deals")
          .select("created_at, updated_at")
          .eq("company_id", contact.company_id)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (deals && deals.length > 0) {
          const dealDate = new Date(deals[0].updated_at || deals[0].created_at);
          if (dealDate > lastInteraction) {
            lastInteraction = dealDate;
          }
        }
      }

      // Check if last interaction is older than 2 years
      if (lastInteraction < twoYearsAgo) {
        // Anonymize the contact
        const anonymizedName = `Usuário Removido #${contact.id.slice(0, 8)}`;

        const { error: updateError } = await supabase
          .from("contacts")
          .update({
            full_name: anonymizedName,
            email: null,
            phone: null,
            linkedin_url: null,
            notes: null,
            updated_at: now.toISOString(),
          })
          .eq("id", contact.id);

        if (updateError) {
          results.errors.push(`Error anonymizing contact ${contact.id}: ${updateError.message}`);
        } else {
          results.contactsAnonymized++;

          // Revoke any LGPD consents
          await supabase
            .from("lgpd_consents")
            .update({
              revoked: true,
              revoked_at: now.toISOString(),
            })
            .eq("contact_id", contact.id);

          // Log the anonymization in audit_logs
          await supabase
            .from("audit_logs")
            .insert({
              action: "anonymize",
              resource_type: "contact",
              resource_id: contact.id,
              changes: {
                reason: "LGPD - 2 years without interaction",
                original_name: contact.full_name,
                anonymized_at: now.toISOString(),
              },
            });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        processedAt: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("LGPD anonymization error:", error);
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
