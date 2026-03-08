import { createFileRoute } from "@tanstack/react-router";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { chat } from "@tanstack/ai";
import type { ContentPart } from "@tanstack/ai";
import { auth } from "#/lib/auth";
import { env } from "#/env";
import { RecipeImportSchema } from "#/lib/schemas/recipe-import";
import {
  extractLdJsonFromHtml,
  ldJsonToRecipeImport,
} from "#/lib/recipe-import-utils";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

const IMPORT_SYSTEM_PROMPT = `You are a recipe extraction expert. Given recipe content (from a URL, pasted text, or photo), extract the structured recipe data.

Guiding Principles:
+ Be precise with quantities and units. Use ISO 8601 durations for time fields (e.g., "PT15M", "PT1H30M").
+ Prefer putting units infront of the ingredient (e.g., "100g honey", or "1 bell pepper")
+ Populate populate ingredientIndices with the 0-based indices of ingredients for 
  specific preparation steps that require multiple ingredients to allow the user 
  to get all of the necessary ingredients needed for that and future steps in quick succession
  (e.g., "marinate chicken" should include all spices needed to marinate the chicken) 
  or steps that reference many ingredients all together that 
  (e.g., "cook the chicken, then add X ingredient, then add Y ingredient" should have X and Y included in the "cook the chicken" step)
+ The "document" field must be a complete Schema.org Recipe JSON-LD conforming to Google's structured data guidelines.
+ If information is missing, omit optional fields.
+ Group related steps into sections using the sectionName field when the recipe has distinct phases (e.g., "Prep", "Sauce", "Assembly", "Serving").
+ If not description is provided, try to generate a fun description based on the ingredients in the recipe
+ If you see many related ingredients bundled together, break them up as individual ingredients (e.g., "Garlic powder, salt, onion powder, cumin (to taste)" becomes "Garlic Powder", "Salt", "Onion Powder")
+ For each step, be thorough and concise`;

async function handleImport(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const type = formData.get("type") as string;
  const content = formData.get("content") as string | null;
  const file = formData.get("file") as File | null;

  // URL import: try LD+JSON extraction first, fall back to AI
  if (type === "url") {
    let html: string;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (compatible; RecipesApp/1.0; +https://github.com/kevinschoonover/recipes)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };

    try {
      const res = await fetch(content!, { headers });
      if (res.status != 200) {
        console.warn(`Failed to fetch URL: ${content}, status: ${res.status}`);
      }
      html = await res.text();
    } catch {
      return Response.json({ error: "Failed to fetch URL" }, { status: 400 });
    }

    // Try to extract existing LD+JSON — no AI needed
    const ldJson = extractLdJsonFromHtml(html);
    if (ldJson) {
      try {
        const result = ldJsonToRecipeImport(ldJson);
        return Response.json({ ...result, source: "ld+json" });
      } catch {
        // LD+JSON was malformed, fall through to AI
      }
    }

    // Fall back to AI extraction
    return aiExtract(
      `Extract the recipe from this URL content:\n\n${html.slice(0, 50000)}`,
    );
  }

  if (type === "text") {
    return aiExtract(`Extract the recipe from this text:\n\n${content}`);
  }

  if (type === "photo" && file) {
    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    return aiExtract([
      {
        type: "image",
        source: { type: "data", value: base64, mimeType: file.type },
      },
      { type: "text", content: "Extract the recipe from this image." },
    ]);
  }

  return Response.json({ error: "Invalid import type" }, { status: 400 });
}

async function aiExtract(
  content: string | Array<ContentPart>,
): Promise<Response> {
  const adapter = createGeminiChat("gemini-2.5-flash", env.GOOGLE_AI_API_KEY!);

  try {
    const result = await chat({
      adapter,

      messages: [{ role: "user", content }] as any,
      systemPrompts: [IMPORT_SYSTEM_PROMPT],
      outputSchema: RecipeImportSchema,
    });

    return Response.json({ ...result, source: "ai" });
  } catch (e) {
    console.error("Recipe import error:", e);
    return Response.json(
      { error: "Failed to extract recipe" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/ai/import")({
  server: {
    handlers: {
      POST: ({ request }) => handleImport(request),
    },
  },
});
