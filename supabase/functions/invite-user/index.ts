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

    // Verify caller identity using anon client
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

    // Get caller's role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile) {
      return new Response(JSON.stringify({ error: "Profil introuvable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerRole = callerProfile.role;

    const { email, display_name, phone, role, workspace_id } = await req.json();

    if (!email || !display_name || !role) {
      return new Response(
        JSON.stringify({ error: "Email, nom et rôle requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Permission checks
    if (callerRole === "representant") {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (callerRole === "gestionnaire" && role !== "representant") {
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

    if (role === "proprietaire") {
      return new Response(
        JSON.stringify({ error: "Impossible de créer un propriétaire" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create auth user with invite
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { display_name },
      });

    if (createError) {
      // Check if user already exists
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

    // Update profile (auto-created by trigger) with role, phone, invited_at
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        display_name,
        phone: phone || null,
        role,
        invited_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Get profile id
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    // Create team_members entry
    if (profile) {
      const { error: tmError } = await adminClient
        .from("team_members")
        .insert({
          workspace_id: workspace_id || "default",
          user_id: userId,
          profile_id: profile.id,
          role,
        });

      if (tmError) {
        console.error("Team member insert error:", tmError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
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
