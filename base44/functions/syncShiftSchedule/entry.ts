import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Admin-only function: fetches shifts for next 30 days from MM Café Club
// and caches them locally in LoungeScheduleCache.
const CLUB_API_BASE = 'https://mmcafe.base44.app/api';

const fetchStaffDirectory = async (apiKey) => {
  const res = await fetch(`${CLUB_API_BASE}/entities/Staff?limit=1000`, {
    headers: { 'api_key': apiKey, 'Content-Type': 'application/json' }
  });
  if (!res.ok) return new Map();
  const staff = await res.json();
  return new Map((staff || []).map(member => [member.id, member]));
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const apiKey = Deno.env.get('MM_CAFE_CLUB_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'MM_CAFE_CLUB_API_KEY not configured' }, { status: 500 });
    }

    // Build date range: today through +30 days
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 30);
    const fmt = (d) => d.toISOString().slice(0, 10);
    const startDate = fmt(today);
    const endDate = fmt(future);

    // Query MM Café Club Shift entity by date range
    const q = JSON.stringify({
      date: { $gte: startDate, $lte: endDate }
    });
    const url = `${CLUB_API_BASE}/entities/Shift?q=${encodeURIComponent(q)}&limit=500&sort_by=date`;

    const res = await fetch(url, {
      headers: { 'api_key': apiKey, 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: 'Failed to fetch shifts', detail: text }, { status: 502 });
    }

    const shifts = await res.json();
    const staffById = await fetchStaffDirectory(apiKey);

    // Clear existing cache and re-populate
    const existing = await base44.asServiceRole.entities.LoungeScheduleCache.list('-created_date', 1000);
    if (existing && existing.length > 0) {
      await Promise.all(existing.map(r => base44.asServiceRole.entities.LoungeScheduleCache.delete(r.id)));
    }

    const now = new Date().toISOString();
    const records = (shifts || []).map(s => {
      const staff = staffById.get(s.staff_id) || {};

      return {
        shift_id: s.id,
        staff_id: s.staff_id || '',
        staff_name: s.staff_name || staff.full_name || '',
        staff_role: staff.restaurant_role || s.staff_role || '',
        staff_image_url: staff.photo_url || '',
        date: s.date,
        start_time: s.start_time || '',
        end_time: s.end_time || '',
        responsibility: s.responsibility || '',
        synced_at: now
      };
    });

    if (records.length > 0) {
      await base44.asServiceRole.entities.LoungeScheduleCache.bulkCreate(records);
    }

    return Response.json({
      success: true,
      synced_count: records.length,
      range: { from: startDate, to: endDate },
      synced_at: now
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});