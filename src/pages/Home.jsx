import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';
import HeroHeader from '@/components/home/HeroHeader';
import QuickBookCard from '@/components/home/QuickBookCard';
import NewsSection from '@/components/home/NewsSection';

export default function Home() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: news = [], isLoading } = useQuery({
    queryKey: ['lounge-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lounge_news')
        .select('*')
        .order('published_date', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const refreshNews = () => queryClient.invalidateQueries({ queryKey: ['lounge-news'] });

  const createNews = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('lounge_news').insert({
        title: data.title,
        content: data.description,
        image_url: data.image_url,
        published_date: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: refreshNews,
  });

  const updateNews = useMutation({
    mutationFn: async ({ item, data }) => {
      const { error } = await supabase.from('lounge_news').update({
        title: data.title,
        content: data.description,
        image_url: data.image_url,
        published_date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      }).eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: refreshNews,
  });

  const deleteNews = useMutation({
    mutationFn: async (item) => {
      const { error } = await supabase.from('lounge_news').delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: refreshNews,
  });

  return (
    <div>
      <HeroHeader userName={user?.full_name?.split(' ')[0]} />
      <QuickBookCard />
      <NewsSection
        news={news}
        isLoading={isLoading}
        isAdmin={user?.role === 'admin'}
        onCreate={(data) => createNews.mutateAsync(data)}
        onUpdate={(item, data) => updateNews.mutateAsync({ item, data })}
        onDelete={(item) => deleteNews.mutateAsync(item)}
      />
    </div>
  );
}
