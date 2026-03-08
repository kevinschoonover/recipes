import {
  integer,
  sqliteTableCreator,
  primaryKey,
  text,
  index,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Multi-project schema prefix — all tables prefixed with `recipes_`
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const sqliteTable = sqliteTableCreator((name) => `recipes_${name}`);

// ─── Auth tables (Better Auth) ──────────────────────────────────────────────

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verifications = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ─── Recipe tables ───────────────────────────────────────────────────────────

export const recipes = sqliteTable(
  "recipes",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    importedFrom: text("importedFrom"),
    document: text("document"),
    name: text("name").notNull(),
    description: text("description"),
    imageUrl: text("imageUrl"),
    category: text("category"),
    servings: text("servings"),
    prepTime: text("prepTime"),
    cookTime: text("cookTime"),
    totalTime: text("totalTime"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => ({
    slugIdx: index("slug_idx").on(table.slug),
    userIdx: index("recipe_user_idx").on(table.userId),
  }),
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredient",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    recipeId: integer("recipeId")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    sortOrder: integer("sortOrder").notNull().default(0),
    rawText: text("rawText").notNull(),
    name: text("name"),
    quantity: real("quantity"),
    unit: text("unit"),
    isStaple: integer("isStaple", { mode: "boolean" }).default(false),
  },
  (table) => ({
    recipeIdx: index("ingredient_recipe_idx").on(table.recipeId),
  }),
);

export const recipeSteps = sqliteTable(
  "recipe_step",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    recipeId: integer("recipeId")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    sectionName: text("sectionName"),
    sortOrder: integer("sortOrder").notNull().default(0),
    text: text("text").notNull(),
  },
  (table) => ({
    recipeIdx: index("step_recipe_idx").on(table.recipeId),
  }),
);

export const stepIngredients = sqliteTable(
  "step_ingredient",
  {
    recipeStepId: integer("recipeStepId")
      .notNull()
      .references(() => recipeSteps.id, { onDelete: "cascade" }),
    recipeIngredientId: integer("recipeIngredientId")
      .notNull()
      .references(() => recipeIngredients.id, { onDelete: "cascade" }),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.recipeStepId, table.recipeIngredientId],
    }),
  }),
);

// ─── Nutrition ───────────────────────────────────────────────────────────────

export const recipeNutrition = sqliteTable(
  "recipe_nutrition",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    recipeId: integer("recipeId")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" })
      .unique(),
    // Macros (per serving)
    calories: real("calories"),
    protein: real("protein"),
    carbohydrates: real("carbohydrates"),
    fat: real("fat"),
    // Detailed macros
    saturatedFat: real("saturatedFat"),
    fiber: real("fiber"),
    sugar: real("sugar"),
    // Micronutrients
    sodium: real("sodium"),
    cholesterol: real("cholesterol"),
    calcium: real("calcium"),
    iron: real("iron"),
    potassium: real("potassium"),
    vitaminA: real("vitaminA"),
    vitaminC: real("vitaminC"),
    vitaminD: real("vitaminD"),
    // Serving context
    servingSize: text("servingSize"),
  },
  (table) => ({
    recipeIdx: index("nutrition_recipe_idx").on(table.recipeId),
  }),
);

// ─── Kitchen staples ─────────────────────────────────────────────────────────

export const kitchenStaples = sqliteTable(
  "kitchen_staple",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"),
  },
  (table) => ({
    userIdx: index("staple_user_idx").on(table.userId),
  }),
);

// ─── Shopping lists ──────────────────────────────────────────────────────────

export const shoppingLists = sqliteTable(
  "shopping_list",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(
      sql`(unixepoch())`,
    ),
  },
  (table) => ({
    userIdx: index("shopping_list_user_idx").on(table.userId),
  }),
);

export const shoppingListItems = sqliteTable(
  "shopping_list_item",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    shoppingListId: integer("shoppingListId")
      .notNull()
      .references(() => shoppingLists.id, { onDelete: "cascade" }),
    recipeIngredientId: integer("recipeIngredientId").references(
      () => recipeIngredients.id,
    ),
    recipeId: integer("recipeId").references(() => recipes.id),
    name: text("name").notNull(),
    quantity: real("quantity"),
    unit: text("unit"),
    checked: integer("checked", { mode: "boolean" }).default(false),
    sortOrder: integer("sortOrder").notNull().default(0),
    category: text("category").default("Other"),
  },
  (table) => ({
    listIdx: index("shopping_item_list_idx").on(table.shoppingListId),
  }),
);
