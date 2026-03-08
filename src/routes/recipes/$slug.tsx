import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Users,
  Check,
  ShoppingCart,
  Plus,
  X,
  ChevronDown,
  Save,
} from "lucide-react";
import {
  getRecipeBySlug,
  deleteRecipe,
  updateRecipe,
} from "#/server/functions/recipes";
import type { RecipeInput } from "#/server/functions/recipes";
import { getShoppingLists } from "#/server/functions/shopping-list";
import { addRecipeToShoppingList } from "#/server/functions/shopping-list";
import { authClient } from "#/lib/auth-client";
import { useToast } from "#/components/Toast";
import { ConfirmDialog } from "#/components/ConfirmDialog";

export const Route = createFileRoute("/recipes/$slug")({
  component: RecipeDetail,
});

function groupStepsBySections(
  steps: Array<{
    id: number;
    text: string;
    sectionName: string | null;
    ingredientIds: number[];
  }>,
) {
  const sections: Array<{
    name: string | null;
    steps: typeof steps;
  }> = [];
  let current: (typeof sections)[0] = { name: null, steps: [] };
  for (const step of steps) {
    if (step.sectionName !== current.name) {
      if (current.steps.length) sections.push(current);
      current = { name: step.sectionName, steps: [] };
    }
    current.steps.push(step);
  }
  if (current.steps.length) sections.push(current);
  return sections;
}

function RecipeDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "steps" | "nutrition"
  >("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  );
  const [showShoppingListPicker, setShowShoppingListPicker] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<RecipeInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMicronutrients, setShowMicronutrients] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ["recipe", slug],
    queryFn: () => getRecipeBySlug({ data: { slug } }),
    enabled: !!session?.user,
  });

  const { data: shoppingLists } = useQuery({
    queryKey: ["shopping-lists"],
    queryFn: () => getShoppingLists(),
    enabled: !!session?.user && showShoppingListPicker,
  });

  const addToListMutation = useMutation({
    mutationFn: (input: {
      recipeId: number;
      shoppingListId?: number;
      newListName?: string;
    }) => addRecipeToShoppingList({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-lists"] });
      setShowShoppingListPicker(false);
      setNewListName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe({ data: { slug } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      navigate({ to: "/", search: { search: "", category: "" } });
    },
  });

  // Embed LD+JSON in document head
  useEffect(() => {
    if (!recipe) return;
    const jsonLd = buildSchemaOrgRecipe(recipe);
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [recipe]);

  function toggleIngredient(id: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function enterEditMode() {
    if (!recipe) return;
    setForm({
      name: recipe.name,
      description: recipe.description ?? "",
      imageUrl: recipe.imageUrl ?? "",
      category: recipe.category ?? "",
      servings: recipe.servings ?? "",
      prepTime: recipe.prepTime ?? "",
      cookTime: recipe.cookTime ?? "",
      totalTime: recipe.totalTime ?? "",
      document: recipe.document ?? "",
      ingredients: recipe.ingredients.map((ing) => ({
        rawText: ing.rawText,
        name: ing.name ?? undefined,
        quantity: ing.quantity ?? undefined,
        unit: ing.unit ?? undefined,
      })),
      steps: recipe.steps.map((step) => ({
        text: step.text,
        sectionName: step.sectionName ?? undefined,
        ingredientIndices: (step.ingredientIds ?? [])
          .map((id: number) =>
            recipe.ingredients.findIndex((ing) => ing.id === id),
          )
          .filter((idx: number) => idx >= 0),
      })),
      nutrition: recipe.nutrition
        ? {
            calories: recipe.nutrition.calories ?? undefined,
            protein: recipe.nutrition.protein ?? undefined,
            carbohydrates: recipe.nutrition.carbohydrates ?? undefined,
            fat: recipe.nutrition.fat ?? undefined,
            saturatedFat: recipe.nutrition.saturatedFat ?? undefined,
            fiber: recipe.nutrition.fiber ?? undefined,
            sugar: recipe.nutrition.sugar ?? undefined,
            sodium: recipe.nutrition.sodium ?? undefined,
            cholesterol: recipe.nutrition.cholesterol ?? undefined,
            calcium: recipe.nutrition.calcium ?? undefined,
            iron: recipe.nutrition.iron ?? undefined,
            potassium: recipe.nutrition.potassium ?? undefined,
            vitaminA: recipe.nutrition.vitaminA ?? undefined,
            vitaminC: recipe.nutrition.vitaminC ?? undefined,
            vitaminD: recipe.nutrition.vitaminD ?? undefined,
            servingSize: recipe.nutrition.servingSize ?? undefined,
          }
        : undefined,
    });
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setForm(null);
  }

  function toggleStepIngredient(stepIdx: number, ingIdx: number) {
    if (!form) return;
    const next = [...form.steps];
    const step = { ...next[stepIdx]! };
    const indices = [...(step.ingredientIndices ?? [])];
    const pos = indices.indexOf(ingIdx);
    if (pos >= 0) {
      indices.splice(pos, 1);
    } else {
      indices.push(ingIdx);
    }
    step.ingredientIndices = indices;
    next[stepIdx] = step;
    setForm({ ...form, steps: next });
  }

  function updateSectionName(stepIdx: number, name: string) {
    if (!form) return;
    const next = [...form.steps];
    const oldName = next[stepIdx]!.sectionName;
    for (let i = stepIdx; i < next.length; i++) {
      if (i === stepIdx || next[i]!.sectionName === oldName) {
        next[i] = { ...next[i]!, sectionName: name || undefined };
      } else {
        break;
      }
    }
    setForm({ ...form, steps: next });
  }

  function insertStepAfter(idx: number) {
    if (!form) return;
    const next = [...form.steps];
    const sectionName = next[idx]?.sectionName;
    next.splice(idx + 1, 0, { text: "", sectionName, ingredientIndices: [] });
    setForm({ ...form, steps: next });
  }

  function insertSectionAfter(idx: number) {
    if (!form) return;
    const next = [...form.steps];
    next.splice(idx + 1, 0, {
      text: "",
      sectionName: "New Section",
      ingredientIndices: [],
    });
    setForm({ ...form, steps: next });
  }

  function updateNutrition(
    field: keyof NonNullable<RecipeInput["nutrition"]>,
    value: string,
  ) {
    if (!form) return;
    const nutrition = form.nutrition ?? {};
    if (field === "servingSize") {
      setForm({
        ...form,
        nutrition: { ...nutrition, [field]: value || undefined },
      });
    } else {
      const num = value === "" ? undefined : parseFloat(value);
      setForm({
        ...form,
        nutrition: {
          ...nutrition,
          [field]: num != null && !isNaN(num) ? num : undefined,
        },
      });
    }
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const nutrition = form.nutrition;
      const hasNutrition =
        nutrition &&
        Object.values(nutrition).some(
          (v) => v !== undefined && v !== null && v !== "",
        );
      await updateRecipe({
        data: {
          ...form,
          nutrition: hasNutrition ? nutrition : undefined,
          slug,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["recipe", slug] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setIsEditing(false);
      setForm(null);
    } catch (err) {
      console.error("Failed to save recipe:", err);
      showToast(
        `Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2" />
        <div className="mt-4 h-8 w-48 animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 text-center">
        <p className="text-secondary-2">Recipe not found.</p>
        <Link to="/" search={{ search: "", category: "" }} className="mt-2 text-sm font-medium text-primary-1">
          Back to recipes
        </Link>
      </div>
    );
  }

  // ─── Edit Mode ───────────────────────────────────────────────
  if (isEditing && form) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="animate-rise-in">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={cancelEdit}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-2 active:bg-primary-4"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="flex-1 text-xl font-bold text-secondary-1">
              Edit Recipe
            </h1>
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary-1 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {/* Name */}
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
            />
            <Field
              label="Description"
              value={form.description ?? ""}
              onChange={(v) => setForm({ ...form, description: v })}
              multiline
            />
            <Field
              label="Image URL"
              value={form.imageUrl ?? ""}
              onChange={(v) => setForm({ ...form, imageUrl: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Category"
                value={form.category ?? ""}
                onChange={(v) => setForm({ ...form, category: v })}
              />
              <Field
                label="Servings"
                value={form.servings ?? ""}
                onChange={(v) => setForm({ ...form, servings: v })}
              />
              <Field
                label="Prep Time"
                value={form.prepTime ?? ""}
                onChange={(v) => setForm({ ...form, prepTime: v })}
              />
              <Field
                label="Cook Time"
                value={form.cookTime ?? ""}
                onChange={(v) => setForm({ ...form, cookTime: v })}
              />
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-1">
                  Ingredients
                </h2>
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      ingredients: [...form.ingredients, { rawText: "" }],
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-1 active:bg-primary-4"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {form.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={ing.rawText}
                      onChange={(e) => {
                        const next = [...form.ingredients];
                        next[i] = { ...next[i]!, rawText: e.target.value };
                        setForm({ ...form, ingredients: next });
                      }}
                      placeholder="e.g., 2 cups flour"
                      className="flex-1 rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const next = form.ingredients.filter(
                          (_, j) => j !== i,
                        );
                        const nextSteps = form.steps.map((s) => ({
                          ...s,
                          ingredientIndices: (s.ingredientIndices ?? [])
                            .filter((idx) => idx !== i)
                            .map((idx) => (idx > i ? idx - 1 : idx)),
                        }));
                        setForm({
                          ...form,
                          ingredients: next,
                          steps: nextSteps,
                        });
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary-3 active:text-error-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-1">
                  Steps
                </h2>
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      steps: [
                        ...form.steps,
                        { text: "", ingredientIndices: [] },
                      ],
                    })
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-1 active:bg-primary-4"
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="mt-2 space-y-4">
                {form.steps.map((step, i) => (
                  <div key={i}>
                    {(i === 0 ||
                      step.sectionName !== form.steps[i - 1]?.sectionName) && (
                      <input
                        value={step.sectionName ?? ""}
                        onChange={(e) => updateSectionName(i, e.target.value)}
                        placeholder="Section name (e.g., Prep, Cook)…"
                        className="mb-2 w-full border-b border-dashed border-border-1 bg-transparent pb-1 text-sm font-semibold text-secondary-2 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
                      />
                    )}
                    <div className="flex items-start gap-2">
                      <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-4 text-sm font-semibold text-primary-1">
                        {i + 1}
                      </span>
                      <textarea
                        value={step.text}
                        onChange={(e) => {
                          const next = [...form.steps];
                          next[i] = { ...next[i]!, text: e.target.value };
                          setForm({ ...form, steps: next });
                        }}
                        rows={2}
                        placeholder="Describe this step…"
                        className="flex-1 rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const next = form.steps.filter((_, j) => j !== i);
                          setForm({ ...form, steps: next });
                        }}
                        className="mt-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary-3 active:text-error-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {form.ingredients.length > 0 && (
                      <CollapsiblePills
                        ingredients={form.ingredients}
                        selectedIndices={step.ingredientIndices ?? []}
                        onToggle={(j) => toggleStepIngredient(i, j)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => insertStepAfter(i)}
                      className="ml-9 mt-1 text-xs text-primary-1"
                    >
                      + Add step below
                    </button>
                    {(i === form.steps.length - 1 ||
                      form.steps[i + 1]?.sectionName !==
                        step.sectionName) && (
                      <button
                        type="button"
                        onClick={() => insertSectionAfter(i)}
                        className="ml-9 mt-2 flex items-center gap-1.5 text-xs text-secondary-3 hover:text-primary-1"
                      >
                        <span className="h-px w-4 bg-current" /> + Add section{" "}
                        <span className="h-px w-4 bg-current" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Nutrition */}
            <div>
              <h2 className="text-lg font-semibold text-secondary-1">
                Nutrition
              </h2>
              <p className="mt-1 text-sm text-secondary-2">
                Per serving (optional)
              </p>
              <div className="mt-3 space-y-3">
                <Field
                  label="Serving Size"
                  value={form.nutrition?.servingSize ?? ""}
                  onChange={(v) => updateNutrition("servingSize", v)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Calories (kcal)"
                    value={form.nutrition?.calories}
                    onChange={(v) => updateNutrition("calories", v)}
                  />
                  <NumberField
                    label="Protein (g)"
                    value={form.nutrition?.protein}
                    onChange={(v) => updateNutrition("protein", v)}
                  />
                  <NumberField
                    label="Carbs (g)"
                    value={form.nutrition?.carbohydrates}
                    onChange={(v) => updateNutrition("carbohydrates", v)}
                  />
                  <NumberField
                    label="Fat (g)"
                    value={form.nutrition?.fat}
                    onChange={(v) => updateNutrition("fat", v)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Saturated Fat (g)"
                    value={form.nutrition?.saturatedFat}
                    onChange={(v) => updateNutrition("saturatedFat", v)}
                  />
                  <NumberField
                    label="Fiber (g)"
                    value={form.nutrition?.fiber}
                    onChange={(v) => updateNutrition("fiber", v)}
                  />
                  <NumberField
                    label="Sugar (g)"
                    value={form.nutrition?.sugar}
                    onChange={(v) => updateNutrition("sugar", v)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowMicronutrients(!showMicronutrients)}
                  className="flex items-center gap-2 text-sm font-medium text-secondary-2"
                >
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showMicronutrients ? "rotate-180" : ""}`}
                  />
                  Micronutrients
                </button>
                {showMicronutrients && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Sodium (mg)"
                      value={form.nutrition?.sodium}
                      onChange={(v) => updateNutrition("sodium", v)}
                    />
                    <NumberField
                      label="Cholesterol (mg)"
                      value={form.nutrition?.cholesterol}
                      onChange={(v) => updateNutrition("cholesterol", v)}
                    />
                    <NumberField
                      label="Calcium (mg)"
                      value={form.nutrition?.calcium}
                      onChange={(v) => updateNutrition("calcium", v)}
                    />
                    <NumberField
                      label="Iron (mg)"
                      value={form.nutrition?.iron}
                      onChange={(v) => updateNutrition("iron", v)}
                    />
                    <NumberField
                      label="Potassium (mg)"
                      value={form.nutrition?.potassium}
                      onChange={(v) => updateNutrition("potassium", v)}
                    />
                    <NumberField
                      label="Vitamin A (mcg)"
                      value={form.nutrition?.vitaminA}
                      onChange={(v) => updateNutrition("vitaminA", v)}
                    />
                    <NumberField
                      label="Vitamin C (mg)"
                      value={form.nutrition?.vitaminC}
                      onChange={(v) => updateNutrition("vitaminC", v)}
                    />
                    <NumberField
                      label="Vitamin D (mcg)"
                      value={form.nutrition?.vitaminD}
                      onChange={(v) => updateNutrition("vitaminD", v)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky save/cancel bar */}
          <div className="sticky bottom-16 mt-6 flex gap-3 border-t border-border-1 bg-surface-1 pb-4 pt-4 lg:bottom-0">
            <button
              onClick={cancelEdit}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-border-1 px-6 py-3 text-base font-semibold text-secondary-2 transition-colors active:bg-surface-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary-1 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-2 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── View Mode ───────────────────────────────────────────────
  const sections = groupStepsBySections(recipe.steps);
  let globalStepIndex = 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="animate-rise-in">
        {/* Hero image */}
        {recipe.imageUrl && (
          <div className="aspect-[16/9] w-full">
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="px-4 py-4">
          {/* Back + actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                navigate({ to: "/", search: { search: "", category: "" } })
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-2 active:bg-primary-4"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="relative flex items-center gap-1">
              <button
                onClick={enterEditMode}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-2 active:bg-primary-4"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() =>
                  setShowShoppingListPicker(!showShoppingListPicker)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-2 active:bg-primary-4"
              >
                <ShoppingCart size={18} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-error-1 active:bg-error-2"
              >
                <Trash2 size={18} />
              </button>
              <ConfirmDialog
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete this recipe?"
                description="This action cannot be undone. The recipe and all its data will be permanently removed."
                confirmLabel="Delete"
                variant="danger"
              />

              {/* Shopping list picker dropdown */}
              {showShoppingListPicker && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border-1 bg-surface-1 p-3 shadow-lg">
                  <p className="mb-2 text-sm font-semibold text-secondary-1">
                    Add to shopping list
                  </p>
                  {shoppingLists && shoppingLists.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {shoppingLists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() =>
                            addToListMutation.mutate({
                              recipeId: recipe.id,
                              shoppingListId: list.id,
                            })
                          }
                          disabled={addToListMutation.isPending}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-secondary-1 transition-colors hover:bg-surface-2 active:bg-primary-4"
                        >
                          <ShoppingCart
                            size={14}
                            className="text-secondary-3"
                          />
                          {list.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="New list name…"
                      className="flex-1 rounded-lg border border-border-1 bg-surface-1 px-3 py-2 text-sm text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newListName.trim()) {
                          addToListMutation.mutate({
                            recipeId: recipe.id,
                            newListName: newListName.trim(),
                          });
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newListName.trim()) {
                          addToListMutation.mutate({
                            recipeId: recipe.id,
                            newListName: newListName.trim(),
                          });
                        }
                      }}
                      disabled={
                        !newListName.trim() || addToListMutation.isPending
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-1 text-white disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {addToListMutation.isSuccess && (
                    <p className="mt-2 text-xs text-primary-1">
                      Added to list!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Title + meta */}
          <h1 className="mt-2 text-2xl font-bold text-secondary-1">
            {recipe.name}
          </h1>
          {recipe.description && (
            <p className="mt-1 text-secondary-2">{recipe.description}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-secondary-3">
            {recipe.category && (
              <span className="rounded-full bg-primary-4 px-3 py-1 text-primary-1">
                {recipe.category}
              </span>
            )}
            {recipe.totalTime && (
              <span className="flex items-center gap-1">
                <Clock size={14} /> {recipe.totalTime}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users size={14} /> {recipe.servings}
              </span>
            )}
          </div>

          {/* Tab bar */}
          <div className="mt-6 flex border-b border-border-1">
            <button
              onClick={() => setActiveTab("ingredients")}
              className={`flex-1 border-b-2 pb-3 pt-2 text-center text-sm font-semibold transition-colors ${
                activeTab === "ingredients"
                  ? "border-primary-1 text-primary-1"
                  : "border-transparent text-secondary-3"
              }`}
            >
              Ingredients ({recipe.ingredients.length})
            </button>
            <button
              onClick={() => setActiveTab("steps")}
              className={`flex-1 border-b-2 pb-3 pt-2 text-center text-sm font-semibold transition-colors ${
                activeTab === "steps"
                  ? "border-primary-1 text-primary-1"
                  : "border-transparent text-secondary-3"
              }`}
            >
              Steps ({recipe.steps.length})
            </button>
            {recipe.nutrition && (
              <button
                onClick={() => setActiveTab("nutrition")}
                className={`flex-1 border-b-2 pb-3 pt-2 text-center text-sm font-semibold transition-colors ${
                  activeTab === "nutrition"
                    ? "border-primary-1 text-primary-1"
                    : "border-transparent text-secondary-3"
                }`}
              >
                Nutrition
              </button>
            )}
          </div>

          {/* Tab content */}
          {activeTab === "ingredients" ? (
            <ul className="mt-4 space-y-1">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id}>
                  <button
                    onClick={() => toggleIngredient(ing.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-primary-4/50 ${
                      checkedIngredients.has(ing.id)
                        ? "text-secondary-3 line-through"
                        : "text-secondary-1"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
                        checkedIngredients.has(ing.id)
                          ? "border-primary-1 bg-primary-1"
                          : "border-border-1"
                      }`}
                    >
                      {checkedIngredients.has(ing.id) && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                    <span className="flex items-baseline gap-1.5">
                      {(ing.quantity != null || ing.unit) && (
                        <span className="text-sm tabular-nums text-secondary-2">
                          {ing.quantity != null ? ing.quantity : ""}
                          {ing.unit ? ` ${ing.unit}` : ""}
                        </span>
                      )}
                      <span className="text-base">
                        {ing.name ?? ing.rawText}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : activeTab === "steps" ? (
            <div className="mt-4 space-y-2">
              {sections.map((section) => (
                <div key={section.name ?? "__default"}>
                  {section.name && (
                    <div className="my-4 flex items-center gap-3 text-sm font-semibold text-secondary-2">
                      <span className="h-px flex-1 bg-border-1" />
                      <span>{section.name}</span>
                      <span className="h-px flex-1 bg-border-1" />
                    </div>
                  )}
                  <ol className="space-y-4">
                    {section.steps.map((step) => {
                      globalStepIndex++;
                      const ings = step.ingredientIds
                        .map((id) =>
                          recipe.ingredients.find((ing) => ing.id === id),
                        )
                        .filter(Boolean);
                      return (
                        <li key={step.id} className="flex gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-4 text-sm font-semibold text-primary-1">
                            {globalStepIndex}
                          </div>
                          <div className="flex-1">
                            {/* Mobile: ingredients ABOVE step */}
                            {ings.length > 0 && (
                              <div className="mb-2 rounded-lg border border-dashed border-primary-2 bg-primary-4/30 px-3 py-2 md:hidden">
                                <p className="mb-1 text-xs font-semibold text-primary-2">
                                  Pull out:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {ings.map((ing) => (
                                    <span
                                      key={ing!.id}
                                      className="text-xs text-primary-1"
                                    >
                                      {ing!.rawText}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Desktop: two-column with dotted leader */}
                            <div className="hidden md:flex md:items-start md:gap-2">
                              <p className="flex-1 text-base text-secondary-1">
                                {step.text}
                              </p>
                              {ings.length > 0 && (
                                <>
                                  <div className="mt-2.5 w-6 shrink-0 border-b border-dotted border-secondary-3" />
                                  <div className="w-[35%] shrink-0 space-y-0.5 text-sm text-secondary-2">
                                    {ings.map((ing) => (
                                      <p key={ing!.id}>{ing!.rawText}</p>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Mobile: step text after ingredients */}
                            <p className="text-base text-secondary-1 md:hidden">
                              {step.text}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          ) : activeTab === "nutrition" && recipe.nutrition ? (
            <NutritionTab nutrition={recipe.nutrition} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NutritionTab({
  nutrition,
}: {
  nutrition: {
    calories?: number | null;
    protein?: number | null;
    carbohydrates?: number | null;
    fat?: number | null;
    saturatedFat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
    sodium?: number | null;
    cholesterol?: number | null;
    calcium?: number | null;
    iron?: number | null;
    potassium?: number | null;
    vitaminA?: number | null;
    vitaminC?: number | null;
    vitaminD?: number | null;
    servingSize?: string | null;
  };
}) {
  const [showMicro, setShowMicro] = useState(false);

  const macros = [
    { label: "kcal", value: nutrition.calories, unit: "" },
    { label: "protein", value: nutrition.protein, unit: "g" },
    { label: "carbs", value: nutrition.carbohydrates, unit: "g" },
    { label: "fat", value: nutrition.fat, unit: "g" },
  ];

  const micronutrients = [
    { label: "Saturated Fat", value: nutrition.saturatedFat, unit: "g" },
    { label: "Fiber", value: nutrition.fiber, unit: "g" },
    { label: "Sugar", value: nutrition.sugar, unit: "g" },
    { label: "Sodium", value: nutrition.sodium, unit: "mg" },
    { label: "Cholesterol", value: nutrition.cholesterol, unit: "mg" },
    { label: "Calcium", value: nutrition.calcium, unit: "mg" },
    { label: "Iron", value: nutrition.iron, unit: "mg" },
    { label: "Potassium", value: nutrition.potassium, unit: "mg" },
    { label: "Vitamin A", value: nutrition.vitaminA, unit: "mcg" },
    { label: "Vitamin C", value: nutrition.vitaminC, unit: "mg" },
    { label: "Vitamin D", value: nutrition.vitaminD, unit: "mcg" },
  ].filter((m) => m.value != null);

  return (
    <div className="mt-4">
      {nutrition.servingSize && (
        <p className="mb-3 text-sm text-secondary-2">
          Per serving ({nutrition.servingSize})
        </p>
      )}

      {/* Macros grid */}
      <div className="grid grid-cols-4 gap-3">
        {macros.map((m) => (
          <div
            key={m.label}
            className="flex flex-col items-center rounded-xl bg-surface-2 px-3 py-4"
          >
            <span className="text-xl font-bold text-secondary-1">
              {m.value != null ? Math.round(m.value) : "—"}
            </span>
            <span className="text-xs text-secondary-3">
              {m.unit}
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Micronutrients */}
      {micronutrients.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowMicro(!showMicro)}
            className="flex w-full items-center gap-2 py-2 text-sm font-medium text-secondary-2"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${showMicro ? "rotate-180" : ""}`}
            />
            Micronutrients
          </button>
          {showMicro && (
            <div className="mt-1 space-y-2 rounded-xl border border-border-1 p-3">
              {micronutrients.map((m) => (
                <div
                  key={m.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-secondary-2">{m.label}</span>
                  <span className="font-medium text-secondary-1">
                    {m.value}
                    {m.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollapsiblePills({
  ingredients,
  selectedIndices,
  onToggle,
}: {
  ingredients: Array<{ rawText: string }>;
  selectedIndices: number[];
  onToggle: (idx: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [overflowCount, setOverflowCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current || isExpanded) {
      setOverflowCount(0);
      return;
    }
    function computeOverflow() {
      const children = Array.from(
        containerRef.current!.children,
      ) as HTMLElement[];
      if (!children.length) return;
      const threshold =
        children[0]!.offsetTop + children[0]!.offsetHeight + 4;
      setOverflowCount(
        children.filter((c) => c.dataset.pill && c.offsetTop >= threshold)
          .length,
      );
    }
    computeOverflow();
    const observer = new ResizeObserver(computeOverflow);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ingredients.length, isExpanded]);

  return (
    <div className="ml-9 mt-1.5">
      <div
        ref={containerRef}
        className={`flex flex-wrap gap-1 ${!isExpanded ? "max-h-[36px] overflow-hidden" : ""}`}
      >
        {ingredients.map((ing, j) => (
          <button
            key={j}
            data-pill="true"
            type="button"
            onClick={() => onToggle(j)}
            className={`min-h-[32px] rounded-full px-2.5 py-1 text-xs transition-colors ${
              selectedIndices.includes(j)
                ? "bg-primary-1 text-white"
                : "bg-surface-2 text-secondary-3"
            }`}
          >
            {ing.rawText || `#${j + 1}`}
          </button>
        ))}
      </div>
      {overflowCount > 0 && !isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="mt-1 text-xs font-medium text-primary-1"
        >
          +{overflowCount} more
        </button>
      )}
      {isExpanded && ingredients.length > 5 && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="mt-1 text-xs font-medium text-secondary-3"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
        <Tag
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={multiline ? 3 : undefined}
          className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
      </label>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary-1">
        {label}
        <input
          type="number"
          step="any"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
        />
      </label>
    </div>
  );
}

function buildSchemaOrgRecipe(recipe: {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  servings?: string | null;
  prepTime?: string | null;
  cookTime?: string | null;
  totalTime?: string | null;
  ingredients: Array<{ rawText: string }>;
  steps: Array<{ text: string; sectionName?: string | null }>;
  document?: string | null;
  nutrition?: {
    calories?: number | null;
    protein?: number | null;
    carbohydrates?: number | null;
    fat?: number | null;
    saturatedFat?: number | null;
    fiber?: number | null;
    sugar?: number | null;
    sodium?: number | null;
    cholesterol?: number | null;
    servingSize?: string | null;
  } | null;
}) {
  if (recipe.document) {
    try {
      return JSON.parse(recipe.document);
    } catch {
      // Fall through to build from scratch
    }
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
  };

  if (recipe.description) jsonLd.description = recipe.description;
  if (recipe.imageUrl) jsonLd.image = [recipe.imageUrl];
  if (recipe.category) jsonLd.recipeCategory = recipe.category;
  if (recipe.servings) jsonLd.recipeYield = recipe.servings;
  if (recipe.prepTime) jsonLd.prepTime = recipe.prepTime;
  if (recipe.cookTime) jsonLd.cookTime = recipe.cookTime;
  if (recipe.totalTime) jsonLd.totalTime = recipe.totalTime;

  if (recipe.ingredients.length > 0) {
    jsonLd.recipeIngredient = recipe.ingredients.map((ing) => ing.rawText);
  }

  if (recipe.steps.length > 0) {
    jsonLd.recipeInstructions = recipe.steps.map((step) => {
      const howToStep: Record<string, string> = {
        "@type": "HowToStep",
        text: step.text,
      };
      if (step.sectionName) howToStep.name = step.sectionName;
      return howToStep;
    });
  }

  if (recipe.nutrition) {
    const n = recipe.nutrition;
    const nutritionInfo: Record<string, unknown> = {
      "@type": "NutritionInformation",
    };
    if (n.calories != null) nutritionInfo.calories = `${n.calories} calories`;
    if (n.protein != null) nutritionInfo.proteinContent = `${n.protein} g`;
    if (n.carbohydrates != null)
      nutritionInfo.carbohydrateContent = `${n.carbohydrates} g`;
    if (n.fat != null) nutritionInfo.fatContent = `${n.fat} g`;
    if (n.saturatedFat != null)
      nutritionInfo.saturatedFatContent = `${n.saturatedFat} g`;
    if (n.fiber != null) nutritionInfo.fiberContent = `${n.fiber} g`;
    if (n.sugar != null) nutritionInfo.sugarContent = `${n.sugar} g`;
    if (n.sodium != null) nutritionInfo.sodiumContent = `${n.sodium} mg`;
    if (n.cholesterol != null)
      nutritionInfo.cholesterolContent = `${n.cholesterol} mg`;
    if (n.servingSize) nutritionInfo.servingSize = n.servingSize;
    jsonLd.nutrition = nutritionInfo;
  }

  return jsonLd;
}
