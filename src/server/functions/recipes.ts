import { createServerFn } from "@tanstack/react-start";
import { db } from "#/server/db";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  stepIngredients,
  recipeNutrition,
  shoppingListItems,
} from "#/server/db/schema";
import { eq, like, and, asc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getAuthenticatedUser } from "./auth-helpers";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    nanoid(6)
  );
}

export const getRecipes = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { search?: string; category?: string }) => input,
  )
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    const conditions = [eq(recipes.userId, user.id)];

    if (data.search) {
      conditions.push(like(recipes.name, `%${data.search}%`));
    }
    if (data.category) {
      conditions.push(eq(recipes.category, data.category));
    }

    return db
      .select()
      .from(recipes)
      .where(and(...conditions))
      .orderBy(recipes.name);
  });

export const getRecipeBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();

    const [recipe] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.slug, data.slug), eq(recipes.userId, user.id)))
      .limit(1);

    if (!recipe) throw new Error("Recipe not found");

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

    // Fetch step-ingredient junction data
    let stepsWithIngredients = steps.map((s) => ({
      ...s,
      ingredientIds: [] as number[],
    }));
    if (steps.length > 0) {
      const stepIngredientRows = await db
        .select()
        .from(stepIngredients)
        .where(
          inArray(
            stepIngredients.recipeStepId,
            steps.map((s) => s.id),
          ),
        );
      const stepIngMap = new Map<number, number[]>();
      for (const row of stepIngredientRows) {
        const arr = stepIngMap.get(row.recipeStepId) ?? [];
        arr.push(row.recipeIngredientId);
        stepIngMap.set(row.recipeStepId, arr);
      }
      stepsWithIngredients = steps.map((s) => ({
        ...s,
        ingredientIds: stepIngMap.get(s.id) ?? [],
      }));
    }

    // Fetch nutrition
    const [nutrition] = await db
      .select()
      .from(recipeNutrition)
      .where(eq(recipeNutrition.recipeId, recipe.id))
      .limit(1);

    return { ...recipe, ingredients, steps: stepsWithIngredients, nutrition: nutrition ?? null };
  });

export type RecipeInput = {
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  importedFrom?: string;
  document?: string;
  ingredients: Array<{
    rawText: string;
    name?: string;
    quantity?: number;
    unit?: string;
  }>;
  steps: Array<{
    text: string;
    sectionName?: string;
    ingredientIndices?: number[];
  }>;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    saturatedFat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
    calcium?: number;
    iron?: number;
    potassium?: number;
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    servingSize?: string;
  };
};

export const createRecipe = createServerFn({ method: "POST" })
  .inputValidator((input: RecipeInput) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    const slug = slugify(data.name);

    const [recipe] = await db
      .insert(recipes)
      .values({
        slug,
        userId: user.id,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category,
        servings: data.servings,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        totalTime: data.totalTime,
        importedFrom: data.importedFrom,
        document: data.document,
      })
      .returning();

    if (data.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        data.ingredients.map((ing: RecipeInput["ingredients"][0], i: number) => ({
          recipeId: recipe!.id,
          sortOrder: i,
          rawText: ing.rawText,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      );
    }

    if (data.steps.length > 0) {
      await db.insert(recipeSteps).values(
        data.steps.map((step: RecipeInput["steps"][0], i: number) => ({
          recipeId: recipe!.id,
          sortOrder: i,
          text: step.text,
          sectionName: step.sectionName,
        })),
      );

      // Populate step-ingredient junction table
      const hasAnyIndices = data.steps.some(
        (s) => s.ingredientIndices && s.ingredientIndices.length > 0,
      );
      if (hasAnyIndices) {
        const insertedSteps = await db
          .select({ id: recipeSteps.id })
          .from(recipeSteps)
          .where(eq(recipeSteps.recipeId, recipe!.id))
          .orderBy(asc(recipeSteps.sortOrder));

        const insertedIngredients = await db
          .select({ id: recipeIngredients.id })
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, recipe!.id))
          .orderBy(asc(recipeIngredients.sortOrder));

        const junctionRows: {
          recipeStepId: number;
          recipeIngredientId: number;
        }[] = [];
        for (let i = 0; i < data.steps.length; i++) {
          const indices = data.steps[i]!.ingredientIndices ?? [];
          for (const idx of indices) {
            if (insertedSteps[i] && insertedIngredients[idx]) {
              junctionRows.push({
                recipeStepId: insertedSteps[i].id,
                recipeIngredientId: insertedIngredients[idx].id,
              });
            }
          }
        }
        if (junctionRows.length > 0) {
          await db.insert(stepIngredients).values(junctionRows);
        }
      }
    }

    // Insert nutrition if provided
    if (data.nutrition) {
      await db.insert(recipeNutrition).values({
        recipeId: recipe!.id,
        ...data.nutrition,
      });
    }

    return recipe!;
  });

