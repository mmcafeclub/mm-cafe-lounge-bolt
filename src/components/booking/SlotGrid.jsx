import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const SLOT_LABELS = {
  '12:00-14:00': 'Lunch',
  '14:00-16:00': 'Afternoon',
  '16:00-18:00': 'Tea',
  '18:00-20:00': 'Dinner',
  '20:00-22:00': 'Late Evening',
};

export default function SlotGrid({ availability, selectedSlot, onSelect, isLoading, isAdmin = false }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slots = availability?.slots || {};

  return (
    <div className="px-6 grid grid-cols-1 gap-2">
      {Object.entries(slots).map(([slot, info]) => {
        const active = slot === selectedSlot;
        const full = info.is_full;
        return (
          <button
            key={slot}
            disabled={full}
            onClick={() => onSelect(slot)}
            className={cn(
              "group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left",
              full
                ? "bg-muted border-border opacity-50 cursor-not-allowed"
                : active
                  ? "bg-foreground text-background border-foreground shadow-md"
                  : "bg-card border-border hover:border-primary/50"
            )}
          >
            <div>
              <p className={cn(
                "font-display text-lg leading-tight",
                active ? "text-background" : "text-foreground"
              )}>
                {slot.replace('-', ' – ')}
              </p>
              <p className={cn(
                "text-xs mt-0.5 tracking-wide",
                active ? "text-background/70" : "text-muted-foreground"
              )}>
                {SLOT_LABELS[slot]}
              </p>
            </div>
            <div className="text-right">
              {full ? (
                <span className="text-[10px] uppercase tracking-wider text-destructive font-semibold">
                  Area Full
                </span>
              ) : isAdmin ? (
                <>
                  <p className={cn(
                    "text-xs font-medium",
                    active ? "text-background" : "text-primary"
                  )}>
                    {info.available} left
                  </p>
                  <p className={cn(
                    "text-[10px] mt-0.5",
                    active ? "text-background/60" : "text-muted-foreground"
                  )}>
                    of {info.capacity}
                  </p>
                </>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}