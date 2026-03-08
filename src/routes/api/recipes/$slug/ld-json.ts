import { createFileRoute } from "@tanstack/react-router";
import { db } from "#/server/db";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeNutrition,
} from "#/server/db/schema";
import { eq, asc } from "drizzle-orm";

async function handleLdJson(
  _request: Request,
  slug: string,
): Promise<Response> {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.slug, slug))
    .limit(1);

  if (!recipe) {
    return new Response("Not found", { status: 404 });
  }

  // If there's a stored document, serve it directly
  if (recipe.document) {
    try {
      const doc = JSON.parse(recipe.document);
      return Response.json(doc, {
        headers: {
          "Content-Type": "application/ld+json",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // Fall through to build from scratch
    }
  }

  const ingredients = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, recipe.id))
    .orderBy(asc(recipeIngredients.sortOrder));

  const steps = await db
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, recipe.id))
    .orderBy(asc(recipeSteps.sortOrder));

  const [nutrition] = await db
    .select()
    .from(recipeNutrition)
    .where(eq(recipeNutrition.recipeId, recipe.id))
    .limit(1);

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

  if (ingredients.length > 0) {
    jsonLd.recipeIngredient = ingredients.map((ing) => ing.rawText);
  }

  if (steps.length > 0) {
    jsonLd.recipeInstructions = steps.map((step) => {
      const howToStep: Record<string, string> = {
        "@type": "HowToStep",
        text: step.text,
      };
      if (step.sectionName) howToStep.name = step.sectionName;
      return howToStep;
    });
  }

  // Add nutrition if available
  if (nutrition) {
    const nutritionInfo: Record<string, unknown> = {
      "@type": "NutritionInformation",
    };
    if (nutrition.calories != null)
      nutritionInfo.calories = `${nutrition.calories} calories`;
    if (nutrition.protein != null)
      nutritionInfo.proteinContent = `${nutrition.protein} g`;
    if (nutrition.carbohydrates != null)
      nutritionInfo.carbohydrateContent = `${nutrition.carbohydrates} g`;
    if (nutrition.fat != null) nutritionInfo.fatContent = `${nutrition.fat} g`;
    if (nutrition.saturatedFat != null)
      nutritionInfo.saturatedFatContent = `${nutrition.saturatedFat} g`;
    if (nutrition.fiber != null)
      nutritionInfo.fiberContent = `${nutrition.fiber} g`;
    if (nutrition.sugar != null)
      nutritionInfo.sugarContent = `${nutrition.sugar} g`;
    if (nutrition.sodium != null)
      nutritionInfo.sodiumContent = `${nutrition.sodium} mg`;
    if (nutrition.cholesterol != null)
      nutritionInfo.cholesterolContent = `${nutrition.cholesterol} mg`;
    if (nutrition.servingSize)
      nutritionInfo.servingSize = nutrition.servingSize;
    jsonLd.nutrition = nutritionInfo;
  }

  return Response.json(jsonLd, {
    headers: {
      "Content-Type": "application/ld+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export const Route = createFileRoute("/api/recipes/$slug/ld-json")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleLdJson(request, (params as { slug: string }).slug),
    },
  },
});
