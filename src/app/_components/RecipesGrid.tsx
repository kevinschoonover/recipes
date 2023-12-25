"use client";

import { useContext } from "react";
import {
  type ParsedRecipe,
  SelectedRecipeContext,
} from "~/app/_providers/SelectedRecipeProvider";

export default function RecipesGrid({ recipes }: { recipes: ParsedRecipe[] }) {
  const { selectedRecipe, setSelectedRecipe } = useContext(
    SelectedRecipeContext,
  );

  console.log(recipes);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
      {recipes.map((recipe) => (
        <div
          key={recipe.slug}
          className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
        >
          <div className="flex-shrink-0">
            <img className="h-10 w-10 rounded-full" src={recipe.image} alt="" />
          </div>
          <div className="min-w-0 flex-1">
            <a
              href="#"
              className="focus:outline-none"
              onClick={(e) => {
                e.preventDefault();
                if (selectedRecipe?.slug === recipe.slug) {
                  setSelectedRecipe(undefined);
                } else {
                  setSelectedRecipe(recipe);
                }
              }}
            >
              <span className="absolute inset-0" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-900">{recipe.name}</p>
              {recipe.category && (
                <p className="truncate text-sm text-gray-500">
                  {recipe.category}
                </p>
              )}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
