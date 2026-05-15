import { format } from 'date-fns';
import { Calendar, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const STATUS_STYLES = {
  confirmed: 'bg-primary/10 text-primary',
  arrived: 'bg-secondary text-secondary-foreground',
  'no-show': 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function MyBookings({ bookings, isLoading, onCancel, cancellingId }) {
  const today = new Date().toISOString().slice(0, 10);

  const handleCancel = (booking) => {
    if (window.confirm('Cancel this reservation? This will remove it from the booking system.')) {
      onCancel?.(booking);
    }
  };

  return (
    <div className="px-6 mt-8">
      <h2 className="font-display text-xl text-foreground mb-4">My Reservations</h2>

      {isLoading ? (
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Calendar className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground italic">No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => {
            const canCancel = b.status === 'confirmed' && b.date > today;

            return (
              <div key={b.id} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg leading-tight">
                      {format(new Date(b.date + 'T00:00:00'), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.time_slot.replace('-', ' – ')} · {b.party_size} guests
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium flex-shrink-0",
                    STATUS_STYLES[b.status] || STATUS_STYLES.confirmed
                  )}>
                    {b.status}
                  </span>
                </div>

                {canCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={cancellingId === b.id}
                    onClick={() => handleCancel(b)}
                    className="mt-3 h-8 px-3 rounded-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {cancellingId === b.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Cancel reservation
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}