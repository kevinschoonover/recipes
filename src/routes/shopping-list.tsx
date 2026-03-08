import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  X,
  Eraser,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getShoppingLists,
  createShoppingList,
  addShoppingListItem,
  toggleShoppingListItem,
  removeShoppingListItem,
  deleteShoppingList,
  clearShoppingList,
  updateShoppingItemCategory,
  reorderShoppingListItems,
} from "#/server/functions/shopping-list";
import { authClient } from "#/lib/auth-client";
import { GROCERY_CATEGORIES } from "#/lib/grocery-categories";
import { ConfirmDialog } from "#/components/ConfirmDialog";

export const Route = createFileRoute("/shopping-list")({
  component: ShoppingListPage,
});

type ShoppingItem = {
  id: number;
  shoppingListId: number;
  recipeIngredientId: number | null;
  recipeId: number | null;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean | null;
  category: string | null;
  recipeName: string | null;
  recipeSlug: string | null;
};

/** Group items by normalized name, merging recipe sources */
function mergeItems(items: ShoppingItem[]) {
  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      quantity: number | null;
      unit: string | null;
      ids: number[];
      checked: boolean;
      category: string;
      recipes: Array<{ name: string; slug: string }>;
    }
  >();

  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    const existing = groups.get(key);
    if (existing) {
      existing.ids.push(item.id);
      existing.checked = existing.checked && !!item.checked;
      if (item.recipeName && item.recipeSlug) {
        const alreadyHas = existing.recipes.some(
          (r) => r.slug === item.recipeSlug,
        );
        if (!alreadyHas) {
          existing.recipes.push({
            name: item.recipeName,
            slug: item.recipeSlug,
          });
        }
      }
    } else {
      groups.set(key, {
        key,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        ids: [item.id],
        checked: !!item.checked,
        category: item.category ?? "Other",
        recipes:
          item.recipeName && item.recipeSlug
            ? [{ name: item.recipeName, slug: item.recipeSlug }]
            : [],
      });
    }
  }

  return Array.from(groups.values());
}

