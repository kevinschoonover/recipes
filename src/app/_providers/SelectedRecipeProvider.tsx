"use client";

import {
  createContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type Recipe } from "schema-dts";

import { type inferRouterOutputs } from "@trpc/server";
import { type recipeRouter } from "~/server/api/routers/recipe";

export type ParsedRecipe = {
  slug: string;
  importedFrom: string | null;
  image: string | undefined;
  name: string;
  category: string | undefined;
  document: Recipe;
};

type RecipeRouterOutput = inferRouterOutputs<typeof recipeRouter>;

export function ParseRecipe(
  recipe: RecipeRouterOutput["all"][number],
): ParsedRecipe {
  let imageURL = undefined;
  let category: string | undefined = undefined;
  const image = recipe.document.image?.valueOf();
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
    importedFrom: recipe.importedFrom,
    image: imageURL,
    name: name,
    category: category,
    document: recipe.document,
  };
}

export function ParseRecipes(
  recipes: RecipeRouterOutput["all"],
): ParsedRecipe[] {
  return recipes.map<ParsedRecipe>((recipe) => ParseRecipe(recipe));
}

interface SelectedRecipeContextType {
  recipes: ParsedRecipe[];
  editMode: boolean;
  setEditMode: (arg0: boolean) => void;
  setRecipes: Dispatch<SetStateAction<ParsedRecipe[]>>;
  selectedRecipe: ParsedRecipe | undefined;
  setSelectedRecipe: Dispatch<SetStateAction<ParsedRecipe | undefined>>;
}

export const SelectedRecipeContext = createContext<SelectedRecipeContextType>({
  setRecipes: () => {
    return [];
  },
  recipes: [],
  selectedRecipe: undefined,
  editMode: false,
  setEditMode: () => {
    return undefined;
  },
  setSelectedRecipe: () => {
    return undefined;
  },
});

export default function RecipeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedRecipe, setSelectedRecipe] = useState<
    ParsedRecipe | undefined
  >(undefined);
  const [recipes, setRecipes] = useState<ParsedRecipe[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);

  return (
    <SelectedRecipeContext.Provider
      value={{
        selectedRecipe,
        setSelectedRecipe,
        recipes,
        setRecipes,
        editMode,
        setEditMode,
      }}
    >
      {children}
    </SelectedRecipeContext.Provider>
  );
}
