import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DateScroller({ selectedDate, onChange }) {
  const today = new Date();
  const days = Array.from({ length: 22 }, (_, i) => addDays(today, i));

  return (
    <div className="px-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Select date
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const active = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => onChange(dateStr)}
              className={cn(
                "flex-shrink-0 w-14 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all duration-300",
                active
                  ? "bg-foreground text-background border-foreground shadow-md scale-105"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {format(day, 'EEE')}
              </span>
              <span className="font-display text-2xl mt-0.5 leading-none">
                {format(day, 'd')}
              </span>
              <span className="text-[9px] opacity-60 mt-1">
                {format(day, 'MMM')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}