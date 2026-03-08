import { parse } from "node-html-parser";
import type { RecipeImport } from "#/lib/schemas/recipe-import";

/** Check if a @type value matches "Recipe" (can be string or array) */
function isRecipeType(type: unknown): boolean {
  if (type === "Recipe") return true;
  if (Array.isArray(type)) return type.includes("Recipe");
  return false;
}

/** Coerce a value that may be string or string[] into a single string */
function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string")
    return value[0];
  return undefined;
}

/**
 * Extract Recipe LD+JSON from HTML using node-html-parser.
 * Returns the first Recipe found, or null if none.
 */
export function extractLdJsonFromHtml(
  html: string,
): Record<string, unknown> | null {
  const root = parse(html);
  const scripts = root.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);

      // Direct Recipe object
      if (isRecipeType(data["@type"])) return data;

      // @graph array (common in Yoast, WordPress, etc.)
      if (data["@graph"] && Array.isArray(data["@graph"])) {
        const recipe = data["@graph"].find((item: Record<string, unknown>) =>
          isRecipeType(item["@type"]),
        );
        if (recipe) return recipe;
      }

      // Array of objects
      if (Array.isArray(data)) {
        const recipe = data.find((item: Record<string, unknown>) =>
          isRecipeType(item["@type"]),
        );
        if (recipe) return recipe;
      }
    } catch {
      // Invalid JSON in this script tag, try next
    }
  }

  return null;
}

/**
 * Convert a raw Schema.org Recipe LD+JSON object into our app's RecipeImport format.
 */
export function ldJsonToRecipeImport(
  ldJson: Record<string, unknown>,
): RecipeImport {
  const name = (ldJson.name as string) || "Untitled Recipe";
  const description = ldJson.description as string | undefined;
  const category = firstString(ldJson.recipeCategory);
  const servings = firstString(ldJson.recipeYield);
  const prepTime = ldJson.prepTime as string | undefined;
  const cookTime = ldJson.cookTime as string | undefined;
  const totalTime = ldJson.totalTime as string | undefined;

  // Image can be string, array of strings, or ImageObject
  let imageUrl: string | undefined;
  if (typeof ldJson.image === "string") {
    imageUrl = ldJson.image;
  } else if (Array.isArray(ldJson.image) && ldJson.image.length > 0) {
    const first = ldJson.image[0];
    imageUrl =
      typeof first === "string"
        ? first
        : ((first as Record<string, unknown>)?.url as string);
  } else if (ldJson.image && typeof ldJson.image === "object") {
    imageUrl = (ldJson.image as Record<string, unknown>).url as string;
  }

  // Parse ingredients from recipeIngredient string array
  const rawIngredients = (ldJson.recipeIngredient as string[]) || [];
  const ingredients = rawIngredients.map((text) => ({ rawText: text }));

  // Parse steps from recipeInstructions (HowToStep[], HowToSection[], or string[])
  const rawInstructions = (ldJson.recipeInstructions as unknown[]) || [];
  const steps: Array<{ text: string; sectionName?: string }> = [];

  for (const instruction of rawInstructions) {
    if (typeof instruction === "string") {
      steps.push({ text: instruction });
    } else if (instruction && typeof instruction === "object") {
      const obj = instruction as Record<string, unknown>;
      if (obj["@type"] === "HowToStep") {
        steps.push({
          text: (obj.text as string) || "",
          sectionName: obj.name as string | undefined,
        });
      } else if (obj["@type"] === "HowToSection") {
        const sectionName = obj.name as string | undefined;
        const sectionSteps = (obj.itemListElement as unknown[]) || [];
        for (const sub of sectionSteps) {
          if (typeof sub === "string") {
            steps.push({ text: sub, sectionName });
          } else if (sub && typeof sub === "object") {
            steps.push({
              text: ((sub as Record<string, unknown>).text as string) || "",
              sectionName,
            });
          }
        }
      }
    }
  }

  // Build a clean LD+JSON document
  const document: RecipeImport["document"] = {
    "@context": "https://schema.org" as const,
    "@type": "Recipe" as const,
    name,
    description,
    image: imageUrl ? [imageUrl] : undefined,
    prepTime,
    cookTime,
    totalTime,
    recipeYield: servings,
    recipeCategory: category,
    recipeCuisine: firstString(ldJson.recipeCuisine),
    keywords: ldJson.keywords as string | undefined,
    recipeIngredient: rawIngredients,
    recipeInstructions: steps.map((s) => ({
      "@type": "HowToStep" as const,
      text: s.text,
      name: s.sectionName,
    })),
  };

  // Copy author if present (can be object, array, or @id reference)
  if (ldJson.author) {
    const authorObj = Array.isArray(ldJson.author)
      ? (ldJson.author[0] as Record<string, unknown> | undefined)
      : typeof ldJson.author === "object"
        ? (ldJson.author as Record<string, unknown>)
        : undefined;
    if (authorObj?.name) {
      document.author = {
        "@type":
          authorObj["@type"] === "Organization" ? "Organization" : "Person",
        name: authorObj.name as string,
      };
    }
  }

  // Copy nutrition if present
  if (ldJson.nutrition && typeof ldJson.nutrition === "object") {
    const n = ldJson.nutrition as Record<string, unknown>;
    document.nutrition = {
      "@type": "NutritionInformation" as const,
      calories: n.calories as string | undefined,
      fatContent: n.fatContent as string | undefined,
      proteinContent: n.proteinContent as string | undefined,
      carbohydrateContent: n.carbohydrateContent as string | undefined,
      fiberContent: n.fiberContent as string | undefined,
      sugarContent: n.sugarContent as string | undefined,
      sodiumContent: n.sodiumContent as string | undefined,
      cholesterolContent: n.cholesterolContent as string | undefined,
      saturatedFatContent: n.saturatedFatContent as string | undefined,
      servingSize: n.servingSize as string | undefined,
    };
  }

  return {
    name,
    description,
    category,
    servings,
    prepTime,
    cookTime,
    totalTime,
    imageUrl,
    ingredients,
    steps,
    document,
  };
}
