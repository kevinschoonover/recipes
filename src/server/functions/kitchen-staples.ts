import { createServerFn } from "@tanstack/react-start";
import { db } from "#/server/db";
import { kitchenStaples } from "#/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "./auth-helpers";

const DEFAULT_STAPLES: Array<{ name: string; category: string }> = [
  // Oils & Fats
  { name: "Olive oil", category: "Oils & Fats" },
  { name: "Vegetable oil", category: "Oils & Fats" },
  { name: "Butter", category: "Oils & Fats" },
  { name: "Cooking spray", category: "Oils & Fats" },
  // Salt & Pepper
  { name: "Salt", category: "Salt & Pepper" },
  { name: "Black pepper", category: "Salt & Pepper" },
  // Spices
  { name: "Garlic powder", category: "Spices" },
  { name: "Onion powder", category: "Spices" },
  { name: "Paprika", category: "Spices" },
  { name: "Cumin", category: "Spices" },
  { name: "Chili powder", category: "Spices" },
  { name: "Oregano", category: "Spices" },
  { name: "Basil (dried)", category: "Spices" },
  { name: "Thyme (dried)", category: "Spices" },
  { name: "Cinnamon", category: "Spices" },
  { name: "Red pepper flakes", category: "Spices" },
  { name: "Bay leaves", category: "Spices" },
  { name: "Italian seasoning", category: "Spices" },
  // Condiments & Sauces
  { name: "Soy sauce", category: "Condiments" },
  { name: "Vinegar", category: "Condiments" },
  { name: "Hot sauce", category: "Condiments" },
  // Baking
  { name: "All-purpose flour", category: "Baking" },
  { name: "Sugar", category: "Baking" },
  { name: "Brown sugar", category: "Baking" },
  { name: "Baking powder", category: "Baking" },
  { name: "Baking soda", category: "Baking" },
  { name: "Vanilla extract", category: "Baking" },
  // Pantry
  { name: "Garlic", category: "Pantry" },
  { name: "Onion", category: "Pantry" },
];

export const seedDefaultStaples = createServerFn({ method: "POST" }).handler(
  async () => {
    const user = await getAuthenticatedUser();

    // Get existing staple names to avoid duplicates
    const existing = await db
      .select({ name: kitchenStaples.name })
      .from(kitchenStaples)
      .where(eq(kitchenStaples.userId, user.id));
    const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

    const toInsert = DEFAULT_STAPLES.filter(
      (s) => !existingNames.has(s.name.toLowerCase()),
    ).map((s) => ({ userId: user.id, name: s.name, category: s.category }));

    if (toInsert.length > 0) {
      await db.insert(kitchenStaples).values(toInsert);
    }

    return { added: toInsert.length };
  },
);

export const getKitchenStaples = createServerFn({ method: "GET" }).handler(
  async () => {
    const user = await getAuthenticatedUser();
    return db
      .select()
      .from(kitchenStaples)
      .where(eq(kitchenStaples.userId, user.id))
      .orderBy(kitchenStaples.name);
  },
);

export const addStaple = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string; category?: string }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    const [staple] = await db
      .insert(kitchenStaples)
      .values({
        userId: user.id,
        name: data.name,
        category: data.category,
      })
      .returning();
    return staple;
  });

export const removeStaple = createServerFn({ method: "POST" })
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const user = await getAuthenticatedUser();
    await db
      .delete(kitchenStaples)
      .where(
        and(eq(kitchenStaples.id, data.id), eq(kitchenStaples.userId, user.id)),
      );
    return { success: true };
  });
