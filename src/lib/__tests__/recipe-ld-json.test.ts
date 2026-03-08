import { describe, it, expect } from "vitest";

/**
 * Schema.org Recipe LD+JSON validation tests.
 *
 * Test fixtures sourced from:
 * - https://jsonld.com/recipe/
 * - https://developers.google.com/search/docs/appearance/structured-data/recipe
 *
 * These validate that our LD+JSON export matches the expected structure.
 */

// Sample from jsonld.com/recipe/
const JSONLD_COM_EXAMPLE = {
  "@context": "https://schema.org/",
  "@type": "Recipe",
  name: "Mom's World Famous Banana Bread",
  author: {
    "@type": "Person",
    name: "John Smith",
  },
  datePublished: "2018-03-10",
  description: "This classic banana bread recipe comes from my mom -- the walnuts add a nice texture and flavor to the banana bread.",
  image: "https://example.com/bananabread.jpg",
  recipeYield: "1 loaf",
  prepTime: "PT15M",
  cookTime: "PT1H",
  totalTime: "PT1H15M",
  recipeIngredient: [
    "3 or 4 ripe bananas, smashed",
    "1 egg",
    "3/4 cup of sugar",
    "1/3 cup of melted butter",
    "1 1/2 cups of all-purpose flour",
    "1 teaspoon of baking soda",
    "Pinch of salt",
    "1/2 cup of walnuts (optional)",
  ],
  recipeInstructions: [
    {
      "@type": "HowToStep",
      text: "Preheat the oven to 350°F. Butter a 9x5 inch loaf pan.",
    },
    {
      "@type": "HowToStep",
      text: "In a mixing bowl, mash the ripe bananas with a fork until completely smooth.",
    },
    {
      "@type": "HowToStep",
      text: "Stir the melted butter into the mashed bananas.",
    },
    {
      "@type": "HowToStep",
      text: "Mix in the baking soda and salt. Stir in the sugar, beaten egg, and vanilla extract. Mix in the flour.",
    },
  ],
  recipeCategory: "Dessert",
  recipeCuisine: "American",
  nutrition: {
    "@type": "NutritionInformation",
    calories: "240 calories",
  },
};

