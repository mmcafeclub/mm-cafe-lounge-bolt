import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_PER_SLOT = 8;
const BOOKING_WINDOW_DAYS = 21;
const MAX_UPCOMING_BOOKINGS_PER_USER = 3;
const VALID_SLOTS = ["12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00", "20:00-22:00"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const body = await req.json();
    const { date, time_slot, customer_name, customer_phone, party_size, member_id, notes } = body;

    if (!date || !time_slot || !customer_name || !customer_phone || !party_size) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!VALID_SLOTS.includes(time_slot)) {
      return new Response(JSON.stringify({ error: "Invalid time slot" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = String(customer_phone).replace(/[^0-9+]/g, "");
    if (normalizedPhone.length < 8) {
      return new Response(JSON.stringify({ error: "Please enter a valid phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 21-day window check (HK timezone)
    const todayHK = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());

    const maxDateObj = new Date();
    maxDateObj.setDate(maxDateObj.getDate() + BOOKING_WINDOW_DAYS);
    const maxDateHK = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Hong_Kong",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(maxDateObj);

    if (date < todayHK) {
      return new Response(JSON.stringify({ error: "Cannot book past dates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (date > maxDateHK) {
      return new Response(JSON.stringify({ error: `Bookings only open ${BOOKING_WINDOW_DAYS} days in advance` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const userEmail = user.email!;

    // Check user's upcoming bookings
    const { data: userBookings } = await adminClient
      .from("bookings")
      .select("id, date")
      .eq("created_by", userEmail)
      .eq("status", "confirmed")
      .gte("date", todayHK);

    const upcomingUserBookings = userBookings || [];

    if (upcomingUserBookings.some((b) => b.date === date)) {
      return new Response(JSON.stringify({ error: "You already have a reservation for this date" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (upcomingUserBookings.length >= MAX_UPCOMING_BOOKINGS_PER_USER) {
      return new Response(
        JSON.stringify({ error: `You can only hold ${MAX_UPCOMING_BOOKINGS_PER_USER} upcoming reservations at a time` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Capacity check
    const { data: existing } = await adminClient
      .from("bookings")
      .select("id")
      .eq("date", date)
      .eq("time_slot", time_slot)
      .eq("status", "confirmed");

    const usedCount = (existing || []).length;
    if (usedCount >= MAX_PER_SLOT) {
      return new Response(
        JSON.stringify({ error: "Area Full", message: "This time slot has reached its maximum capacity. Please choose another slot." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create booking
    const { data: booking, error: insertError } = await adminClient
      .from("bookings")
      .insert({
        date,
        time_slot,
        customer_name,
        customer_phone: normalizedPhone,
        party_size: Number(party_size),
        member_id: member_id || "",
        notes: notes || "",
        status: "confirmed",
        created_by: userEmail,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, booking, remaining: MAX_PER_SLOT - usedCount - 1 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
