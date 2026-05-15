import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import GiftList from '@/components/profile/GiftList';
import MyBookings from '@/components/profile/MyBookings';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: gifts = [], isLoading: giftsLoading } = useQuery({
    queryKey: ['gifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-bookings', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('created_by', user.email)
        .order('date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
  });

  const refreshGifts = () => queryClient.invalidateQueries({ queryKey: ['gifts'] });
  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['availability'] });
  };

  const createGift = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('gifts').insert({
        name: data.title,
        description: data.description,
        image_url: data.image_url,
        points_required: data.points_required,
        is_active: true,
        stock: 0,
      });
      if (error) throw error;
    },
    onSuccess: refreshGifts,
  });

  const updateGift = useMutation({
    mutationFn: async ({ item, data }) => {
      const { error } = await supabase.from('gifts').update({
        name: data.title,
        description: data.description,
        image_url: data.image_url,
        points_required: data.points_required,
      }).eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: refreshGifts,
  });

  const deleteGift = useMutation({
    mutationFn: async (item) => {
      const { error } = await supabase.from('gifts').delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: refreshGifts,
  });

  const cancelBooking = useMutation({
    mutationFn: async (booking) => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancelBooking`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ bookingId: booking.id }),
        }
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success('Reservation cancelled');
      refreshBookings();
    },
    onError: (error) => toast.error(error.message || 'Cancellation failed'),
  });

  return (
    <div className="pt-10 pb-6">
      <div className="px-6 mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
        <h1 className="font-display text-3xl mt-2 italic font-light">Your visits.</h1>
      </div>

      <MyBookings
        bookings={bookings}
        isLoading={bookingsLoading}
        onCancel={(booking) => cancelBooking.mutate(booking)}
        cancellingId={cancelBooking.variables?.id}
      />

      <GiftList
        gifts={gifts}
        isLoading={giftsLoading}
        userPoints={0}
        isAdmin={user?.role === 'admin'}
        onCreate={(data) => createGift.mutateAsync(data)}
        onUpdate={(item, data) => updateGift.mutateAsync({ item, data })}
        onDelete={(item) => deleteGift.mutateAsync(item)}
      />

      <div className="px-6 mt-10">
        <Button
          variant="ghost"
          onClick={() => base44.auth.logout()}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}