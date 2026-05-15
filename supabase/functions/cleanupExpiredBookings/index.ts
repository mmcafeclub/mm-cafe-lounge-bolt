import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SLOT_END_TIMES: Record<string, string> = {
  "12:00-14:00": "14:00",
  "14:00-16:00": "16:00",
  "16:00-18:00": "18:00",
  "18:00-20:00": "20:00",
  "20:00-22:00": "22:00",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json().catch(() => ({}));
    const isAutomationRun = !!body?.automation;

    if (!isAutomationRun) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user || user.app_metadata?.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: bookings, error } = await adminClient
      .from("bookings")
      .select("id, date, time_slot")
      .order("date", { ascending: false })
      .limit(200);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const toDelete: string[] = [];

    for (const booking of bookings || []) {
      const endTime = SLOT_END_TIMES[booking.time_slot];
      if (!booking.date || !endTime) continue;

      const expiresAt = new Date(`${booking.date}T${endTime}:00+08:00`);
      expiresAt.setHours(expiresAt.getHours() + 2);

      if (expiresAt < now) {
        toDelete.push(booking.id);
      }
    }

    if (toDelete.length > 0) {
      await adminClient.from("bookings").delete().in("id", toDelete);
    }

    return new Response(
      JSON.stringify({ success: true, deleted_count: toDelete.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
