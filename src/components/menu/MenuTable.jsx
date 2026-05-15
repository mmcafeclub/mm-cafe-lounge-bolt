import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function EditableCell({ value, onChange, placeholder, className, onPaste }) {
  const ref = useRef(null);

  return (
    <input
      ref={ref}
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onPaste={onPaste}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent border-0 outline-none text-sm py-2.5 px-3",
        "placeholder:text-muted-foreground/40 focus:bg-primary/5 transition-colors",
        className
      )}
    />
  );
}

export default function MenuTable({ items, isAdmin, onUpdateItem, onAddRow, onDeleteRow, onBulkUpdate }) {
  const [focusedCol, setFocusedCol] = useState(null);

  const handlePaste = useCallback((e, rowIndex, colKey) => {
    const clipboardData = e.clipboardData.getData('text');
    if (!clipboardData) return;

    const lines = clipboardData.split(/\r?\n/).filter(line => line.trim() !== '');

    // If pasting multiple lines, handle bulk paste
    if (lines.length > 1) {
      e.preventDefault();

      // Check if pasted data has multiple columns (tab-separated)
      const hasMultipleCols = lines.some(line => line.includes('\t'));

      if (hasMultipleCols) {
        // Multi-column paste (e.g. full rows from Excel)
        const rows = lines.map(line => {
          const cells = line.split('\t');
          return {
            item_number: cells[0]?.trim() || '',
            item_name: cells[1]?.trim() || '',
            price: cells[2]?.trim() || '',
          };
        });
        onBulkUpdate(rowIndex, rows, 'multi');
      } else {
        // Single column paste — apply values down the focused column
        onBulkUpdate(rowIndex, lines.map(v => v.trim()), colKey);
      }
    }
    // Single line paste: let the browser handle it naturally
  }, [onBulkUpdate]);

  return (
    <div className="px-6 mt-4">
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        {/* Header */}
        <div className="grid grid-cols-[64px_1fr_80px] border-b border-border bg-muted/50">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-3 py-2.5 text-center">
            #
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-3 py-2.5">
            Item
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-3 py-2.5 text-right">
            $
          </div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground italic">
            No items yet.{isAdmin ? ' Click "+ Row" to add menu items.' : ''}
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id}
              className={cn(
                "grid grid-cols-[64px_1fr_80px] border-b border-border last:border-b-0",
                "hover:bg-muted/30 transition-colors group"
              )}
            >
              {isAdmin ? (
                <>
                  <EditableCell
                    value={item.item_number}
                    onChange={(v) => onUpdateItem(item.id, { item_number: v })}
                    onPaste={(e) => handlePaste(e, idx, 'item_number')}
                    placeholder="—"
                    className="text-center text-muted-foreground font-mono text-xs"
                  />
                  <EditableCell
                    value={item.item_name}
                    onChange={(v) => onUpdateItem(item.id, { item_name: v })}
                    onPaste={(e) => handlePaste(e, idx, 'item_name')}
                    placeholder="Item name"
                  />
                  <div className="flex items-center">
                    <EditableCell
                      value={item.price}
                      onChange={(v) => onUpdateItem(item.id, { price: v })}
                      onPaste={(e) => handlePaste(e, idx, 'price')}
                      placeholder="0"
                      className="text-right font-mono"
                    />
                    <button
                      onClick={() => onDeleteRow(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 mr-1"
                    >
                      <Trash2 className="w-3 h-3 text-destructive/60 hover:text-destructive" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center text-muted-foreground font-mono text-xs py-2.5 px-3">
                    {item.item_number || '—'}
                  </div>
                  <div className="text-sm py-2.5 px-3 text-foreground">
                    {item.item_name || '—'}
                  </div>
                  <div className="text-sm py-2.5 px-3 text-right font-mono text-foreground">
                    {item.price || '—'}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add row button */}
      {isAdmin && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs"
            onClick={() => onAddRow(1)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Row
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs"
            onClick={() => onAddRow(5)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> 5 Rows
          </Button>
        </div>
      )}

      {isAdmin && (
        <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">
          Tip: Copy cells from Excel and paste directly into a column to bulk-update values.
        </p>
      )}
    </div>
  );
}