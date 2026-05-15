import { useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MonthCalendar({ monthDate, shifts, selectedDate, onSelect }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const countByDate = useMemo(() => {
    const map = {};
    for (const s of shifts) {
      map[s.date] = (map[s.date] || 0) + 1;
    }
    return map;
  }, [shifts]);

  return (
    <div className="px-6">
      <div className="grid grid-cols-7 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, monthDate);
          const active = selectedDate && isSameDay(day, new Date(selectedDate + 'T00:00:00'));
          const count = countByDate[dateStr] || 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all",
                !inMonth && "opacity-30",
                active
                  ? "bg-foreground text-background shadow-md"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <span className={cn("leading-none", active && "font-semibold")}>
                {format(day, 'd')}
              </span>
              {count > 0 && inMonth && (
                <span className={cn(
                  "w-1 h-1 rounded-full mt-1",
                  active ? "bg-background" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}