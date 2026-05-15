import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditableItemForm from '@/components/admin/EditableItemForm';
import ExpandableText from '@/components/common/ExpandableText';
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';

export default function NewsSection({ news, isLoading, isAdmin, onCreate, onUpdate, onDelete }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const labels = {
    singular: 'news item',
    titlePlaceholder: 'News title',
    descriptionPlaceholder: 'News description',
  };

  const submitCreate = async (data) => {
    await onCreate(data);
    setShowAddForm(false);
  };

  const submitUpdate = async (data) => {
    await onUpdate(editingItem, data);
    setEditingItem(null);
  };

  return (
    <section className="px-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Latest</h2>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            From the lounge
          </span>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {showAddForm && (
          <EditableItemForm labels={labels} mode="add" onCancel={() => setShowAddForm(false)} onSubmit={submitCreate} />
        )}

        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)
        ) : news.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground italic">No news yet. Check back soon.</p>
          </div>
        ) : (
          news.map((item, idx) => (
            editingItem?.id === item.id ? (
              <EditableItemForm key={item.id} item={item} labels={labels} mode="edit" onCancel={() => setEditingItem(null)} onSubmit={submitUpdate} />
            ) : (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx }}
                className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex gap-5 p-4">
                  <div className="w-5/12 flex-shrink-0">
                    {item.image_url && (
                      <button type="button" className="w-full cursor-zoom-in" onClick={() => setPreviewImage({ url: item.image_url, alt: item.title })}>
                        <img src={item.image_url} alt={item.title} className="w-full aspect-square rounded-2xl object-cover" />
                      </button>
                    )}
                    {item.published_date && (
                      <p className="text-[10px] text-muted-foreground mt-2 text-center tracking-wide">
                        {format(new Date(item.published_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-[17px] leading-tight text-foreground mb-2">
                        {item.title}
                      </h3>
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditingItem(item)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive" onClick={() => onDelete(item)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <ExpandableText className="text-sm text-muted-foreground leading-relaxed">
                      {item.content}
                    </ExpandableText>
                  </div>
                </div>
              </motion.article>
            )
          ))
        )}
      </div>

      <ImagePreviewDialog
        imageUrl={previewImage?.url}
        alt={previewImage?.alt}
        onClose={() => setPreviewImage(null)}
      />
    </section>
  );
}