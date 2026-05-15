import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MonthCalendar from '@/components/schedule/MonthCalendar';
import DayShifts from '@/components/schedule/DayShifts';
import AdminSyncButton from '@/components/schedule/AdminSyncButton';

export default function Schedule() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: shifts = [] } = useQuery({
    queryKey: ['schedule-cache'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lounge_schedule_cache')
        .select('*')
        .order('date', { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="pt-10 pb-6">
      <div className="px-6 mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">M.M.</p>
          <h1 className="font-display text-3xl mt-2 italic font-light">Schedule</h1>
        </div>
        <AdminSyncButton user={user} />
      </div>

      <div className="flex items-center justify-between px-6 mb-4">
        <button
          onClick={() => setMonthDate(subMonths(monthDate, 1))}
          className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="font-display text-lg">{format(monthDate, 'MMMM yyyy')}</p>
        <button
          onClick={() => setMonthDate(addMonths(monthDate, 1))}
          className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <MonthCalendar
        monthDate={monthDate}
        shifts={shifts}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      <DayShifts date={selectedDate} shifts={shifts} />

      {shifts.length === 0 && (
        <div className="px-6 mt-6">
          <div className="rounded-2xl bg-secondary/30 border border-secondary/50 p-4">
            <p className="text-xs text-secondary-foreground/90 leading-relaxed">
              The schedule has not been synced yet. An administrator can pull the latest shifts from MM Café Club.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}