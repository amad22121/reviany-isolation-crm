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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller identity
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, tenant_id")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerRole = callerProfile.role;
    const { email, full_name, phone, role, tenant_id } = await req.json();

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: "Email, nom et rôle requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Map frontend role labels to DB enum values
    const roleMap: Record<string, string> = {
      proprietaire: "owner",
      gestionnaire: "manager",
      representant: "rep",
      owner: "owner",
      manager: "manager",
      rep: "rep",
    };
    const dbRole = roleMap[role];
    if (!dbRole) {
      return new Response(
        JSON.stringify({ error: "Rôle invalide: " + role }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("Role mapping:", role, "->", dbRole);

    // Permission checks
    const isRep = callerRole === "rep";
    const isManager = callerRole === "manager";
    const targetIsRep = dbRole === "rep";
    const targetIsOwner = dbRole === "owner";

    if (isRep) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isManager && !targetIsRep) {
      return new Response(
        JSON.stringify({
          error: "Un gestionnaire ne peut inviter que des représentants",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (targetIsOwner) {
      return new Response(
        JSON.stringify({ error: "Impossible de créer un propriétaire" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const effectiveTenantId = tenant_id || callerProfile.tenant_id || "default";

    // Generate temporary password
    const tempPassword =
      "Temp-" + crypto.randomUUID().slice(0, 8) + "!" + Math.random().toString(36).slice(-4);

    // Create auth user with temporary password (no email sent)
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name,
          tenant_id: effectiveTenantId,
        },
      });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Cet email est déjà enregistré" }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("Create user error:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = newUser.user.id;
    console.log("Auth user created successfully:", userId);

    // Upsert profile to ensure it exists with correct data
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          display_name: full_name,
          email: email || "",
          phone: phone || null,
          role: dbRole,
          tenant_id: effectiveTenantId,
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Profile upsert FAILED:", profileError);
      return new Response(
        JSON.stringify({ error: "Utilisateur auth créé mais échec de création du profil: " + profileError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Profile upserted successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        temp_password: tempPassword,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
