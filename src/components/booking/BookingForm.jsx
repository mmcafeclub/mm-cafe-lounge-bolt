import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Minus, Plus } from 'lucide-react';

export default function BookingForm({ defaults, onSubmit, isSubmitting }) {
  const [name, setName] = useState(defaults?.name || '');
  const [phone, setPhone] = useState(defaults?.phone || '');
  const [party, setParty] = useState(2);
  const [notes, setNotes] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSubmit({ customer_name: name, customer_phone: phone, party_size: party, notes });
  };

  return (
    <form onSubmit={submit} className="px-6 space-y-4 pb-6">
      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Full Name</label>
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1.5 h-12 rounded-xl bg-card border-border"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Phone</label>
        <Input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+852 ..."
          className="mt-1.5 h-12 rounded-xl bg-card border-border"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Party Size</label>
        <div className="mt-1.5 flex items-center justify-between h-12 px-4 rounded-xl bg-card border border-border">
          <button
            type="button"
            onClick={() => setParty(Math.max(1, party - 1))}
            className="w-9 h-9 rounded-full bg-muted hover:bg-secondary flex items-center justify-center transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-display text-2xl">{party}</span>
          <button
            type="button"
            onClick={() => setParty(Math.min(12, party + 1))}
            className="w-9 h-9 rounded-full bg-muted hover:bg-secondary flex items-center justify-center transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Notes (optional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything we should know?"
          className="mt-1.5 rounded-xl bg-card border-border resize-none"
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-13 rounded-2xl bg-foreground text-background hover:bg-foreground/90 py-4 text-base font-medium tracking-wide"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Confirm Reservation'
        )}
      </Button>
    </form>
  );
}