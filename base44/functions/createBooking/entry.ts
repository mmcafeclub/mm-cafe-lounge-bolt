import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Validates and creates a booking with capacity check (max 8 per slot)
// and 21-day booking window enforcement.
const MAX_PER_SLOT = 8;
const BOOKING_WINDOW_DAYS = 21;
const MAX_UPCOMING_BOOKINGS_PER_USER = 3;
const VALID_SLOTS = ['12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00', '20:00-22:00'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, time_slot, customer_name, customer_phone, party_size, member_id, notes } = body;

    // Field validation
    if (!date || !time_slot || !customer_name || !customer_phone || !party_size) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!VALID_SLOTS.includes(time_slot)) {
      return Response.json({ error: 'Invalid time slot' }, { status: 400 });
    }

    const normalizedPhone = String(customer_phone).replace(/[^0-9+]/g, '');
    if (normalizedPhone.length < 8) {
      return Response.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // 21-day window check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date + 'T00:00:00');
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + BOOKING_WINDOW_DAYS);

    if (bookingDate < today) {
      return Response.json({ error: 'Cannot book past dates' }, { status: 400 });
    }
    if (bookingDate > maxDate) {
      return Response.json({ error: `Bookings only open ${BOOKING_WINDOW_DAYS} days in advance` }, { status: 400 });
    }

    const todayString = today.toISOString().slice(0, 10);
    const userBookings = await base44.asServiceRole.entities.Booking.filter({
      created_by: user.email,
      status: 'confirmed'
    });
    const upcomingUserBookings = userBookings.filter(booking => booking.date >= todayString);

    if (upcomingUserBookings.some(booking => booking.date === date)) {
      return Response.json({ error: 'You already have a reservation for this date' }, { status: 409 });
    }
    if (upcomingUserBookings.length >= MAX_UPCOMING_BOOKINGS_PER_USER) {
      return Response.json({ error: `You can only hold ${MAX_UPCOMING_BOOKINGS_PER_USER} upcoming reservations at a time` }, { status: 409 });
    }

    // Capacity check
    const existing = await base44.asServiceRole.entities.Booking.filter({
      date,
      time_slot,
      status: 'confirmed'
    });

    if (existing.length >= MAX_PER_SLOT) {
      return Response.json({
        error: 'Area Full',
        message: 'This time slot has reached its maximum capacity. Please choose another slot.'
      }, { status: 409 });
    }

    // Create the booking (as user)
    const booking = await base44.entities.Booking.create({
      date,
      time_slot,
      customer_name,
      customer_phone: normalizedPhone,
      party_size: Number(party_size),
      member_id: member_id || '',
      notes: notes || '',
      status: 'confirmed'
    });

    return Response.json({ success: true, booking, remaining: MAX_PER_SLOT - existing.length - 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});