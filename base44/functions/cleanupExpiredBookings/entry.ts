import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SLOT_END_TIMES = {
  '12:00-14:00': '14:00',
  '14:00-16:00': '16:00',
  '16:00-18:00': '18:00',
  '18:00-20:00': '20:00',
  '20:00-22:00': '22:00'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const isAutomationRun = !!body?.automation;

    if (!isAutomationRun) {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    const now = new Date();
    const bookings = await base44.asServiceRole.entities.Booking.list('-date', 200);
    let deletedCount = 0;

    for (const booking of bookings) {
      const endTime = SLOT_END_TIMES[booking.time_slot];
      if (!booking.date || !endTime) continue;

      const expiresAt = new Date(`${booking.date}T${endTime}:00+08:00`);
      expiresAt.setHours(expiresAt.getHours() + 2);

      if (expiresAt < now) {
        await base44.asServiceRole.entities.Booking.delete(booking.id);
        deletedCount += 1;
      }
    }

    return Response.json({ success: true, deleted_count: deletedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});