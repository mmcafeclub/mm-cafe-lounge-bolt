import { useState } from 'react';
import { Gift as GiftIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditableItemForm from '@/components/admin/EditableItemForm';
import ExpandableText from '@/components/common/ExpandableText';
import ImagePreviewDialog from '@/components/common/ImagePreviewDialog';

export default function GiftList({ gifts, isLoading, userPoints = 0, isAdmin, onCreate, onUpdate, onDelete }) {
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const labels = {
    singular: 'gift',
    titlePlaceholder: 'Gift name',
    descriptionPlaceholder: 'Gift description',
    pointsPlaceholder: 'Points required',
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
    <div className="px-6 mt-8">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-display text-xl text-foreground">Gift Redemptions</h2>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {gifts.length} available
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
          [1, 2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)
        ) : gifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <GiftIcon className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground italic">No gifts available yet.</p>
          </div>
        ) : (
          gifts.map(gift => {
            const affordable = userPoints >= gift.points_required;
            return editingItem?.id === gift.id ? (
              <EditableItemForm key={gift.id} item={gift} labels={labels} mode="edit" onCancel={() => setEditingItem(null)} onSubmit={submitUpdate} />
            ) : (
              <div key={gift.id} className="flex gap-5 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
                <div className="w-5/12 flex-shrink-0">
                  {gift.image_url ? (
                    <button type="button" className="w-full cursor-zoom-in" onClick={() => setPreviewImage({ url: gift.image_url, alt: gift.name })}>
                      <img src={gift.image_url} alt={gift.name} className="w-full aspect-square rounded-2xl object-cover" />
                    </button>
                  ) : (
                    <div className="w-full aspect-square rounded-2xl bg-secondary/60 flex items-center justify-center">
                      <GiftIcon className="w-8 h-8 text-secondary-foreground" />
                    </div>
                  )}
                  <div className="mt-2 text-center">
                    <p className={`font-display text-2xl font-semibold ${affordable ? 'text-primary' : 'text-muted-foreground'}`}>
                      {gift.points_required}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground -mt-1">points</p>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col py-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground text-[17px] leading-tight mb-1.5">
                      {gift.name}
                    </p>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setEditingItem(gift)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive" onClick={() => onDelete(gift)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <ExpandableText className="text-sm text-muted-foreground leading-relaxed">
                    {gift.description}
                  </ExpandableText>

                </div>
              </div>
            );
          })
        )}
      </div>

      <ImagePreviewDialog
        imageUrl={previewImage?.url}
        alt={previewImage?.alt}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}