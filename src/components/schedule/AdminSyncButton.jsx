import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSyncButton({ user }) {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  if (user?.role !== 'admin') return null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/syncShiftSchedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const json = await res.json();
      if (json.success) {
        toast.success(`Synced ${json.synced_count} shifts from MM Café Club`);
        queryClient.invalidateQueries({ queryKey: ['schedule-cache'] });
      } else {
        toast.error(json.error || 'Sync failed');
      }
    } catch (err) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      size="sm"
      className="rounded-full text-xs h-8 px-3 border-primary/30 text-primary hover:bg-primary/10"
    >
      {syncing ? (
        <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
      ) : (
        <RefreshCw className="w-3 h-3 mr-1.5" />
      )}
      Sync 30d
    </Button>
  );
}