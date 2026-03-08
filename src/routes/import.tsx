import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Link as LinkIcon, FileText, Camera, Loader2 } from "lucide-react";
import { createRecipe } from "#/server/functions/recipes";
import type { RecipeInput } from "#/server/functions/recipes";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/import")({
  component: ImportPage,
});

type ImportTab = "url" | "text" | "photo";

/** Parse a Schema.org nutrition string like "450 calories" into a number */
function parseNutritionValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : undefined;
}

function ImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ImportTab>("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<RecipeInput | null>(null);

  async function handleImport() {
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("type", tab);

    if (tab === "url") {
      formData.set("content", urlInput);
    } else if (tab === "text") {
      formData.set("content", textInput);
    } else if (tab === "photo" && file) {
      formData.set("file", file);
    }

    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // Extract nutrition from document.nutrition if present
        const docNutrition = data.document?.nutrition;
        let nutrition: RecipeInput["nutrition"] | undefined;
        if (docNutrition) {
          nutrition = {
            calories: parseNutritionValue(docNutrition.calories),
            protein: parseNutritionValue(docNutrition.proteinContent),
            carbohydrates: parseNutritionValue(
              docNutrition.carbohydrateContent,
            ),
            fat: parseNutritionValue(docNutrition.fatContent),
            saturatedFat: parseNutritionValue(docNutrition.saturatedFatContent),
            fiber: parseNutritionValue(docNutrition.fiberContent),
            sugar: parseNutritionValue(docNutrition.sugarContent),
            sodium: parseNutritionValue(docNutrition.sodiumContent),
            cholesterol: parseNutritionValue(docNutrition.cholesterolContent),
            servingSize: docNutrition.servingSize,
          };
        }
        setPreview({
          name: data.name ?? "",
          description: data.description,
          imageUrl: data.imageUrl,
          category: data.category,
          servings: data.servings,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          totalTime: data.totalTime,
          document:
            typeof data.document === "string"
              ? data.document
              : JSON.stringify(data.document),
          importedFrom: tab === "url" ? urlInput : undefined,
          ingredients: data.ingredients ?? [],
          steps: data.steps ?? [],
          nutrition,
        });
      }
    } catch {
      setError("Failed to import recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreview() {
    if (!preview) return;
    setLoading(true);
    const recipe = await createRecipe({ data: preview });
    queryClient.invalidateQueries({ queryKey: ["recipes"] });
    navigate({ to: "/recipes/$slug", params: { slug: recipe.slug } });
  }

  if (preview) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="animate-rise-in">
          <h1 className="text-2xl font-bold text-secondary-1">Review Import</h1>
          <p className="mt-1 text-sm text-secondary-2">
            Check the extracted recipe and save it.
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border-1 p-4">
              <h2 className="text-lg font-semibold text-secondary-1">
                {preview.name}
              </h2>
              {preview.description && (
                <p className="mt-1 text-sm text-secondary-2">
                  {preview.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-secondary-3">
                {preview.category && (
                  <span className="rounded-full bg-primary-4 px-2 py-0.5 text-primary-1">
                    {preview.category}
                  </span>
                )}
                {preview.servings && <span>{preview.servings}</span>}
                {preview.totalTime && <span>{preview.totalTime}</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-border-1 p-4">
              <h3 className="font-semibold text-secondary-1">
                Ingredients ({preview.ingredients.length})
              </h3>
              <ul className="mt-2 space-y-1">
                {preview.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-secondary-2">
                    {ing.rawText}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border-1 p-4">
              <h3 className="font-semibold text-secondary-1">
                Steps ({preview.steps.length})
              </h3>
              <ol className="mt-2 space-y-2">
                {preview.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-secondary-2">
                    <span className="shrink-0 font-semibold text-primary-1">
                      {i + 1}.
                    </span>
                    {step.text}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setPreview(null)}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-border-1 px-6 py-3 text-base font-semibold text-secondary-2"
            >
              Back
            </button>
            <button
              onClick={handleSavePreview}
              disabled={loading}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary-1 px-6 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save Recipe"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="animate-rise-in">
        <h1 className="text-2xl font-bold text-secondary-1">Import Recipe</h1>
        <p className="mt-2 text-secondary-2">
          Add a new recipe from a URL, pasted text, or photo.
        </p>

        {/* Tab bar */}
        <div className="mt-6 flex border-b border-border-1">
          {(
            [
              { key: "url" as const, label: "URL", icon: LinkIcon },
              { key: "text" as const, label: "Text", icon: FileText },
              { key: "photo" as const, label: "Photo", icon: Camera },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 pb-3 pt-2 text-sm font-semibold transition-colors ${
                tab === key
                  ? "border-primary-1 text-primary-1"
                  : "border-transparent text-secondary-3"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-error-2 px-4 py-3 text-sm text-error-1">
            {error}
          </div>
        )}

        <div className="mt-6">
          {tab === "url" && (
            <div>
              <label className="block text-sm font-medium text-secondary-1">
                Recipe URL
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
                />
              </label>
            </div>
          )}

          {tab === "text" && (
            <div>
              <label className="block text-sm font-medium text-secondary-1">
                Recipe Text
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={8}
                  placeholder="Paste your recipe text here…"
                  className="mt-1 block w-full rounded-xl border border-border-1 bg-surface-1 px-4 py-3 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
                />
              </label>
            </div>
          )}

          {tab === "photo" && (
            <div>
              <label className="block text-sm font-medium text-secondary-1">
                Recipe Photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-secondary-2 file:mr-4 file:rounded-xl file:border-0 file:bg-primary-4 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-primary-1"
                />
              </label>
              {file && (
                <p className="mt-2 text-sm text-secondary-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleImport}
          disabled={
            loading ||
            (tab === "url" && !urlInput) ||
            (tab === "text" && !textInput) ||
            (tab === "photo" && !file)
          }
          className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary-1 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            "Import with AI"
          )}
        </button>
      </div>
    </div>
  );
}
