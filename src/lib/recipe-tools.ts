import { toolDefinition } from "@tanstack/ai";
import { z } from "zod/v4";

export const parseRecipeToolDef = toolDefinition({
  name: "parseRecipe",
  description:
    "Extract structured recipe data from raw text, URL content, or image description. Returns a complete recipe object.",
  inputSchema: z.object({
    source: z.string().describe("The raw text or URL content to parse"),
    sourceType: z
      .enum(["url", "text", "photo"])
      .describe("The type of source content"),
  }),
  outputSchema: z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    servings: z.string().optional(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    totalTime: z.string().optional(),
    imageUrl: z.string().optional(),
    ingredients: z.array(
      z.object({
        rawText: z.string(),
        name: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
      }),
    ),
    steps: z.array(
      z.object({
        text: z.string(),
        sectionName: z.string().optional(),
      }),
    ),
  }),
});

export const searchRecipesToolDef = toolDefinition({
  name: "searchRecipes",
  description:
    "Search the user's recipe collection by name or category. Use this to find recipes matching a query.",
  inputSchema: z.object({
    query: z.string().describe("Search query for recipe names"),
    category: z.string().optional().describe("Filter by category"),
  }),
  outputSchema: z.array(
    z.object({
      id: z.number(),
      slug: z.string(),
      name: z.string(),
      description: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
    }),
  ),
});

export const showRecipeToolDef = toolDefinition({
  name: "showRecipe",
  description:
    "Display a recipe card to the user. MUST be used when recommending or referencing a specific recipe.",
  inputSchema: z.object({
    slug: z.string().describe("The slug of the recipe to display"),
  }),
  outputSchema: z.object({
    slug: z.string(),
  }),
});

export const showRecipeClient = showRecipeToolDef.client(({ slug }) => ({
  slug,
}));
