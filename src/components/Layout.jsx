import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, CalendarDays, Calendar, UserCircle, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/booking', icon: CalendarDays, label: 'Booking' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/schedule', icon: Calendar, label: 'Calendar' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
];

export default function Layout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-24 max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    active && "bg-primary/10"
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} />
                  </div>
                  <span className={cn("text-[10px] tracking-wide", active && "font-semibold")}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}