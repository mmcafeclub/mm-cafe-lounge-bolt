export default function BookingTerms() {
  return (
    <div className="px-6 pt-2 pb-6">
      <div className="rounded-2xl bg-secondary/40 border border-secondary p-5">
        <p className="text-[10px] uppercase tracking-[0.25em] text-secondary-foreground/80 mb-3">
          House Terms
        </p>
        <ul className="space-y-2.5 text-xs text-secondary-foreground/90 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-secondary-foreground/60">·</span>
            <span>Late arrival of <strong>10 minutes or more</strong> results in automatic forfeiture if other guests are waiting.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-secondary-foreground/60">·</span>
            <span>Table stays are guaranteed for <strong>2 hours</strong>. If no subsequent booking is waiting, guests are welcome to stay longer.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-secondary-foreground/60">·</span>
            <span>Minimum hourly charge still applies for reservation.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}