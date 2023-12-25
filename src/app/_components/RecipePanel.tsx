"use client";

import { useContext, useState } from "react";

import { Disclosure } from "@headlessui/react";
import {
  MinusIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { type NutritionInformation, type HowToStep } from "schema-dts";

import { SelectedRecipeContext } from "~/app/_providers/SelectedRecipeProvider";
import { api } from "~/trpc/react";
import NutritionLabel from "./NutritionLabel";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function RecipePanel() {
  const [url, setURL] = useState("");
  const { selectedRecipe } = useContext(SelectedRecipeContext);
  const utils = api.useUtils();
  const importRecipe = api.recipe.import.useMutation({
    onSuccess: () => {
      setURL("");
      utils.recipe.getRecipes.invalidate().catch((e) => {
        console.error(`error invalidating getRecipes: ${e}`);
      });
    },
  });

  let recipeBody = (
    <div className="p-6">
      <div className="text-center">
        {" "}
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          No Recipe Selected
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by selecting a recipe or import one.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <div className="min-w-24 col-span-4 flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
            <input
              type="text"
              name="url"
              id="url"
              autoComplete="url"
              className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              onChange={(e) => setURL(e.target.value)}
            />
          </div>
          <div>
            <button
              type="button"
              className="ml-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              disabled={url === "" || importRecipe.isLoading}
              onClick={(e) => {
                e.preventDefault();
                importRecipe.mutate({ url });
              }}
            >
              <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              {importRecipe.isLoading ? "Importing..." : "Import Recipe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (selectedRecipe) {
    const parsedInstructions: HowToStep[] = [];
    const instructions = selectedRecipe.document.recipeInstructions?.valueOf();
    if (instructions instanceof Object && Array.isArray(instructions)) {
      instructions.forEach((instruction) => {
        if ((instruction as HowToStep)["@type"] === "HowToStep") {
          parsedInstructions.push(instruction as HowToStep);
        }
      });
    }

    const parsedIngredients: string[] = [];
    const ingredients = selectedRecipe.document.recipeIngredient?.valueOf();
    if (ingredients instanceof Object && Array.isArray(ingredients)) {
      ingredients.forEach((ingredient) => {
        if (typeof ingredient == "string") {
          parsedIngredients.push(ingredient);
        }
      });
    }

    const recipeSections = [
      {
        name: "Ingredients",
        body:
          parsedIngredients.length > 0 ? (
            <ul>
              {parsedIngredients.map((ingredient) => (
                <li key={ingredient}>{ingredient}</li>
              ))}
            </ul>
          ) : undefined,
      },
      {
        name: "Instructions",
        defaultOpen: true,
        body:
          parsedInstructions.length > 0 ? (
            <ol>
              {parsedInstructions.map((instruction) => (
                <li key={instruction.name?.toString()}>
                  {instruction.text?.toString()}
                </li>
              ))}
            </ol>
          ) : undefined,
      },
      {
        name: "Nutrition Facts",
        body: selectedRecipe.document.nutrition ? (
          <NutritionLabel
            recipeYield="TODO"
            nutritionFacts={
              selectedRecipe.document.nutrition as NutritionInformation
            }
          />
        ) : undefined,
      },
    ];

    recipeBody = (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:grid-cols-1 lg:items-start lg:gap-x-8">
            {/* Product info */}
            <div className="mt-10 px-4 sm:mt-8 sm:px-0 lg:mt-0">
              <h1 className="align-center flex items-center text-3xl font-bold tracking-tight text-gray-900">
                {selectedRecipe.name}
                <a target="_blank" href={selectedRecipe.document["@id"]}>
                  <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                </a>
              </h1>
              <div className="mt-6">
                <h3 className="sr-only">Description</h3>

                <div
                  className="space-y-6 text-base text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedRecipe.document.description?.toString() ?? "",
                  }}
                />
              </div>
              <section aria-labelledby="details-heading" className="mt-12">
                <h2 id="details-heading" className="sr-only">
                  Additional details
                </h2>

                <div className="divide-y divide-gray-200 border-t">
                  {recipeSections.map(
                    (section) =>
                      section.body && (
                        <Disclosure
                          as="div"
                          key={section.name}
                          defaultOpen={section.defaultOpen}
                        >
                          {({ open }) => (
                            <>
                              <h3>
                                <Disclosure.Button className="group relative flex w-full items-center justify-between py-6 text-left">
                                  <span
                                    className={classNames(
                                      open
                                        ? "text-indigo-600"
                                        : "text-gray-900",
                                      "text-sm font-medium",
                                    )}
                                  >
                                    {section.name}
                                  </span>
                                  <span className="ml-6 flex items-center">
                                    {open ? (
                                      <MinusIcon
                                        className="block h-6 w-6 text-indigo-400 group-hover:text-indigo-500"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <PlusIcon
                                        className="block h-6 w-6 text-gray-400 group-hover:text-gray-500"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </span>
                                </Disclosure.Button>
                              </h3>
                              <Disclosure.Panel
                                as="div"
                                className="prose prose-sm pb-6"
                              >
                                {section.body}
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      ),
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return recipeBody;
}
