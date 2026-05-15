import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DateScroller from '@/components/booking/DateScroller';
import SlotGrid from '@/components/booking/SlotGrid';
import BookingForm from '@/components/booking/BookingForm';
import BookingTerms from '@/components/booking/BookingTerms';
import { CheckCircle2 } from 'lucide-react';

export default function Booking() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const callEdgeFunction = async (name, body) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      }
    );
    return res.json();
  };

  const { data: availability, isLoading } = useQuery({
    queryKey: ['availability', selectedDate],
    queryFn: async () => {
      return callEdgeFunction('getSlotAvailability', { date: selectedDate });
    },
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (formData) => {
      const json = await callEdgeFunction('createBooking', {
        date: selectedDate,
        time_slot: selectedSlot,
        ...formData,
      });
      if (json.error) throw new Error(json.message || json.error);
      return json;
    },
    onSuccess: (data) => {
      toast.success('Reservation confirmed');
      setConfirmed(data.booking);
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => toast.error(err.message),
  });

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="px-6 pt-20 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-3xl mt-6 italic font-light">Confirmed.</h2>
        <p className="text-sm text-muted-foreground mt-3">
          {format(new Date(confirmed.date + 'T00:00:00'), 'EEEE, MMMM d')}
        </p>
        <p className="text-sm text-muted-foreground">
          {confirmed.time_slot.replace('-', ' – ')} · {confirmed.party_size} guests
        </p>
        <button
          onClick={() => setConfirmed(null)}
          className="mt-8 text-xs uppercase tracking-[0.2em] text-primary hover:underline"
        >
          Make another reservation
        </button>
      </motion.div>
    );
  }

  return (
    <div className="pt-10">
      <div className="px-6 mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reserve</p>
        <h1 className="font-display text-3xl mt-2 italic font-light">A table for you.</h1>
      </div>

      <DateScroller selectedDate={selectedDate} onChange={(d) => { setSelectedDate(d); setSelectedSlot(null); }} />

      <div className="mt-8 mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 px-6">Service window</p>
        <SlotGrid
          availability={availability}
          selectedSlot={selectedSlot}
          onSelect={setSelectedSlot}
          isLoading={isLoading}
          isAdmin={user?.role === 'admin'}
        />
      </div>

      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <BookingForm
              defaults={{ name: user?.full_name, phone: '' }}
              onSubmit={createMutation.mutate}
              isSubmitting={createMutation.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <BookingTerms />
    </div>
  );
}