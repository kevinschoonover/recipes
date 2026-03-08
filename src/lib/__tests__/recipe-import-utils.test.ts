import { describe, it, expect } from "vitest";
import {
  extractLdJsonFromHtml,
  ldJsonToRecipeImport,
} from "../recipe-import-utils";

describe("extractLdJsonFromHtml", () => {
  it("extracts a direct Recipe LD+JSON", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Recipe","name":"Test"}
        </script>
      </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!["@type"]).toBe("Recipe");
    expect(result!.name).toBe("Test");
  });

  it("extracts Recipe from @graph array (WordPress/Yoast)", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@graph":[
            {"@type":"WebPage","name":"My Site"},
            {"@type":"Recipe","name":"Banana Bread","recipeIngredient":["2 bananas"]}
          ]}
        </script>
      </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!["@type"]).toBe("Recipe");
    expect(result!.name).toBe("Banana Bread");
  });

  it("extracts Recipe from array of objects", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          [{"@type":"WebSite","name":"Site"},{"@type":"Recipe","name":"Cake"}]
        </script>
      </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Cake");
  });

  it("extracts Recipe with array @type (Allrecipes style)", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":["Recipe","NewsArticle"],"name":"Parmesan Potatoes"}
        </script>
      </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Parmesan Potatoes");
  });

  it("skips non-Recipe LD+JSON and finds Recipe in later script tag", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":"WebSite","name":"My Blog"}
        </script>
        <script type="application/ld+json">
          {"@context":"https://schema.org","@type":"Recipe","name":"Soup"}
        </script>
      </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Soup");
  });

  it("returns null when no LD+JSON is present", () => {
    const html = `<html><head></head><body><h1>No recipes here</h1></body></html>`;
    expect(extractLdJsonFromHtml(html)).toBeNull();
  });

  it("returns null when LD+JSON has no Recipe", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":"Article","name":"Blog Post"}
        </script>
      </head><body></body></html>`;
    expect(extractLdJsonFromHtml(html)).toBeNull();
  });

  it("handles malformed JSON gracefully", () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          {not valid json}
        </script>
        <script type="application/ld+json">
          {"@type":"Recipe","name":"Fallback"}
        </script>
      </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Fallback");
  });

  it("extracts Tasty.co Recipe from page with multiple script tags", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@context":"http://schema.org","@type":"Recipe","name":"One-Pot Chicken And Mushroom Pasta Recipe by Tasty","recipeIngredient":["3 tablespoons olive oil"],"recipeInstructions":[{"@type":"HowToStep","text":"Heat oil."}]}</script>
      <script type="application/ld+json">{"@context":"http://schema.org","@type":"VideoObject","name":"Video"}</script>
      <script type="application/ld+json">[{"@context":"http://schema.org","@type":"BreadcrumbList"}]</script>
    </head><body></body></html>`;

    const result = extractLdJsonFromHtml(html);
    expect(result).not.toBeNull();
    expect(result!["@type"]).toBe("Recipe");
    expect(result!.name).toBe(
      "One-Pot Chicken And Mushroom Pasta Recipe by Tasty",
    );
  });
});