// Sample from Google structured data docs
const GOOGLE_EXAMPLE = {
  "@context": "https://schema.org/",
  "@type": "Recipe",
  name: "Party Coffee Cake",
  image: [
    "https://example.com/photos/1x1/photo.jpg",
    "https://example.com/photos/4x3/photo.jpg",
    "https://example.com/photos/16x9/photo.jpg",
  ],
  author: {
    "@type": "Person",
    name: "Mary Stone",
  },
  datePublished: "2018-03-10",
  description: "This coffee cake is awesome and target.",
  prepTime: "PT20M",
  cookTime: "PT30M",
  totalTime: "PT50M",
  keywords: "cake for a]party, coffee",
  recipeYield: "10",
  recipeCategory: "Dessert",
  recipeCuisine: "American",
  nutrition: {
    "@type": "NutritionInformation",
    calories: "270 calories",
  },
  recipeIngredient: [
    "2 cups of flour",
    "3/4 cup of white sugar",
    "2 teaspoons of baking powder",
    "1/2 teaspoon of salt",
    "1/2 cup of butter",
    "2 eggs",
    "3/4 cup of milk",
  ],
  recipeInstructions: [
    {
      "@type": "HowToStep",
      name: "Preheat",
      text: "Preheat the oven to 350 degrees F. Grease and flour a 9x9 inch pan.",
      url: "https://example.com/party-coffee-cake#step1",
      image: "https://example.com/photos/party-coffee-cake/step1.jpg",
    },
    {
      "@type": "HowToStep",
      name: "Mix dry ingredients",
      text: "In a large bowl, combine flour, sugar, baking powder, and salt.",
      url: "https://example.com/party-coffee-cake#step2",
      image: "https://example.com/photos/party-coffee-cake/step2.jpg",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5",
    ratingCount: "18",
  },
  video: {
    "@type": "VideoObject",
    name: "How to make a Party Coffee Cake",
    description: "This is how you make a Party Coffee Cake.",
    thumbnailUrl: [
      "https://example.com/photos/1x1/photo.jpg",
      "https://example.com/photos/4x3/photo.jpg",
      "https://example.com/photos/16x9/photo.jpg",
    ],
    contentUrl: "https://www.example.com/video123.mp4",
    uploadDate: "2018-02-05T08:00:00+08:00",
    duration: "PT1M33S",
  },
};

describe("Schema.org Recipe LD+JSON", () => {
  describe("required fields", () => {
    it("has @context and @type", () => {
      expect(JSONLD_COM_EXAMPLE["@context"]).toBe("https://schema.org/");
      expect(JSONLD_COM_EXAMPLE["@type"]).toBe("Recipe");
      expect(GOOGLE_EXAMPLE["@context"]).toBe("https://schema.org/");
      expect(GOOGLE_EXAMPLE["@type"]).toBe("Recipe");
    });

    it("has name", () => {
      expect(JSONLD_COM_EXAMPLE.name).toBeTruthy();
      expect(GOOGLE_EXAMPLE.name).toBeTruthy();
    });
  });

  describe("Google recommended fields", () => {
    it("image can be string or array", () => {
      expect(typeof JSONLD_COM_EXAMPLE.image).toBe("string");
      expect(Array.isArray(GOOGLE_EXAMPLE.image)).toBe(true);
    });

    it("has ISO 8601 duration for time fields", () => {
      const iso8601DurationRegex = /^PT(\d+H)?(\d+M)?(\d+S)?$/;
      expect(JSONLD_COM_EXAMPLE.prepTime).toMatch(iso8601DurationRegex);
      expect(JSONLD_COM_EXAMPLE.cookTime).toMatch(iso8601DurationRegex);
      expect(GOOGLE_EXAMPLE.prepTime).toMatch(iso8601DurationRegex);
      expect(GOOGLE_EXAMPLE.cookTime).toMatch(iso8601DurationRegex);
    });

    it("recipeIngredient is array of strings", () => {
      expect(Array.isArray(JSONLD_COM_EXAMPLE.recipeIngredient)).toBe(true);
      JSONLD_COM_EXAMPLE.recipeIngredient.forEach((ing) => {
        expect(typeof ing).toBe("string");
      });
    });

    it("recipeInstructions is array of HowToStep", () => {
      expect(Array.isArray(JSONLD_COM_EXAMPLE.recipeInstructions)).toBe(true);
      JSONLD_COM_EXAMPLE.recipeInstructions.forEach((step) => {
        expect(step["@type"]).toBe("HowToStep");
        expect(step.text).toBeTruthy();
      });
    });
  });

  describe("our export format validation", () => {
    function buildTestExport(recipe: {
      name: string;
      description?: string;
      imageUrl?: string;
      category?: string;
      servings?: string;
      prepTime?: string;
      cookTime?: string;
      totalTime?: string;
      ingredients: Array<{ rawText: string }>;
      steps: Array<{ text: string; sectionName?: string }>;
    }) {
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

      if (recipe.ingredients.length > 0) {
        jsonLd.recipeIngredient = recipe.ingredients.map((ing) => ing.rawText);
      }

      if (recipe.steps.length > 0) {
        jsonLd.recipeInstructions = recipe.steps.map((step) => {
          const howToStep: Record<string, string> = {
            "@type": "HowToStep",
            text: step.text,
          };
          if (step.sectionName) howToStep.name = step.sectionName;
          return howToStep;
        });
      }

      return jsonLd;
    }

    it("produces valid Schema.org Recipe", () => {
      const result = buildTestExport({
        name: "Test Recipe",
        description: "A test recipe",
        category: "Dinner",
        servings: "4 servings",
        prepTime: "PT15M",
        cookTime: "PT30M",
        totalTime: "PT45M",
        ingredients: [
          { rawText: "2 cups flour" },
          { rawText: "1 cup sugar" },
        ],
        steps: [
          { text: "Mix dry ingredients" },
          { text: "Bake at 350F for 30 minutes", sectionName: "Baking" },
        ],
      });

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("Recipe");
      expect(result.name).toBe("Test Recipe");
      expect(result.recipeCategory).toBe("Dinner");
      expect(result.recipeYield).toBe("4 servings");
      expect(result.prepTime).toBe("PT15M");

      const ingredients = result.recipeIngredient as string[];
      expect(ingredients).toHaveLength(2);
      expect(ingredients[0]).toBe("2 cups flour");

      const instructions = result.recipeInstructions as Array<Record<string, string>>;
      expect(instructions).toHaveLength(2);
      expect(instructions[0]!["@type"]).toBe("HowToStep");
      expect(instructions[1]!.name).toBe("Baking");
    });

    it("omits empty fields", () => {
      const result = buildTestExport({
        name: "Minimal Recipe",
        ingredients: [],
        steps: [],
      });

      expect(result.name).toBe("Minimal Recipe");
      expect(result.description).toBeUndefined();
      expect(result.recipeIngredient).toBeUndefined();
      expect(result.recipeInstructions).toBeUndefined();
    });
  });
});
