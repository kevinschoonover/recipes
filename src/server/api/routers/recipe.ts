import { z } from "zod";
import { parse } from "node-html-parser";
import { nanoid } from "nanoid";

import { type Recipe } from "schema-dts";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { recipesTable } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const LDJsonDocument = z.object({
  "@context": z.string(),
  "@graph": z.array(z.object({ "@type": z.string() }).passthrough()),
});

export const recipeRouter = createTRPCRouter({
  import: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const userID = ctx.session.user.id;
      try {
        const headers = {
          Accept: "text/html",
          "User-Agent": "recipes.kschoon.me (contact: recipes@kschoon.me)",
        };
        const body = await (await fetch(input.url, { headers })).text();
        const recipes = parse(body)
          .querySelectorAll("script[type=application/ld+json]")
          .reduce<Recipe[]>((acc, elm) => {
            const document: z.infer<typeof LDJsonDocument> =
              LDJsonDocument.parse(JSON.parse(elm.rawText));

            document["@graph"].forEach((obj) => {
              if (obj["@type"] === "Recipe") {
                acc.push(obj as Recipe);
              }
            });

            return acc;
          }, [] as Recipe[]);

        const insertOperations = recipes.map((recipe) =>
          ctx.db
            .insert(recipesTable)
            .values({
              url: input.url,
              document: JSON.stringify(recipe),
              id: nanoid(),
              userId: userID,
            })
            .returning({ id: recipesTable.id }),
        );
        if (insertOperations.length != 1) {
          return;
        }
        await insertOperations[0];
      } catch (e) {
        if (e instanceof Error) {
          console.log(
            `failed to import recipe from ${input.url}. err: ${e.message}`,
          );
        }
        return;
      }
    }),
  getRecipes: protectedProcedure.query(async ({ ctx }) => {
    const userID = ctx.session.user.id;
    const userRecipes = await ctx.db.query.recipesTable.findMany({
      where: eq(recipesTable.userId, userID),
    });
    return userRecipes.map((recipe) => {
      return { document: JSON.parse(recipe.document) as Recipe, url: recipe.url, id: recipe.id }
    });
  }),
});