function ShoppingListPage() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [newListName, setNewListName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [addingToListId, setAddingToListId] = useState<number | null>(null);
  const [confirmClearListId, setConfirmClearListId] = useState<number | null>(
    null,
  );
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<
    number | null
  >(null);

  const { data: lists, isLoading } = useQuery({
    queryKey: ["shopping-lists"],
    queryFn: () => getShoppingLists(),
    enabled: !!session?.user,
  });

  const createListMutation = useMutation({
    mutationFn: (name: string) => createShoppingList({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      setNewListName("");
    },
  });

  const addItemMutation = useMutation({
    mutationFn: (data: { shoppingListId: number; name: string }) =>
      addShoppingListItem({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      setNewItemName("");
      setAddingToListId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: number; checked: boolean }) =>
      toggleShoppingListItem({ data }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: number) => removeShoppingListItem({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });

  const clearListMutation = useMutation({
    mutationFn: (id: number) => clearShoppingList({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: number) => deleteShoppingList({ data: { id } }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { ids: number[]; category: string }) =>
      updateShoppingItemCategory({ data }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: (data: {
      updates: Array<{ id: number; sortOrder: number }>;
    }) => reorderShoppingListItems({ data }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6 text-center">
        <ShoppingCart
          size={48}
          strokeWidth={1.2}
          className="mx-auto text-secondary-3"
        />
        <p className="mt-3 text-secondary-2">
          Sign in to manage your shopping lists.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="animate-rise-in">
        <h1 className="text-2xl font-bold text-secondary-1">Shopping List</h1>
        <p className="mt-2 text-secondary-2">
          Track ingredients you need to buy.
        </p>

        {/* Create new list */}
        <div className="mt-6 flex gap-2">
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="New list name…"
            className="flex-1 rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newListName.trim()) {
                createListMutation.mutate(newListName.trim());
              }
            }}
          />
          <button
            onClick={() => {
              if (newListName.trim()) {
                createListMutation.mutate(newListName.trim());
              }
            }}
            disabled={!newListName.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-1 text-white disabled:opacity-50"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Lists */}
        {isLoading ? (
          <div className="mt-6 space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-surface-2"
              />
            ))}
          </div>
        ) : !lists?.length ? (
          <div className="mt-12 flex flex-col items-center text-secondary-3">
            <ShoppingCart size={48} strokeWidth={1.2} />
            <p className="mt-3 text-sm">No shopping lists yet</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {lists.map((list) => {
              const merged = mergeItems(list.items);
              return (
                <div
                  key={list.id}
                  className="rounded-2xl border border-border-1 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-secondary-1">
                      {list.name}
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setAddingToListId(
                            addingToListId === list.id ? null : list.id,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-1 active:bg-primary-4"
                      >
                        <Plus size={16} />
                      </button>
                      {list.items.length > 0 && (
                        <button
                          onClick={() => setConfirmClearListId(list.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-3 active:text-error-1"
                          title="Clear all items"
                        >
                          <Eraser size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteListId(list.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-3 active:text-error-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Add item inline */}
                  {addingToListId === list.id && (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Add item…"
                        autoFocus
                        className="flex-1 rounded-xl border border-border-1 bg-surface-1 px-3 py-2 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newItemName.trim()) {
                            addItemMutation.mutate({
                              shoppingListId: list.id,
                              name: newItemName.trim(),
                            });
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newItemName.trim()) {
                            addItemMutation.mutate({
                              shoppingListId: list.id,
                              name: newItemName.trim(),
                            });
                          }
                        }}
                        className="rounded-xl bg-primary-1 px-3 py-2 text-sm font-medium text-white"
                      >
                        Add
                      </button>
                    </div>
                  )}

                  {/* Items grouped by category with drag-and-drop */}
                  {merged.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
                        // Find category of active item
                        const activeCat = merged.find(
                          (m) => m.key === active.id,
                        )?.category;
                        const overCat = merged.find(
                          (m) => m.key === over.id,
                        )?.category;
                        if (activeCat !== overCat) return; // Only reorder within category
                        const catItems = merged.filter(
                          (m) => m.category === activeCat,
                        );
                        const oldIndex = catItems.findIndex(
                          (m) => m.key === active.id,
                        );
                        const newIndex = catItems.findIndex(
                          (m) => m.key === over.id,
                        );
                        if (oldIndex === -1 || newIndex === -1) return;
                        const reordered = arrayMove(
                          catItems,
                          oldIndex,
                          newIndex,
                        );
                        const updates = reordered.flatMap((item, i) =>
                          item.ids.map((id) => ({ id, sortOrder: i })),
                        );
                        reorderMutation.mutate({ updates });
                      }}
                    >
                      <div className="mt-3">
                        {GROCERY_CATEGORIES.map((cat) => {
                          const catItems = merged.filter(
                            (item) => item.category === cat,
                          );
                          if (catItems.length === 0) return null;
                          return (
                            <div key={cat}>
                              <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary-3">
                                <span>{cat}</span>
                                <span className="h-px flex-1 bg-border-1" />
                              </div>
                              <SortableContext
                                items={catItems.map((item) => item.key)}
                                strategy={verticalListSortingStrategy}
                              >
                                <ul className="mt-1 space-y-0.5">
                                  {catItems.map((item) => (
                                    <SortableShoppingItem
                                      key={item.key}
                                      item={item}
                                      onToggle={() => {
                                        for (const id of item.ids) {
                                          toggleMutation.mutate({
                                            id,
                                            checked: !item.checked,
                                          });
                                        }
                                      }}
                                      onRemove={() => {
                                        for (const id of item.ids) {
                                          removeItemMutation.mutate(id);
                                        }
                                      }}
                                      onCategoryChange={(category) => {
                                        updateCategoryMutation.mutate({
                                          ids: item.ids,
                                          category,
                                        });
                                      }}
                                    />
                                  ))}
                                </ul>
                              </SortableContext>
                            </div>
                          );
                        })}
                      </div>
                    </DndContext>
                  ) : (
                    <p className="mt-3 text-sm text-secondary-3">
                      No items in this list
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <ConfirmDialog
          open={confirmClearListId !== null}
          onClose={() => setConfirmClearListId(null)}
          onConfirm={() => {
            if (confirmClearListId !== null) {
              clearListMutation.mutate(confirmClearListId);
            }
          }}
          title="Clear all items?"
          description="All items in this list will be removed. This cannot be undone."
          confirmLabel="Clear"
          variant="danger"
        />
        <ConfirmDialog
          open={confirmDeleteListId !== null}
          onClose={() => setConfirmDeleteListId(null)}
          onConfirm={() => {
            if (confirmDeleteListId !== null) {
              deleteListMutation.mutate(confirmDeleteListId);
            }
          }}
          title="Delete this list?"
          description="The list and all its items will be permanently removed."
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
}

function SortableShoppingItem({
  item,
  onToggle,
  onRemove,
  onCategoryChange,
}: {
  item: {
    key: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    ids: number[];
    checked: boolean;
    category: string;
    recipes: Array<{ name: string; slug: string }>;
  };
  onToggle: () => void;
  onRemove: () => void;
  onCategoryChange: (category: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-1"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex h-9 w-6 shrink-0 cursor-grab items-center justify-center text-secondary-3 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
      >
        <GripVertical size={14} />
      </button>
      <button
        onClick={onToggle}
        className={`flex min-h-[44px] flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors active:bg-primary-4/50 ${
          item.checked ? "text-secondary-3 line-through" : "text-secondary-1"
        }`}
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
            item.checked
              ? "border-primary-1 bg-primary-1"
              : "border-border-1"
          }`}
        >
          {item.checked && <Check size={14} className="text-white" />}
        </div>
        <div className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            {(item.quantity != null || item.unit) && (
              <span className="text-sm tabular-nums text-secondary-2">
                {item.quantity != null ? item.quantity : ""}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
            )}
            <span className="text-base">{item.name}</span>
          </span>
          {item.recipes.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {item.recipes.map((r) => (
                <Link
                  key={r.slug}
                  to="/recipes/$slug"
                  params={{ slug: r.slug }}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="rounded-full bg-primary-4 px-2 py-0.5 text-[10px] font-medium text-primary-1 hover:bg-primary-3"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </button>
      <select
        value={item.category}
        onChange={(e) => onCategoryChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="h-7 rounded-lg border border-border-1 bg-surface-1 px-1.5 text-[10px] text-secondary-3 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
      >
        {GROCERY_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <button
        onClick={onRemove}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary-3 opacity-0 transition-opacity group-hover:opacity-100 active:text-error-1"
      >
        <X size={14} />
      </button>
    </li>
  );
}
