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

const Thing = z
  .object({
    "@context": z.string(),
    "@graph": z
      .array(z.object({ "@type": z.string() }).passthrough())
      .optional(),
    "@type": z.string().optional(),
  })
  .passthrough();

const LDJsonDocument = Thing.or(z.array(Thing));

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
            // try {
            const document: z.infer<typeof LDJsonDocument> =
              LDJsonDocument.parse(JSON.parse(elm.rawText));

            if (Array.isArray(document)) {
              document.forEach((obj) => {
                if (obj["@type"] === "Recipe") {
                  acc.push(obj as Recipe);
                }
              });
            } else {
              if (document["@graph"] !== undefined) {
                document["@graph"].forEach((obj) => {
                  if (obj["@type"] === "Recipe") {
                    acc.push(obj as Recipe);
                  }
                });
              } else if (document["@type"] === "Recipe") {
                acc.push(document as Recipe);
              }
            }

            return acc;
            // } catch (e) {
            //   if (e instanceof Error) {
            //     console.log(
            //       `failed to import recipe from ${input.url}. document: ${elm.rawText}, err: ${e.message}`,
            //     );
            //   }
            //   return acc;
            // }
          }, [] as Recipe[]);

        if (recipes.length != 1) {
          throw new Error(
            `unexpected number of recipes found. expected: 1, found: ${recipes.length}`,
          );
        }

        const insertOperations = recipes.map((recipe) =>
          ctx.db
            .insert(recipesTable)
            .values({
              url: input.url,
              document: JSON.stringify(recipe),
              slug: nanoid(),
              userId: userID,
            })
            .returning({ slug: recipesTable.slug }),
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
      return {
        document: JSON.parse(recipe.document) as Recipe,
        url: recipe.url,
        slug: recipe.slug,
      };
    });
  }),
});
