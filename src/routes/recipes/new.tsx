import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { createRecipe } from "#/server/functions/recipes";
import type { RecipeInput } from "#/server/functions/recipes";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/recipes/new")({
  component: NewRecipe,
});

function emptyForm(): RecipeInput {
  return {
    name: "",
    description: "",
    imageUrl: "",
    category: "",
    servings: "",
    prepTime: "",
    cookTime: "",
    totalTime: "",
    ingredients: [{ rawText: "" }],
    steps: [{ text: "" }],
  };
}

function NewRecipe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RecipeInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    const recipe = await createRecipe({ data: form });
    queryClient.invalidateQueries({ queryKey: ["recipes"] });
    navigate({ to: "/recipes/$slug", params: { slug: recipe.slug } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <div className="animate-rise-in">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary-2 active:bg-primary-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-secondary-1">New Recipe</h1>
        </div>

        <div className="mt-6 space-y-5">
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
                      const next = form.ingredients.filter((_, j) => j !== i);
                      setForm({ ...form, ingredients: next });
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
              <h2 className="text-lg font-semibold text-secondary-1">Steps</h2>
              <button
                onClick={() =>
                  setForm({
                    ...form,
                    steps: [...form.steps, { text: "" }],
                  })
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-1 active:bg-primary-4"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {form.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
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
              ))}
            </div>
          </div>
        </div>

        {/* Sticky bottom bar */}
        <div className="sticky bottom-16 mt-6 flex gap-3 border-t border-border-1 bg-surface-1 pb-4 pt-4 lg:bottom-0">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-border-1 px-6 py-3 text-base font-semibold text-secondary-2 transition-colors active:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary-1 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-2 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Recipe"}
          </button>
        </div>
      </div>
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
