import { ImportRecipe } from "~/app/_components/import-recipe";
import Header from "~/app/_components/header";

import { getServerAuthSession } from "~/server/auth";
import { api } from "~/trpc/server";

async function RecipesGrid() {
  const session = await getServerAuthSession();
  if (!session?.user) return null;

  const recipes = (await api.recipe.getRecipes.query()).map((recipe) => {
    let image = recipe.document.image?.valueOf()
    if (typeof image === "string") {
      image = recipe.document.image?.toString()
    } else if (image instanceof Object) {
      // TODO: better checking of type
      image = (image as string[])![0]!
    } else {
      image = "https://picsum.photos/500/300"
    }

    const name = recipe.document.name?.toString() ?? "unknown";

    return {
      id: recipe.id,
      image: image,
      name: name
    }
  })

  return (
    <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
      {recipes.map((recipe) => (
        <li key={recipe.id} className="relative">
          <div className="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
            <img src={recipe.image } alt="" className="pointer-events-none object-cover group-hover:opacity-75" />
            <button type="button" className="absolute inset-0 focus:outline-none">
              <span className="sr-only">View details for {recipe.name}</span>
            </button>
          </div>
          <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">{recipe.name}</p>
        </li>
      ))}
    </ul>
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
