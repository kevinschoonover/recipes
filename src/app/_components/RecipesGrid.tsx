"use client";

import { type Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useContext, useEffect } from "react";
import { BeakerIcon } from "@heroicons/react/20/solid";

import {
  SelectedRecipeContext,
  ParseRecipes,
} from "~/app/_providers/SelectedRecipeProvider";
import { api } from "~/trpc/react";
import { SearchContext } from "~/app/_providers/SearchProvider";
import { nanoid } from "nanoid";

interface RecipesGridProps {
  session: Session | null;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function RecipesGrid({ session }: RecipesGridProps) {
  const {
    selectedRecipe,
    setSelectedRecipe,
    setRecipes,
    recipes,
    setEditMode,
  } = useContext(SelectedRecipeContext);
  const { searchText } = useContext(SearchContext);

  const { status, isError, data, error } = api.recipe.all.useQuery(undefined, {
    enabled: session !== null,
  });

  if (isError) {
    console.error(error);
  }

  useEffect(() => {
    if (status === "success") {
      setRecipes(ParseRecipes(data));
    }
  }, [status, data]);

  const filteredRecipes =
    searchText === ""
      ? recipes
      : recipes.filter((recipe) =>
          recipe.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(searchText.toLowerCase().replace(/\s+/g, "")),
        );

  let gridBody;
  if (!session) {
    gridBody = (
      <div className="text-center">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Please Authenticate to see Your Recipes
        </h3>
        <div className="mt-4 flex items-center justify-center">
          <div>
            <button
              type="button"
              className="ml-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              onClick={() => signIn()}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  } else if (searchText !== "" && filteredRecipes.length === 0) {
    gridBody = <p>no recipes match provided search term</p>;
  } else {
    gridBody = (
      <>
        <button
          type="button"
          className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => {
            setSelectedRecipe({
              slug: nanoid(),
              importedFrom: null,
              image: "https://picsum.photos/200",
              name: "Test",
              category: undefined,
              document: { "@type": "Recipe" },
            });
            setEditMode(true);
          }}
        >
          <BeakerIcon className="mx-auto h-6 w-6 text-gray-400" />
          <span className="mt-2 block text-sm font-semibold text-gray-900">
            Create a new recipe
          </span>
        </button>
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.slug}
            className={classNames(
              selectedRecipe?.slug === recipe.slug ? "border-indigo-500" : "",
              "relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400",
            )}
          >
            <div className="flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full"
                src={recipe.image}
                alt=""
              />
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
                  setEditMode(false);
                }}
              >
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  {recipe.name}
                </p>
                {recipe.category && (
                  <p className="truncate text-sm text-gray-500">
                    {recipe.category}
                  </p>
                )}
              </a>
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">{gridBody}</div>
  );
}
