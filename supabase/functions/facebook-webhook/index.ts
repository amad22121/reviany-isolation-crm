import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Facebook verification challenge (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("FACEBOOK_VERIFY_TOKEN") || "reviany_leads_token";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // POST: incoming lead data
  try {
    const body = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const entries = body?.entry || [];
    const leadsToInsert: any[] = [];

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        if (change?.field === "leadgen") {
          const leadData = change?.value || {};
          const formData = leadData?.field_data || [];

          const getField = (name: string) =>
            formData.find((f: any) => f.name?.toLowerCase().includes(name))?.values?.[0] || "";

          leadsToInsert.push({
            full_name: getField("full_name") || getField("name") || "Lead Facebook",
            phone: getField("phone") || getField("phone_number") || "",
            address: getField("street_address") || getField("address") || "",
            city: getField("city") || "",
            has_attic: getField("attic") || getField("entretoit") || "",
            source: "Facebook",
            status: "New Lead",
            notes: `Raw lead ID: ${leadData?.leadgen_id || "unknown"}`,
            created_by_user_id: "facebook-webhook",
          });
        }
      }
    }

    if (leadsToInsert.length > 0) {
      const { error } = await supabase.from("marketing_leads").insert(leadsToInsert);
      if (error) {
        console.error("Insert error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, count: leadsToInsert.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
