import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { getRecipes, getCategories } from "#/server/functions/recipes";
import RecipeCard from "#/components/RecipeCard";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (search: Record<string, unknown>) => ({
    search: (search.search as string) ?? "",
    category: (search.category as string) ?? "",
  }),
});

function Home() {
  const navigate = useNavigate({ from: "/" });
  const { search: searchParam, category: categoryParam } = Route.useSearch();
  const { data: session } = authClient.useSession();
  const [searchInput, setSearchInput] = useState(searchParam);

  const recipesQuery = useQuery({
    queryKey: ["recipes", searchParam, categoryParam],
    queryFn: () =>
      getRecipes({ data: { search: searchParam, category: categoryParam } }),
    enabled: !!session?.user,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    enabled: !!session?.user,
  });

  function updateSearch(value: string) {
    setSearchInput(value);
    navigate({
      search: (prev) => ({ ...prev, search: value }),
      replace: true,
    });
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-1 text-2xl font-bold text-white">
          R
        </div>
        <h1 className="mt-6 text-3xl font-bold text-secondary-1">Recipes</h1>
        <p className="mt-2 text-secondary-2">
          Your personal recipe collection. Sign in to get started.
        </p>
      </div>
    );
  }

  const recipes = recipesQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="animate-rise-in">
        {/* Search bar */}
        <div className="sticky top-14 z-30 -mx-4 bg-surface-1/95 px-4 pb-3 pt-2 backdrop-blur-sm lg:top-0">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-3"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search recipes…"
              className="w-full rounded-xl border border-border-1 bg-surface-2 py-3 pl-10 pr-4 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
            />
          </div>

          {/* Category pills */}
          {categories.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() =>
                  navigate({
                    search: (prev) => ({ ...prev, category: "" }),
                    replace: true,
                  })
                }
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  !categoryParam
                    ? "bg-primary-1 text-white"
                    : "bg-surface-2 text-secondary-2 active:bg-primary-4"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        category: cat === categoryParam ? "" : cat,
                      }),
                      replace: true,
                    })
                  }
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    categoryParam === cat
                      ? "bg-primary-1 text-white"
                      : "bg-surface-2 text-secondary-2 active:bg-primary-4"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recipe list */}
        {recipesQuery.isLoading ? (
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-surface-2"
              />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="mt-12 text-center text-secondary-3">
            <p className="text-lg">No recipes yet</p>
            <p className="mt-1 text-sm">
              Import your first recipe or create one from scratch.
            </p>
          </div>
        ) : (
          <div className="mt-2 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                slug={recipe.slug}
                name={recipe.name}
                description={recipe.description ?? undefined}
                imageUrl={recipe.imageUrl ?? undefined}
                category={recipe.category}
                servings={recipe.servings}
                totalTime={recipe.totalTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate({ to: "/recipes/new" })}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-1 text-white shadow-lg transition-transform active:scale-95 lg:bottom-6 lg:right-6"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
