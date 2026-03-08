import { createServerFn } from "@tanstack/react-start";
import { db } from "#/server/db";
import {
  shoppingLists,
  shoppingListItems,
  recipeIngredients,
  kitchenStaples,
  recipes,
} from "#/server/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { getAuthenticatedUser } from "./auth-helpers";
import { categorizeItem } from "#/lib/grocery-categories";

/**
 * Check if an ingredient text matches any kitchen staple.
 * Uses fuzzy matching: "salt, to taste" matches staple "Salt"
 * by checking if the ingredient name/rawText starts with or contains the staple name.
 */
function isStapleIngredient(
  ingredientName: string,
  stapleNames: string[],
): boolean {
  const lower = ingredientName.toLowerCase().trim();
  return stapleNames.some((staple) => {
    // Exact match
    if (lower === staple) return true;
    // Ingredient starts with staple name followed by non-alpha (e.g., "salt, to taste" matches "salt")
    if (
      lower.startsWith(staple) &&
      (lower.length === staple.length || /[^a-z]/.test(lower[staple.length]))
    )
      return true;
    // Staple is a multi-word name contained in the ingredient (e.g., "olive oil, for drizzling" matches "olive oil")
    if (staple.includes(" ") && lower.includes(staple)) return true;
    return false;
  });
}

export const getShoppingLists = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getAuthenticatedUser();

    const lists = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.userId, user.id))
      .orderBy(shoppingLists.createdAt);

    const result = [];
    for (const list of lists) {
      const items = await db
        .select({
          id: shoppingListItems.id,
          shoppingListId: shoppingListItems.shoppingListId,
          recipeIngredientId: shoppingListItems.recipeIngredientId,
          recipeId: shoppingListItems.recipeId,
          name: shoppingListItems.name,
          quantity: shoppingListItems.quantity,
          unit: shoppingListItems.unit,
          checked: shoppingListItems.checked,
          category: shoppingListItems.category,
          recipeName: recipes.name,
          recipeSlug: recipes.slug,
        })
        .from(shoppingListItems)
        .leftJoin(recipes, eq(shoppingListItems.recipeId, recipes.id))
        .where(eq(shoppingListItems.shoppingListId, list.id))
        .orderBy(asc(shoppingListItems.sortOrder));
      result.push({ ...list, items });
    }

    return result;
  },
);

export const addShoppingListItem = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      shoppingListId: number;
      name: string;
      quantity?: number;
      unit?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    await getAuthenticatedUser();

    const [item] = await db
      .insert(shoppingListItems)
      .values({
        shoppingListId: data.shoppingListId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        category: categorizeItem(data.name),
      })
      .returning();

    return item;
  });

export const toggleShoppingListItem = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number; checked: boolean }) => input)
  .handler(async ({ data }) => {
    await getAuthenticatedUser();

    await db
      .update(shoppingListItems)
      .set({ checked: data.checked })
      .where(eq(shoppingListItems.id, data.id));

    return { success: true };
  });

export const removeShoppingListItem = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await getAuthenticatedUser();
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, data.id));
    return { success: true };
  });

export const clearShoppingList = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await getAuthenticatedUser();
    await db
      .delete(shoppingListItems)
      .where(eq(shoppingListItems.shoppingListId, data.id));
    return { success: true };
  });

export const createShoppingList = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();

    const [list] = await db
      .insert(shoppingLists)
      .values({ userId: user.id, name: data.name })
      .returning();

    return list;
  });

export const deleteShoppingList = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    await db
      .delete(shoppingLists)
      .where(
        and(eq(shoppingLists.id, data.id), eq(shoppingLists.userId, user.id)),
      );
    return { success: true };
  });

export const addRecipeToShoppingList = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      recipeId: number;
      shoppingListId?: number;
      newListName?: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();

    // Get or create list
    let listId = data.shoppingListId;
    if (!listId && data.newListName) {
      const [list] = await db
        .insert(shoppingLists)
        .values({ userId: user.id, name: data.newListName })
        .returning();
      listId = list.id;
    }
    if (!listId) throw new Error("Must specify list or new list name");

    // Get user's kitchen staples to exclude (fuzzy matching)
    const staples = await db
      .select({ name: kitchenStaples.name })
      .from(kitchenStaples)
      .where(eq(kitchenStaples.userId, user.id));
    const stapleNamesList = staples.map((s) => s.name.toLowerCase());

    // Get recipe ingredients
    const ingredients = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, data.recipeId));

    const items = ingredients
      .filter(
        (ing) => !isStapleIngredient(ing.name ?? ing.rawText, stapleNamesList),
      )
      .map((ing) => ({
        shoppingListId: listId,
        recipeId: data.recipeId,
        recipeIngredientId: ing.id,
        name: ing.name ?? ing.rawText,
        quantity: ing.quantity,
        unit: ing.unit,
        category: categorizeItem(ing.name ?? ing.rawText),
      }));

    if (items.length > 0) {
      await db.insert(shoppingListItems).values(items);
    }

    return { listId, itemCount: items.length };
  });

export const generateFromRecipes = createServerFn({ method: "POST" })
  .inputValidator((input: { recipeIds: number[]; listName: string }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();

    // Get user's kitchen staples to exclude (fuzzy matching)
    const staples = await db
      .select({ name: kitchenStaples.name })
      .from(kitchenStaples)
      .where(eq(kitchenStaples.userId, user.id));
    const stapleNamesList = staples.map((s) => s.name.toLowerCase());

    // Get ingredients from selected recipes
    const ingredients = await db
      .select({
        recipeId: recipeIngredients.recipeId,
        rawText: recipeIngredients.rawText,
        name: recipeIngredients.name,
        quantity: recipeIngredients.quantity,
        unit: recipeIngredients.unit,
      })
      .from(recipeIngredients)
      .where(inArray(recipeIngredients.recipeId, data.recipeIds));

    // Create the shopping list
    const [list] = await db
      .insert(shoppingLists)
      .values({ userId: user.id, name: data.listName })
      .returning();

    // Add non-staple ingredients
    const itemsToInsert = ingredients
      .filter(
        (ing) => !isStapleIngredient(ing.name ?? ing.rawText, stapleNamesList),
      )
      .map((ing) => ({
        shoppingListId: list.id,
        recipeId: ing.recipeId,
        name: ing.name ?? ing.rawText,
        quantity: ing.quantity,
        unit: ing.unit,
        category: categorizeItem(ing.name ?? ing.rawText),
      }));

    if (itemsToInsert.length > 0) {
      await db.insert(shoppingListItems).values(itemsToInsert);
    }

    return list;
  });

export const updateShoppingItemCategory = createServerFn({ method: "POST" })
  .inputValidator((input: { ids: number[]; category: string }) => input)
  .handler(async ({ data }) => {
    await getAuthenticatedUser();
    await db
      .update(shoppingListItems)
      .set({ category: data.category })
      .where(inArray(shoppingListItems.id, data.ids));
    return { success: true };
  });

export const reorderShoppingListItems = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { updates: Array<{ id: number; sortOrder: number }> }) => input,
  )
  .handler(async ({ data }) => {
    await getAuthenticatedUser();
    for (const update of data.updates) {
      await db
        .update(shoppingListItems)
        .set({ sortOrder: update.sortOrder })
        .where(eq(shoppingListItems.id, update.id));
    }
    return { success: true };
  });
