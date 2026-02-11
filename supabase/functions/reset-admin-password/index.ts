import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email and newPassword are required" }),
        { status: 400 }
      );
    }

    // Update the user's password using service role
    const { error } = await supabase.auth.admin.updateUserById(
      // First, get the user by email
      (
        await supabase
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .single()
      ).data?.user_id,
      { password: newPassword }
    );

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Password reset for ${email}`,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    );
  }
});