export const updateRecipe = createServerFn({ method: "POST" })
  .inputValidator((input: RecipeInput & { slug: string }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();

    const [existing] = await db
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.slug, data.slug), eq(recipes.userId, user.id)))
      .limit(1);

    if (!existing) throw new Error("Recipe not found");

    await db
      .update(recipes)
      .set({
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        category: data.category,
        servings: data.servings,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        totalTime: data.totalTime,
        document: data.document,
      })
      .where(eq(recipes.id, existing.id));

    // Detach shopping list items before replacing ingredients
    const oldIngredientIds = await db
      .select({ id: recipeIngredients.id })
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, existing.id));
    if (oldIngredientIds.length > 0) {
      await db
        .update(shoppingListItems)
        .set({ recipeIngredientId: null })
        .where(
          inArray(
            shoppingListItems.recipeIngredientId,
            oldIngredientIds.map((r) => r.id),
          ),
        );
    }

    // Replace ingredients
    await db
      .delete(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, existing.id));
    if (data.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        data.ingredients.map((ing: RecipeInput["ingredients"][0], i: number) => ({
          recipeId: existing.id,
          sortOrder: i,
          rawText: ing.rawText,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        })),
      );
    }

    // Replace steps — first clean up step_ingredients
    const existingSteps = await db
      .select({ id: recipeSteps.id })
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, existing.id));

    for (const s of existingSteps) {
      await db
        .delete(stepIngredients)
        .where(eq(stepIngredients.recipeStepId, s.id));
    }
    await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, existing.id));

    if (data.steps.length > 0) {
      await db.insert(recipeSteps).values(
        data.steps.map((step: RecipeInput["steps"][0], i: number) => ({
          recipeId: existing.id,
          sortOrder: i,
          text: step.text,
          sectionName: step.sectionName,
        })),
      );

      // Populate step-ingredient junction table
      const hasAnyIndices = data.steps.some(
        (s) => s.ingredientIndices && s.ingredientIndices.length > 0,
      );
      if (hasAnyIndices) {
        const insertedSteps = await db
          .select({ id: recipeSteps.id })
          .from(recipeSteps)
          .where(eq(recipeSteps.recipeId, existing.id))
          .orderBy(asc(recipeSteps.sortOrder));

        const insertedIngredients = await db
          .select({ id: recipeIngredients.id })
          .from(recipeIngredients)
          .where(eq(recipeIngredients.recipeId, existing.id))
          .orderBy(asc(recipeIngredients.sortOrder));

        const junctionRows: {
          recipeStepId: number;
          recipeIngredientId: number;
        }[] = [];
        for (let i = 0; i < data.steps.length; i++) {
          const indices = data.steps[i]!.ingredientIndices ?? [];
          for (const idx of indices) {
            if (insertedSteps[i] && insertedIngredients[idx]) {
              junctionRows.push({
                recipeStepId: insertedSteps[i].id,
                recipeIngredientId: insertedIngredients[idx].id,
              });
            }
          }
        }
        if (junctionRows.length > 0) {
          await db.insert(stepIngredients).values(junctionRows);
        }
      }
    }

    // Upsert nutrition
    await db
      .delete(recipeNutrition)
      .where(eq(recipeNutrition.recipeId, existing.id));
    if (data.nutrition) {
      await db.insert(recipeNutrition).values({
        recipeId: existing.id,
        ...data.nutrition,
      });
    }

    return { slug: data.slug };
  });

export const deleteRecipe = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();

    await db
      .delete(recipes)
      .where(and(eq(recipes.slug, data.slug), eq(recipes.userId, user.id)));

    return { success: true };
  });

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getAuthenticatedUser();
    const rows = await db
      .select({ category: recipes.category })
      .from(recipes)
      .where(eq(recipes.userId, user.id))
      .groupBy(recipes.category);

    return rows
      .map((r) => r.category)
      .filter((c): c is string => c !== null);
  },
);