describe("ldJsonToRecipeImport", () => {
  it("converts jsonld.com example", () => {
    const ldJson = {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      name: "Mom's World Famous Banana Bread",
      author: { "@type": "Person", name: "John Smith" },
      description: "Classic banana bread recipe",
      image: "https://example.com/bread.jpg",
      recipeYield: "1 loaf",
      prepTime: "PT15M",
      cookTime: "PT1H",
      totalTime: "PT1H15M",
      recipeCategory: "Dessert",
      recipeCuisine: "American",
      nutrition: { "@type": "NutritionInformation", calories: "240 calories" },
      recipeIngredient: ["3 bananas", "1 egg", "3/4 cup sugar"],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Preheat oven to 350°F." },
        { "@type": "HowToStep", text: "Mash bananas." },
      ],
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("Mom's World Famous Banana Bread");
    expect(result.description).toBe("Classic banana bread recipe");
    expect(result.category).toBe("Dessert");
    expect(result.servings).toBe("1 loaf");
    expect(result.prepTime).toBe("PT15M");
    expect(result.cookTime).toBe("PT1H");
    expect(result.totalTime).toBe("PT1H15M");
    expect(result.imageUrl).toBe("https://example.com/bread.jpg");
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[0]!.rawText).toBe("3 bananas");
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]!.text).toBe("Preheat oven to 350°F.");

    expect(result.document["@context"]).toBe("https://schema.org");
    expect(result.document["@type"]).toBe("Recipe");
    expect(result.document.author?.name).toBe("John Smith");
    expect(result.document.nutrition?.calories).toBe("240 calories");
    expect(result.document.recipeCuisine).toBe("American");
    expect(result.document.recipeIngredient).toHaveLength(3);
    expect(result.document.recipeInstructions).toHaveLength(2);
  });

  it("converts Google example with image array", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Party Coffee Cake",
      image: ["https://example.com/1x1.jpg", "https://example.com/4x3.jpg"],
      recipeYield: "10",
      recipeIngredient: ["2 cups flour", "3/4 cup sugar"],
      recipeInstructions: [
        { "@type": "HowToStep", name: "Preheat", text: "Preheat to 350°F." },
        { "@type": "HowToStep", name: "Mix", text: "Combine ingredients." },
      ],
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.imageUrl).toBe("https://example.com/1x1.jpg");
    expect(result.steps[0]!.sectionName).toBe("Preheat");
    expect(result.document.image).toEqual(["https://example.com/1x1.jpg"]);
  });

  it("handles HowToSection with nested steps (Downshiftology style)", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Multi-Section Recipe",
      recipeIngredient: ["flour", "sugar"],
      recipeInstructions: [
        {
          "@type": "HowToSection",
          name: "Prep",
          itemListElement: [
            { "@type": "HowToStep", text: "Gather ingredients." },
            { "@type": "HowToStep", text: "Preheat oven." },
          ],
        },
        {
          "@type": "HowToSection",
          name: "Bake",
          itemListElement: [
            { "@type": "HowToStep", text: "Mix and pour." },
          ],
        },
      ],
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]!.sectionName).toBe("Prep");
    expect(result.steps[0]!.text).toBe("Gather ingredients.");
    expect(result.steps[1]!.sectionName).toBe("Prep");
    expect(result.steps[2]!.sectionName).toBe("Bake");
  });

  it("handles string instructions", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Simple Recipe",
      recipeIngredient: ["salt"],
      recipeInstructions: ["Step one.", "Step two."],
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]!.text).toBe("Step one.");
    expect(result.steps[1]!.text).toBe("Step two.");
  });

  it("handles ImageObject", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Image Test",
      image: { "@type": "ImageObject", url: "https://example.com/img.jpg" },
      recipeIngredient: [],
      recipeInstructions: [],
    };

    const result = ldJsonToRecipeImport(ldJson);
    expect(result.imageUrl).toBe("https://example.com/img.jpg");
  });

  it("handles missing optional fields", () => {
    const ldJson = { "@type": "Recipe", name: "Minimal" };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("Minimal");
    expect(result.description).toBeUndefined();
    expect(result.category).toBeUndefined();
    expect(result.imageUrl).toBeUndefined();
    expect(result.ingredients).toHaveLength(0);
    expect(result.steps).toHaveLength(0);
  });

  it("handles Organization author", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Org Recipe",
      author: { "@type": "Organization", name: "Test Kitchen" },
      recipeIngredient: [],
      recipeInstructions: [],
    };

    const result = ldJsonToRecipeImport(ldJson);
    expect(result.document.author).toEqual({
      "@type": "Organization",
      name: "Test Kitchen",
    });
  });

  // ── Real-world site tests ──────────────────────────────────────────────

  it("converts Tasty.co one-pot chicken and mushroom pasta", () => {
    const ldJson = {
      "@context": "http://schema.org",
      "@type": "Recipe",
      name: "One-Pot Chicken And Mushroom Pasta Recipe by Tasty",
      description:
        "This chicken and mushroom dish with tender pasta in a creamy, savory sauce will leave everyone clamoring for seconds.",
      image:
        "https://img.buzzfeed.com/video-api-prod/assets/b10b232738974df18f43119feb35c45d/thumb1.jpg?resize=1200:*",
      author: [{ "@type": "Person", name: "Jody Duits" }],
      nutrition: {
        "@type": "NutritionInformation",
        calories: "680 calories",
        carbohydrateContent: "51 grams",
        fatContent: "35 grams",
        fiberContent: "3 grams",
        proteinContent: "54 grams",
        sugarContent: "7 grams",
      },
      recipeIngredient: [
        "3 tablespoons olive oil",
        "1 ½ lb chicken breast, cubed",
        "½ yellow onion, diced",
        "salt, to taste",
        "pepper, to taste",
        "2 cups cremini mushroom",
        "3 cloves garlic, minced",
        "1 teaspoon dried thyme",
        "2 teaspoons paprika",
        "4 cups chicken broth",
        "1 cup heavy cream",
        "1 lb farfalle pasta",
        "5 oz spinach",
        "1 cup parmesan cheese",
      ],
      recipeYield: "4 servings",
      recipeInstructions: [
        { "@type": "HowToStep", text: "Heat oil." },
        { "@type": "HowToStep", text: "Add onion." },
        { "@type": "HowToStep", text: "Add mushrooms." },
        { "@type": "HowToStep", text: "Add broth and cream." },
        { "@type": "HowToStep", text: "Cook pasta." },
        { "@type": "HowToStep", text: "Add spinach." },
        { "@type": "HowToStep", text: "Add parmesan." },
        { "@type": "HowToStep", text: "Serve." },
        { "@type": "HowToStep", text: "Enjoy!" },
      ],
      recipeCategory: "Meal",
      recipeCuisine: "Fusion",
      cookTime: "PT25M",
      prepTime: "PT15M",
      totalTime: "PT40M",
      keywords: "chicken, pasta, one-pot",
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe(
      "One-Pot Chicken And Mushroom Pasta Recipe by Tasty",
    );
    expect(result.category).toBe("Meal");
    expect(result.servings).toBe("4 servings");
    expect(result.prepTime).toBe("PT15M");
    expect(result.cookTime).toBe("PT25M");
    expect(result.totalTime).toBe("PT40M");
    expect(result.ingredients).toHaveLength(14);
    expect(result.steps).toHaveLength(9);
    expect(result.document.author).toEqual({
      "@type": "Person",
      name: "Jody Duits",
    });
    expect(result.document.nutrition?.calories).toBe("680 calories");
    expect(result.document.nutrition?.proteinContent).toBe("54 grams");
    expect(result.document.recipeCuisine).toBe("Fusion");
  });

  it("converts Mediterranean Dish skillet mushroom chicken (array recipeCategory/recipeYield)", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "20-Minute Skillet Mushroom Chicken",
      description: "Easy one-pan chicken dinner ready in 20 minutes!",
      image: [
        "https://www.themediterraneandish.com/wp-content/uploads/2020/02/chicken-and-mushroom-recipe.jpg",
      ],
      recipeYield: ["5", "5 people (up to)"],
      prepTime: "PT10M",
      cookTime: "PT10M",
      recipeIngredient: [
        "1 1/2 lb boneless skinless chicken breasts",
        "Kosher salt and black pepper",
        "1 teaspoon oregano",
        "1 teaspoon paprika",
        "1 teaspoon coriander",
        "2 tablespoons extra virgin olive oil",
        "1 tablespoon ghee or unsalted butter",
        "12 ounce fresh large mushrooms, sliced",
        "1/2 cup chicken broth",
        "3 green onions, chopped",
        "2 garlic cloves, minced",
        "kosher salt and black pepper",
        "Parsley for garnish",
      ],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Heat oven to 200 degrees F." },
        { "@type": "HowToStep", text: "Cut chicken into cutlets." },
        { "@type": "HowToStep", text: "Cook chicken in olive oil." },
        { "@type": "HowToStep", text: "Sautee mushrooms." },
        { "@type": "HowToStep", text: "Add chicken back and serve." },
      ],
      recipeCategory: ["Entree"],
      recipeCuisine: ["Italian"],
      keywords: "chicken and mushroom recipe",
      nutrition: {
        "@type": "NutritionInformation",
        calories: "253.6 kcal",
        proteinContent: "31.1 g",
        fatContent: "12.3 g",
        carbohydrateContent: "4.5 g",
        servingSize: "1 serving",
      },
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("20-Minute Skillet Mushroom Chicken");
    // Array values get first element
    expect(result.servings).toBe("5");
    expect(result.category).toBe("Entree");
    expect(result.document.recipeCuisine).toBe("Italian");
    expect(result.ingredients).toHaveLength(13);
    expect(result.steps).toHaveLength(5);
    expect(result.document.nutrition?.calories).toBe("253.6 kcal");
    expect(result.document.nutrition?.servingSize).toBe("1 serving");
  });

  it("converts Mediterranean Dish creamy chicken pasta (multiple images, array cuisine)", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Creamy Chicken Pasta",
      description: "You don't need heavy cream for a silky pasta sauce!",
      image: [
        "https://www.themediterraneandish.com/wp-content/uploads/2025/07/TMD-Chicken-Pasta-Leads-01.jpg",
        "https://www.themediterraneandish.com/wp-content/uploads/2025/07/TMD-Chicken-Pasta-Leads-01-500x500.jpg",
      ],
      recipeYield: ["5", "5 people (up to)"],
      prepTime: "PT5M",
      cookTime: "PT10M",
      totalTime: "PT15M",
      recipeIngredient: [
        "8 ounces penne pasta",
        "1 pound boneless skinless chicken breast",
        "1 teaspoon ground black pepper",
        "2 teaspoons dried oregano",
        "Extra virgin olive oil",
        "3 large garlic cloves, minced",
        "1/4 cup chopped sun-dried tomatoes",
        "1 cup cherry tomatoes",
        "1 15-ounce can artichoke hearts, drained",
        "1 cup whole milk",
        "2 tablespoons all purpose flour",
        "1 cup finely grated Parmesan",
        "2 packed cups baby spinach",
        "1/4 cup chopped fresh parsley",
      ],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Cook the pasta." },
        { "@type": "HowToStep", text: "Prep the chicken." },
        { "@type": "HowToStep", text: "Sear the chicken." },
        { "@type": "HowToStep", text: "Flavor the chicken." },
        { "@type": "HowToStep", text: "Make the creamy pasta sauce." },
        { "@type": "HowToStep", text: "Add pasta and serve." },
      ],
      recipeCategory: ["Entree"],
      recipeCuisine: ["American", "Italian"],
      nutrition: {
        "@type": "NutritionInformation",
        calories: "518.9 kcal",
        proteinContent: "35.6 g",
        fatContent: "18.2 g",
        carbohydrateContent: "51.4 g",
      },
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("Creamy Chicken Pasta");
    expect(result.imageUrl).toBe(
      "https://www.themediterraneandish.com/wp-content/uploads/2025/07/TMD-Chicken-Pasta-Leads-01.jpg",
    );
    expect(result.servings).toBe("5");
    expect(result.category).toBe("Entree");
    expect(result.document.recipeCuisine).toBe("American");
    expect(result.ingredients).toHaveLength(14);
    expect(result.steps).toHaveLength(6);
    expect(result.totalTime).toBe("PT15M");
  });

  it("converts Downshiftology one-pan chicken and rice (HowToSection)", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Best Chicken and Rice (One Pan)",
      author: { "@type": "Person", name: "Lisa Bryan" },
      description: "Chicken and rice with bright Mediterranean flavors.",
      image: [
        "https://i2.wp.com/www.downshiftology.com/wp-content/uploads/2020/09/Chicken-and-Rice-9.jpg",
      ],
      recipeYield: ["5", "5 servings"],
      prepTime: "PT20M",
      cookTime: "PT60M",
      totalTime: "PT110M",
      recipeIngredient: [
        "5 chicken thighs",
        "2 tablespoons olive oil",
        "2 lemons",
        "2 teaspoons Dijon Mustard",
        "3 garlic cloves",
        "1 teaspoon dried oregano",
        "1 teaspoon dried thyme",
        "1/2 tsp salt",
        "1/4 tsp black pepper",
        "1 tablespoon olive oil",
        "1 yellow onion, diced",
        "2 cups baby spinach",
        "2 garlic cloves, minced",
        "1 teaspoons dried oregano",
        "1 cup long grain white rice",
        "2 cups chicken stock",
        "1/2 teaspoon salt",
        "1/4 teaspoon black pepper",
        "chopped parsley",
        "lemon zest or slices",
      ],
      recipeInstructions: [
        {
          "@type": "HowToSection",
          name: "Marinate the Chicken",
          itemListElement: [
            { "@type": "HowToStep", text: "Add marinade ingredients to a bowl." },
            { "@type": "HowToStep", text: "Marinate chicken in fridge." },
          ],
        },
        {
          "@type": "HowToSection",
          name: "Cook the Chicken and Rice",
          itemListElement: [
            { "@type": "HowToStep", text: "Preheat oven to 350F." },
            { "@type": "HowToStep", text: "Sear chicken skin-side down." },
            { "@type": "HowToStep", text: "Flip and cook 5 more minutes." },
            { "@type": "HowToStep", text: "Remove browned bits from pan." },
            { "@type": "HowToStep", text: "Saute onions." },
            { "@type": "HowToStep", text: "Add spinach and seasonings." },
            { "@type": "HowToStep", text: "Add rice to skillet." },
            { "@type": "HowToStep", text: "Pour chicken stock." },
            { "@type": "HowToStep", text: "Bake with chicken on top." },
            { "@type": "HowToStep", text: "Rest and fluff rice." },
            { "@type": "HowToStep", text: "Top with parsley and lemon." },
          ],
        },
      ],
      recipeCategory: ["Main Course"],
      recipeCuisine: ["Mediterranean"],
      nutrition: {
        "@type": "NutritionInformation",
        calories: "423 kcal",
        proteinContent: "23 g",
        fatContent: "29 g",
        carbohydrateContent: "19 g",
        servingSize: "1 serving",
      },
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("Best Chicken and Rice (One Pan)");
    expect(result.document.author?.name).toBe("Lisa Bryan");
    expect(result.servings).toBe("5");
    expect(result.category).toBe("Main Course");
    expect(result.document.recipeCuisine).toBe("Mediterranean");
    expect(result.ingredients).toHaveLength(20);
    // 2 marinate steps + 11 cook steps = 13 total (flattened from HowToSections)
    expect(result.steps).toHaveLength(13);
    expect(result.steps[0]!.sectionName).toBe("Marinate the Chicken");
    expect(result.steps[1]!.sectionName).toBe("Marinate the Chicken");
    expect(result.steps[2]!.sectionName).toBe("Cook the Chicken and Rice");
    expect(result.steps[12]!.sectionName).toBe("Cook the Chicken and Rice");
    expect(result.totalTime).toBe("PT110M");
    expect(result.document.nutrition?.calories).toBe("423 kcal");
  });

  it("converts Love and Lemons shakshuka (array author with rich Person objects)", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Shakshuka Recipe",
      author: [
        { "@type": "Person", name: "Jeanine Donofrio", "@id": "some-id" },
        { "@type": "Person", name: "Phoebe Moore", "@id": "other-id" },
      ],
      description: "Shakshuka is a classic North African and Middle Eastern breakfast dish.",
      image: [
        "https://cdn.loveandlemons.com/wp-content/uploads/2026/01/shakshuka-500x500.jpg",
        "https://cdn.loveandlemons.com/wp-content/uploads/2026/01/shakshuka.jpg",
      ],
      recipeYield: ["4"],
      prepTime: "PT10M",
      cookTime: "PT25M",
      totalTime: "PT35M",
      recipeIngredient: [
        "2 tablespoons extra-virgin olive oil",
        "1 small white onion, diced",
        "1 red bell pepper, diced",
        "3 garlic cloves, minced",
        "1 teaspoon ground cumin",
        "½ teaspoon paprika",
        "Pinch cayenne pepper",
        "1 (28-ounce) can fire-roasted crushed tomatoes",
        "½ teaspoon sea salt",
        "Freshly ground black pepper",
        "6 large eggs",
        "¼ cup fresh parsley or cilantro leaves",
        "¼ cup crumbled feta cheese",
        "Pita, for serving",
      ],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Heat olive oil and cook onion and peppers." },
        { "@type": "HowToStep", text: "Add tomatoes and simmer 15 minutes." },
        { "@type": "HowToStep", text: "Make wells and crack eggs. Cook until set." },
      ],
      recipeCategory: ["Breakfast"],
      recipeCuisine: ["Middle Eastern"],
      nutrition: {
        "@type": "NutritionInformation",
        calories: "207 kcal",
        proteinContent: "11 g",
        fatContent: "16 g",
        carbohydrateContent: "7 g",
      },
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("Shakshuka Recipe");
    // Takes first author from array
    expect(result.document.author?.name).toBe("Jeanine Donofrio");
    expect(result.servings).toBe("4");
    expect(result.category).toBe("Breakfast");
    expect(result.document.recipeCuisine).toBe("Middle Eastern");
    expect(result.ingredients).toHaveLength(14);
    expect(result.steps).toHaveLength(3);
    expect(result.totalTime).toBe("PT35M");
  });

  it("converts Allrecipes parmesan potatoes (array @type, ImageObject, array recipeCategory)", () => {
    const ldJson = {
      "@context": "http://schema.org",
      "@type": ["Recipe", "NewsArticle"],
      name: "Oven Roasted Parmesan Potatoes",
      description: "A Parmesan roasted potatoes recipe — coated in seasoning.",
      author: [{ "@type": "Person", name: "bellepepper" }],
      image: {
        "@type": "ImageObject",
        url: "https://www.allrecipes.com/thmb/w2F2tUTqPJExnxOnJ-f-vexwxPM=/1500x0/photo.jpg",
        height: 1125,
        width: 1500,
      },
      cookTime: "PT30M",
      prepTime: "PT15M",
      totalTime: "PT45M",
      recipeYield: "6",
      recipeCategory: ["Dinner", "Side Dish"],
      recipeCuisine: ["American"],
      recipeIngredient: [
        "cooking spray",
        "1 teaspoon vegetable oil",
        "2 tablespoons freshly grated Parmesan cheese",
        "0.5 teaspoon salt",
        "0.5 teaspoon garlic powder",
        "0.5 teaspoon paprika",
        "0.25 teaspoon ground black pepper",
        "2 pounds red potatoes, halved",
        "1 tablespoon vegetable oil",
        "0.25 cup sour cream",
      ],
      recipeInstructions: [
        { "@type": "HowToStep", text: "Preheat the oven to 400 degrees F." },
        { "@type": "HowToStep", text: "Mix Parmesan, salt, garlic powder, paprika, and pepper." },
        { "@type": "HowToStep", text: "Blot dry the cut-side of potatoes." },
        { "@type": "HowToStep", text: "Drizzle potatoes with oil and coat with seasoning." },
        { "@type": "HowToStep", text: "Arrange potatoes cut-side down." },
        { "@type": "HowToStep", text: "Bake 15-20 min, flip, bake 15-20 more." },
        { "@type": "HowToStep", text: "Serve hot and enjoy!" },
      ],
      nutrition: {
        "@type": "NutritionInformation",
        calories: "162 kcal",
        carbohydrateContent: "25 g",
        proteinContent: "4 g",
        fatContent: "6 g",
        saturatedFatContent: "2 g",
        cholesterolContent: "6 mg",
        sodiumContent: "234 mg",
        fiberContent: "3 g",
        sugarContent: "2 g",
      },
    };

    const result = ldJsonToRecipeImport(ldJson);

    expect(result.name).toBe("Oven Roasted Parmesan Potatoes");
    // ImageObject → extracts url
    expect(result.imageUrl).toBe(
      "https://www.allrecipes.com/thmb/w2F2tUTqPJExnxOnJ-f-vexwxPM=/1500x0/photo.jpg",
    );
    expect(result.document.author?.name).toBe("bellepepper");
    expect(result.servings).toBe("6");
    // Array recipeCategory → takes first
    expect(result.category).toBe("Dinner");
    expect(result.document.recipeCuisine).toBe("American");
    expect(result.ingredients).toHaveLength(10);
    expect(result.steps).toHaveLength(7);
    expect(result.cookTime).toBe("PT30M");
    expect(result.prepTime).toBe("PT15M");
    expect(result.totalTime).toBe("PT45M");
    expect(result.document.nutrition?.calories).toBe("162 kcal");
    expect(result.document.nutrition?.cholesterolContent).toBe("6 mg");
    expect(result.document.nutrition?.saturatedFatContent).toBe("2 g");
  });

  it("handles author with @id reference but no name (WordPress WPRM)", () => {
    const ldJson = {
      "@type": "Recipe",
      name: "Test Recipe",
      author: {
        "@id": "https://example.com/#/schema/person/abc123",
      },
      recipeIngredient: ["salt"],
      recipeInstructions: [{ "@type": "HowToStep", text: "Cook." }],
    };

    const result = ldJsonToRecipeImport(ldJson);

    // No name available, author should not be set
    expect(result.document.author).toBeUndefined();
  });
});
