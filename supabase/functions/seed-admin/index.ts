import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "foovafoods@gmail.com";
const ADMIN_PASSWORD = "Foovafoods@@1113";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    let userId: string;

    if (existingAdmin) {
      // Update existing admin's password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(existingAdmin.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Foova Admin" },
      });
      if (error) throw error;
      userId = existingAdmin.id;
    } else {
      // Create new admin user
      const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Foova Admin" },
      });
      if (error) throw error;
      userId = user.user.id;
    }

    // Ensure admin role exists
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );

    // Ensure profile exists
    await supabaseAdmin.from("profiles").upsert(
      { user_id: userId, full_name: "Foova Admin" },
      { onConflict: "user_id" }
    );

    return new Response(JSON.stringify({
      message: existingAdmin ? "Admin password updated" : "Admin created",
      email: ADMIN_EMAIL,
      userId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
