import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns slot availability counts for a given date (max 8 per slot).
const MAX_PER_SLOT = 8;
const VALID_SLOTS = ['12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date } = body;
    if (!date) {
      return Response.json({ error: 'date is required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({
      date,
      status: 'confirmed'
    });

    const counts = {};
    for (const slot of VALID_SLOTS) {
      const used = bookings.filter(b => b.time_slot === slot).length;
      counts[slot] = {
        used,
        capacity: MAX_PER_SLOT,
        available: Math.max(0, MAX_PER_SLOT - used),
        is_full: used >= MAX_PER_SLOT
      };
    }

    return Response.json({ date, slots: counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});