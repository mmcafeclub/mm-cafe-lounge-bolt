import { useState } from 'react';
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function CategoryTabs({ categories, selectedId, onSelect, isAdmin, onCreate, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const startRename = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const confirmRename = () => {
    if (editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (cat) => {
    if (window.confirm(`Delete "${cat.name}" and all its menu items?`)) {
      onDelete(cat.id);
    }
  };

  return (
    <div className="px-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center gap-1 flex-shrink-0">
            {editingId === cat.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                  className="h-8 w-28 text-sm"
                  autoFocus
                />
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={confirmRename}>
                  <Check className="w-3.5 h-3.5 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setEditingId(null)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => onSelect(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedId === cat.id
                    ? "bg-foreground text-background shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.name}
              </button>
            )}
            {isAdmin && editingId !== cat.id && selectedId === cat.id && (
              <div className="flex gap-0.5">
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => startRename(cat)}>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => handleDelete(cat)}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        ))}
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full flex-shrink-0 h-8"
            onClick={onCreate}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Tab
          </Button>
        )}
      </div>
    </div>
  );
}