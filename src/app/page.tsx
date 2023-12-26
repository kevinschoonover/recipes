import { StrictMode } from "react";

import Header from "~/app/_components/header";
import SelectedRecipeProvider from "~/app/_providers/SelectedRecipeProvider";
import SearchProvider from "~/app/_providers/SearchProvider";

import { getServerAuthSession } from "~/server/auth";
import RecipesGrid from "~/app/_components/RecipesGrid";
import RecipePanel from "~/app/_components/RecipePanel";

export default async function Page() {
  const session = await getServerAuthSession();

  return (
    <StrictMode>
      <SelectedRecipeProvider>
        <SearchProvider>
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
                        <RecipePanel session={session} />
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
                          <RecipesGrid session={session} />
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
        </SearchProvider>
      </SelectedRecipeProvider>
    </StrictMode>
  );
}
