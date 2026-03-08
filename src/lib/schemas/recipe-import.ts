import { z } from "zod/v4";

/**
 * Schema.org Recipe LD+JSON schema matching Google's structured data spec.
 * @see https://developers.google.com/search/docs/appearance/structured-data/recipe
 * @see https://jsonld.com/recipe/
 */
const HowToStepSchema = z.object({
  "@type": z.literal("HowToStep"),
  name: z.string().optional(),
  text: z.string(),
  url: z.string().optional(),
  image: z.string().optional(),
});

const NutritionSchema = z.object({
  "@type": z.literal("NutritionInformation"),
  calories: z.string().optional(),
  fatContent: z.string().optional(),
  saturatedFatContent: z.string().optional(),
  cholesterolContent: z.string().optional(),
  sodiumContent: z.string().optional(),
  carbohydrateContent: z.string().optional(),
  fiberContent: z.string().optional(),
  sugarContent: z.string().optional(),
  proteinContent: z.string().optional(),
  servingSize: z.string().optional(),
});

const RecipeLdJsonSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("Recipe"),
  name: z.string(),
  description: z.string().optional(),
  image: z.union([z.string(), z.array(z.string())]).optional(),
  author: z
    .object({
      "@type": z.enum(["Person", "Organization"]),
      name: z.string(),
    })
    .optional(),
  datePublished: z.string().optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  recipeYield: z.string().optional(),
  recipeCategory: z.string().optional(),
  recipeCuisine: z.string().optional(),
  keywords: z.string().optional(),
  nutrition: NutritionSchema.optional(),
  recipeIngredient: z.array(z.string()),
  recipeInstructions: z.array(HowToStepSchema),
});

/**
 * Full structured output schema for recipe import.
 * Combines app-internal fields with the Schema.org LD+JSON document.
 */
export const RecipeImportSchema = z.object({
  name: z.string().describe("Recipe title"),
  description: z.string().optional().describe("Brief description"),
  category: z
    .string()
    .optional()
    .describe('e.g., "Dinner", "Dessert", "Breakfast"'),
  servings: z.string().optional().describe('e.g., "4 servings"'),
  prepTime: z
    .string()
    .optional()
    .describe('ISO 8601 duration, e.g., "PT15M"'),
  cookTime: z
    .string()
    .optional()
    .describe('ISO 8601 duration, e.g., "PT30M"'),
  totalTime: z
    .string()
    .optional()
    .describe('ISO 8601 duration, e.g., "PT45M"'),
  imageUrl: z.string().optional().describe("Image URL if available"),
  ingredients: z
    .array(
      z.object({
        rawText: z.string().describe("Full ingredient text, e.g. '2 cups flour'"),
        name: z.string().optional().describe("Ingredient name, e.g. 'flour'"),
        quantity: z.number().optional().describe("Numeric quantity, e.g. 2"),
        unit: z.string().optional().describe("Unit of measure, e.g. 'cups'"),
      }),
    )
    .describe("Parsed ingredients"),
  steps: z
    .array(
      z.object({
        text: z.string().describe("Step instruction text"),
        sectionName: z
          .string()
          .optional()
          .describe("Section heading if applicable"),
        ingredientIndices: z
          .array(z.number())
          .optional()
          .describe(
            "0-based indices into the ingredients array used in this step",
          ),
      }),
    )
    .describe("Recipe steps"),
  document: RecipeLdJsonSchema.describe(
    "Full Schema.org Recipe LD+JSON conforming to Google structured data guidelines",
  ),
});

export type RecipeImport = z.infer<typeof RecipeImportSchema>;
export type RecipeLdJson = z.infer<typeof RecipeLdJsonSchema>;
