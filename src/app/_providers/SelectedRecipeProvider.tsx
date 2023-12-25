"use client";

import {
  createContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { type Recipe } from "schema-dts";

export type ParsedRecipe = {
  slug: string;
  image: string;
  name: string;
  category: string | undefined;
  document: Recipe;
};

interface SelectedRecipeContextType {
  selectedRecipe: ParsedRecipe | undefined;
  setSelectedRecipe: Dispatch<SetStateAction<ParsedRecipe | undefined>>;
}

export const SelectedRecipeContext = createContext<SelectedRecipeContextType>({
  selectedRecipe: undefined,
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

  return (
    <SelectedRecipeContext.Provider
      value={{ selectedRecipe, setSelectedRecipe }}
    >
      {children}
    </SelectedRecipeContext.Provider>
  );
}
