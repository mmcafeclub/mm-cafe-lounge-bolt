const TIER_GRADIENTS = {
  Bronze: 'from-amber-700/40 to-amber-900/40',
  Silver: 'from-slate-300/50 to-slate-500/50',
  Gold: 'from-amber-300/60 to-amber-500/60',
  Platinum: 'from-violet-200/60 to-violet-400/60',
};

export default function MemberCard({ profile, user }) {
  const tier = profile?.tier || 'Bronze';
  const points = profile?.loyalty_points || 0;
  const name = profile?.name || user?.full_name || 'Guest';

  return (
    <div className={`relative mx-6 rounded-3xl bg-gradient-to-br ${TIER_GRADIENTS[tier]} p-6 overflow-hidden border border-border/50`}>
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/60">
          {tier} Member
        </p>
        <h2 className="font-display text-3xl mt-2 text-foreground italic font-light">
          {name}
        </h2>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-foreground/60">Points</p>
            <p className="font-display text-4xl text-foreground leading-none mt-1">
              {points.toLocaleString()}
            </p>
          </div>
          <p className="text-[10px] tracking-widest text-foreground/40 uppercase">
            MM · Lounge
          </p>
        </div>
      </div>
    </div>
  );
}