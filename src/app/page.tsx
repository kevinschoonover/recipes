import Header from "~/app/_components/header";
import SelectedRecipeProvider from "~/app/_providers/SelectedRecipeProvider";
import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";
import RecipesGrid from "~/app/_components/RecipesGrid";
import RecipePanel from "~/app/_components/RecipePanel";
import { StrictMode } from "react";

async function importRecipe(url: string) {
  const session = await getServerAuthSession();

  if (!session?.user)
    throw new Error("user is not authenticated. cannot import recipes");

  await api.recipe.import.mutate;
}

async function getRecipes() {
  const session = await getServerAuthSession();

  if (!session?.user)
    throw new Error("user is not authenticated. cannot get recipes");

  return (await api.recipe.getRecipes.query()).map((recipe) => {
    let imageURL = "https://picsum.photos/100/100";
    let category: string | undefined = undefined;
    const image = recipe.document.thumbnailUrl?.valueOf();
    if (image instanceof Object) {
      // TODO: better checking of type
      imageURL = (image as string[])![0]!;
    } else if (typeof image === "string") {
      imageURL = image;
    }
    const documentCategory = recipe.document.recipeCategory?.valueOf();
    if (typeof documentCategory === "string") {
      category = documentCategory;
    } else if (
      documentCategory instanceof Object &&
      Array.isArray(documentCategory)
    ) {
      category = documentCategory[0] as string;
    }

    const name = recipe.document.name?.toString() ?? "unknown";

    return {
      slug: recipe.slug,
      image: imageURL,
      name: name,
      category: category,
      document: recipe.document,
    };
  });
}

export default async function Page() {
  const session = await getServerAuthSession();

  return (
    <StrictMode>
      <SelectedRecipeProvider>
        <div className="min-h-full">
          <Header session={session} />
          <main className="-mt-24 pb-8">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <h1 className="sr-only">Page title</h1>
              {/* Main 3 column grid */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
                {/* Left column */}
                <div className="grid grid-cols-1 gap-4 lg:col-span-2">
                  <section aria-labelledby="section-1-title">
                    <h2 className="sr-only" id="section-1-title">
                      Your Recipes
                    </h2>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <RecipePanel />
                    </div>
                  </section>
                </div>

                {/* Right column */}
                <div className="grid grid-cols-1 gap-4">
                  <section aria-labelledby="section-2-title">
                    <h2 className="sr-only" id="section-2-title">
                      Recipe Selection Panel
                    </h2>
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                      <div className="p-6">
                        <RecipesGrid recipes={await getRecipes()} />
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </main>
          <footer>
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
              <div className="border-t border-gray-200 py-8 text-center text-sm text-gray-500 sm:text-left">
                <span className="block sm:inline">
                  &copy; 2021 Your Company, Inc.
                </span>{" "}
                <span className="block sm:inline">All rights reserved.</span>
              </div>
            </div>
          </footer>
        </div>
      </SelectedRecipeProvider>
    </StrictMode>
  );
}
