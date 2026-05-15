import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CLUB_API_BASE = "https://mmcafe.base44.app/api";

const fetchStaffDirectory = async (apiKey: string): Promise<Map<string, any>> => {
  const res = await fetch(`${CLUB_API_BASE}/entities/Staff?limit=1000`, {
    headers: { "api_key": apiKey, "Content-Type": "application/json" },
  });
  if (!res.ok) return new Map();
  const staff = await res.json();
  return new Map((staff || []).map((member: any) => [member.id, member]));
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate the requesting user
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

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userRole = user.app_metadata?.role;
    if (userRole !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("MM_CAFE_CLUB_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "MM_CAFE_CLUB_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build date range: today through +30 days (HK timezone)
    const nowHK = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const startDate = nowHK;
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + 30);
    const endDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(endDateObj);

    // Query MM Café Club Shift entity by date range
    const q = JSON.stringify({ date: { $gte: startDate, $lte: endDate } });
    const url = `${CLUB_API_BASE}/entities/Shift?q=${encodeURIComponent(q)}&limit=500&sort_by=date`;

    const shiftsRes = await fetch(url, {
      headers: { "api_key": apiKey, "Content-Type": "application/json" },
    });

    if (!shiftsRes.ok) {
      const text = await shiftsRes.text();
      return new Response(JSON.stringify({ error: "Failed to fetch shifts", detail: text }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const shifts = await shiftsRes.json();
    const staffById = await fetchStaffDirectory(apiKey);

    // Use service role to clear and repopulate the cache
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: deleteError } = await adminClient
      .from("lounge_schedule_cache")
      .delete()
      .gte("date", "2000-01-01"); // delete all records safely

    if (deleteError) {
      return new Response(JSON.stringify({ error: "Failed to clear cache", detail: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const syncedAt = new Date().toISOString();
    const records = (shifts || []).map((s: any) => {
      const staff = staffById.get(s.staff_id) || {};
      return {
        shift_id: s.id || "",
        staff_id: s.staff_id || "",
        staff_name: s.staff_name || staff.full_name || "",
        staff_role: staff.restaurant_role || s.staff_role || "",
        staff_image_url: staff.photo_url || "",
        date: s.date,
        start_time: s.start_time || "",
        end_time: s.end_time || "",
        responsibility: s.responsibility || "",
        synced_at: syncedAt,
      };
    });

    if (records.length > 0) {
      const { error: insertError } = await adminClient
        .from("lounge_schedule_cache")
        .insert(records);

      if (insertError) {
        return new Response(JSON.stringify({ error: "Failed to insert cache", detail: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced_count: records.length,
        range: { from: startDate, to: endDate },
        synced_at: syncedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
