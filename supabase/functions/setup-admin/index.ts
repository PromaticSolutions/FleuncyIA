import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "fluency@admin.com";
const ADMIN_PASSWORD = "fluency@dev.2026";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Check if admin user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    let adminUserId: string;

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.id);
      adminUserId = existingAdmin.id;
    } else {
      // Create the admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: "Admin Fluency" }
      });

      if (createError) {
        throw new Error(`Failed to create admin user: ${createError.message}`);
      }

      console.log("Admin user created:", newUser.user?.id);
      adminUserId = newUser.user!.id;
    }

    // Check if admin role already exists
    const { data: existingRole } = await supabase
      .from("admin_users")
      .select("*")
      .eq("user_id", adminUserId)
      .single();

    if (!existingRole) {
      // Add admin role
      const { error: roleError } = await supabase
        .from("admin_users")
        .insert({
          user_id: adminUserId,
          role: "super_admin",
          permissions: ["metrics_read", "metrics_write", "export", "manage_users"]
        });

      if (roleError) {
        throw new Error(`Failed to add admin role: ${roleError.message}`);
      }

      console.log("Admin role added for user:", adminUserId);
    } else {
      console.log("Admin role already exists for user:", adminUserId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user setup complete",
        email: ADMIN_EMAIL 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error setting up admin:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
