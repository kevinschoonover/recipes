import { z } from "zod";
import { parse } from "node-html-parser";
import { nanoid } from "nanoid";

import { type Recipe } from "schema-dts";

import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure,
} from "~/server/api/trpc";
import { recipesTable } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

const Thing = z
  .object({
    "@context": z.string(),
    "@graph": z
      .array(
        z.object({ "@type": z.string().or(z.array(z.string())) }).passthrough(),
      )
      .optional(),
    "@type": z.string().optional(),
  })
  .passthrough();

const LDJsonDocument = Thing.or(z.array(Thing));

const RecipeType: z.ZodType<Recipe> = z
  .object({ "@type": z.literal("Recipe") })
  .passthrough();

export const recipeRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        slug: z.string().optional(),
        document: RecipeType,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userID = ctx.session.user.id;
      const slug = input.slug ?? nanoid();
      try {
        await ctx.db
          .insert(recipesTable)
          .values({
            slug: slug,
            document: JSON.stringify(input.document),
            userId: userID,
          })
          .returning({ slug: recipesTable.slug });

        return {
          document: input.document,
          importedFrom: null,
          slug: slug,
        };
      } catch (e) {
        if (e instanceof Error) {
          console.error(`failed to create recipe. err: ${e.message}`);
        }
        throw e;
      }
    }),
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

        const recipe = recipes[0]!;
        const recipeObj = {
          importedFrom: input.url,
          document: JSON.stringify(recipe),
          slug: nanoid(),
        };
        await ctx.db
          .insert(recipesTable)
          .values({
            ...recipeObj,
            userId: userID,
          })
          .returning({ slug: recipesTable.slug });
        return {
          importedFrom: input.url,
          document: recipe,
          slug: recipeObj.slug,
        };
      } catch (e) {
        if (e instanceof Error) {
          console.error(
            `failed to import recipe from ${input.url}. err: ${e.message}`,
          );
        }
        throw e;
      }
    }),
  delete: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userID = ctx.session.user.id;
      const result = await ctx.db
        .delete(recipesTable)
        .where(
          and(
            eq(recipesTable.slug, input.slug),
            eq(recipesTable.userId, userID),
          ),
        );
      if (result.rowsAffected != 1) {
        return false;
      }
      return true;
    }),
  all: protectedProcedure.query(async ({ ctx }) => {
    const userID = ctx.session.user.id;
    const userRecipes = await ctx.db.query.recipesTable.findMany({
      where: eq(recipesTable.userId, userID),
    });
    return userRecipes.map((recipe) => {
      return {
        document: JSON.parse(recipe.document) as Recipe,
        importedFrom: recipe.importedFrom,
        slug: recipe.slug,
      };
    });
  }),
});
