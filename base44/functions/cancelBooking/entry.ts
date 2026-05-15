import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return Response.json({ error: 'Booking id is required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.status !== 'confirmed') {
      return Response.json({ error: 'Only confirmed reservations can be cancelled' }, { status: 400 });
    }

    const todayHongKong = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    if (booking.date <= todayHongKong && user.role !== 'admin') {
      return Response.json({ error: 'Reservations can only be cancelled before the reservation date' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Booking.delete(booking.id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});