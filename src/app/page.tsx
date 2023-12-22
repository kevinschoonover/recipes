import Link from "next/link";

import { useEffect } from "react";
import { ImportRecipe } from "~/app/_components/import-recipe";
import Header from "~/app/_components/header";

import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";

async function RecipesGrid() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;

  const recipes = await api.recipe.getRecipes.query();

  return (
    <div className="w-full max-w-xs">
      <ul>
        {recipes.map((userRecipe) => (
          <li key={userRecipe.id}>
            {userRecipe.document.name?.toString() ?? "unknown"} -{" "}
            {userRecipe.url}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Home() {
  const session = await getServerAuthSession();

  return (
    <>
      <Header session={session} />
      <main className="flex flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[5rem]">
            Your <span className="text-[hsl(280,100%,70%)]">Recipes</span>, {session?.user.name ?? "Loser"}
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <RecipesGrid />
          </div>
          <ImportRecipe />
        </div>
      </main>
    </>
  );
}
