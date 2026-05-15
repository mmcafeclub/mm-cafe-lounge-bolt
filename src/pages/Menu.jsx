import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CategoryTabs from '@/components/menu/CategoryTabs';
import MenuTable from '@/components/menu/MenuTable';

const DEFAULT_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Drinks'];

export default function Menu() {
  const queryClient = useQueryClient();
  const [selectedCatId, setSelectedCatId] = useState(null);
  const debounceTimers = useRef({});

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const isAdmin = user?.role === 'admin';

  // Categories
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => base44.entities.MenuCategory.list('sort_order', 50),
  });

  // Auto-select first category
  const activeCatId = selectedCatId || categories[0]?.id;

  // Items for selected category
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', activeCatId],
    queryFn: () => base44.entities.MenuItem.filter({ category_id: activeCatId }, 'sort_order', 200),
    enabled: !!activeCatId,
  });

  // Seed default categories if none exist
  const seedMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.MenuCategory.list('sort_order', 1);
      if (existing.length === 0) {
        await base44.entities.MenuCategory.bulkCreate(
          DEFAULT_CATEGORIES.map((name, i) => ({ name, sort_order: i }))
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-categories'] }),
  });

  // Seed on first load if admin and no categories
  if (isAdmin && !catsLoading && categories.length === 0 && !seedMutation.isPending && !seedMutation.isSuccess) {
    seedMutation.mutate();
  }

  // Category mutations
  const createCategory = useMutation({
    mutationFn: () => base44.entities.MenuCategory.create({
      name: 'New Tab',
      sort_order: categories.length,
    }),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setSelectedCatId(newCat.id);
    },
  });

  const renameCategory = useMutation({
    mutationFn: ({ id, name }) => base44.entities.MenuCategory.update(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-categories'] }),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id) => {
      const catItems = await base44.entities.MenuItem.filter({ category_id: id }, 'sort_order', 500);
      await Promise.all(catItems.map(item => base44.entities.MenuItem.delete(item.id)));
      await base44.entities.MenuCategory.delete(id);
    },
    onSuccess: () => {
      setSelectedCatId(null);
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
    },
  });

  // Item mutations
  const addRows = useMutation({
    mutationFn: (count) => {
      const newItems = Array.from({ length: count }, (_, i) => ({
        category_id: activeCatId,
        item_number: '',
        item_name: '',
        price: '',
        sort_order: items.length + i,
      }));
      return base44.entities.MenuItem.bulkCreate(newItems);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items', activeCatId] }),
  });

  const updateItem = useCallback((itemId, data) => {
    // Debounced update to avoid too many API calls while typing
    clearTimeout(debounceTimers.current[itemId]);
    debounceTimers.current[itemId] = setTimeout(() => {
      base44.entities.MenuItem.update(itemId, data).then(() => {
        queryClient.invalidateQueries({ queryKey: ['menu-items', activeCatId] });
      });
    }, 600);

    // Optimistic update
    queryClient.setQueryData(['menu-items', activeCatId], (old) =>
      (old || []).map(item => item.id === itemId ? { ...item, ...data } : item)
    );
  }, [activeCatId, queryClient]);

  const deleteRow = useMutation({
    mutationFn: (id) => base44.entities.MenuItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items', activeCatId] }),
  });

  const bulkUpdate = useCallback(async (startRowIndex, values, colKey) => {
    if (colKey === 'multi') {
      // values is array of {item_number, item_name, price}
      const rowsToAdd = Math.max(0, (startRowIndex + values.length) - items.length);

      if (rowsToAdd > 0) {
        const newItems = Array.from({ length: rowsToAdd }, (_, i) => ({
          category_id: activeCatId,
          item_number: '',
          item_name: '',
          price: '',
          sort_order: items.length + i,
        }));
        await base44.entities.MenuItem.bulkCreate(newItems);
        await queryClient.invalidateQueries({ queryKey: ['menu-items', activeCatId] });
        // Re-fetch to get IDs
        const refreshed = await base44.entities.MenuItem.filter({ category_id: activeCatId }, 'sort_order', 200);
        const updates = values.map((row, i) => {
          const target = refreshed[startRowIndex + i];
          if (!target) return null;
          return base44.entities.MenuItem.update(target.id, row);
        }).filter(Boolean);
        await Promise.all(updates);
      } else {
        const updates = values.map((row, i) => {
          const target = items[startRowIndex + i];
          if (!target) return null;
          return base44.entities.MenuItem.update(target.id, row);
        }).filter(Boolean);
        await Promise.all(updates);
      }
    } else {
      // Single column paste
      const rowsToAdd = Math.max(0, (startRowIndex + values.length) - items.length);

      if (rowsToAdd > 0) {
        const newItems = Array.from({ length: rowsToAdd }, (_, i) => ({
          category_id: activeCatId,
          item_number: '',
          item_name: '',
          price: '',
          sort_order: items.length + i,
        }));
        await base44.entities.MenuItem.bulkCreate(newItems);
        await queryClient.invalidateQueries({ queryKey: ['menu-items', activeCatId] });
        const refreshed = await base44.entities.MenuItem.filter({ category_id: activeCatId }, 'sort_order', 200);
        const updates = values.map((val, i) => {
          const target = refreshed[startRowIndex + i];
          if (!target) return null;
          return base44.entities.MenuItem.update(target.id, { [colKey]: val });
        }).filter(Boolean);
        await Promise.all(updates);
      } else {
        const updates = values.map((val, i) => {
          const target = items[startRowIndex + i];
          if (!target) return null;
          return base44.entities.MenuItem.update(target.id, { [colKey]: val });
        }).filter(Boolean);
        await Promise.all(updates);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['menu-items', activeCatId] });
  }, [items, activeCatId, queryClient]);

  return (
    <div className="pt-10 pb-6">
      <div className="px-6 mb-6">
        <div className="mb-3">
        <img
          src="https://media.base44.com/images/public/696148adc923b8a2cad712ad/af1d10878_MMkitchenlogonoBG.png"
          alt="MM Kitchen logo"
          className="w-full max-w-[280pxpx] h-auto object-contain"
        />
      </div>
        <h1 className="font-display text-3xl italic font-light text-center">Menu</h1>
      </div>

      <CategoryTabs
        categories={categories}
        selectedId={activeCatId}
        onSelect={setSelectedCatId}
        isAdmin={isAdmin}
        onCreate={() => createCategory.mutate()}
        onRename={(id, name) => renameCategory.mutate({ id, name })}
        onDelete={(id) => deleteCategory.mutate(id)}
      />

      {activeCatId && (
        <>
          <MenuTable
            items={items}
            isAdmin={isAdmin}
            onUpdateItem={updateItem}
            onAddRow={(count) => addRows.mutate(count)}
            onDeleteRow={(id) => deleteRow.mutate(id)}
            onBulkUpdate={bulkUpdate}
          />
          {!isAdmin && (
            <div className="px-6 mt-4 text-center">
              <p className="font-display italic text-gray-500 text-sm"> 
                Ring the hand bell when you're ready to order!
              </p>
            </div>
          )}
        </>
      )}

      {!activeCatId && !catsLoading && categories.length === 0 && !isAdmin && (
        <div className="px-6 mt-8">
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground italic">Menu is being prepared. Check back soon!</p>
          </div>
        </div>
      )}
    </div>
  );
}