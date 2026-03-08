import { createFileRoute } from "@tanstack/react-router";
import { createAnthropicChat } from "@tanstack/ai-anthropic";
import { chat } from "@tanstack/ai";
import { auth } from "#/lib/auth";
import { env } from "#/env";
import { RecipeImportSchema } from "#/lib/schemas/recipe-import";
import {
  extractLdJsonFromHtml,
  ldJsonToRecipeImport,
} from "#/lib/recipe-import-utils";

const IMPORT_SYSTEM_PROMPT = `You are a recipe extraction expert. Given recipe content (from a URL, pasted text, or photo description), extract the structured recipe data.

Be precise with quantities and units. Use ISO 8601 durations for time fields (e.g., "PT15M", "PT1H30M").
The "document" field must be a complete Schema.org Recipe JSON-LD conforming to Google's structured data guidelines.
If information is missing, omit optional fields.`;

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
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    };

    try {
      const res = await fetch(content!, {headers});
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
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return aiExtract(
      `Extract the recipe from this image. [Image: ${file.type};base64,${base64.slice(0, 100)}...]`,
    );
  }

  return Response.json({ error: "Invalid import type" }, { status: 400 });
}

async function aiExtract(userMessage: string): Promise<Response> {
  const adapter = createAnthropicChat(
    "claude-sonnet-4",
    env.ANTHROPIC_API_KEY!,
  );

  try {
    const result = await chat({
      adapter,
      messages: [{ role: "user", content: userMessage }],
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
