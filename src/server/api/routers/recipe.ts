import { z } from "zod";
import { parse } from 'node-html-parser';

import { type Recipe } from "schema-dts";

import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

const LDJsonDocument = z.object({ "@context": z.string(), "@graph": z.array(z.object({"@type": z.string()}).passthrough()) })

export const recipeRouter = createTRPCRouter({
  import: publicProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input }) => {
    try {
      const headers = {
        "Accept": 'text/html',
        "User-Agent": 'recipes.kschoon.me (contact: recipes@kschoon.me)'
      };
      const body = await (await fetch(input.url, { headers })).text();
      parse(body).querySelectorAll('script[type=application/ld+json]').reduce<Recipe[]>((acc, elm) => {
        const document: z.infer<typeof LDJsonDocument> = LDJsonDocument.parse(JSON.parse(elm.rawText));

        document["@graph"].forEach((obj) => {
          if (obj["@type"] === "Recipe") {
            acc.push(obj as Recipe)
          }
        })

        return acc
      }, [] as Recipe[])
    } catch (e) {
      if (e instanceof Error) {
        console.log(`failed to import recipe from ${input.url}. err: ${e.message}`)
      }
      return
    }
    }),
});
