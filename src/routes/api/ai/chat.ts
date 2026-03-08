import { createFileRoute } from "@tanstack/react-router";
import { createGeminiChat } from "@tanstack/ai-gemini";
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { auth } from "#/lib/auth";
import { env } from "#/env";
import { db } from "#/server/db";
import { recipes } from "#/server/db/schema";
import { eq, like, and } from "drizzle-orm";
import { searchRecipesToolDef, showRecipeToolDef } from "#/lib/recipe-tools";

async function handleChat(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const searchRecipes = searchRecipesToolDef.server(
    async ({ query, category }) => {
      const conditions = [eq(recipes.userId, userId)];
      if (query) conditions.push(like(recipes.name, `%${query}%`));
      if (category) conditions.push(eq(recipes.category, category));

      return db
        .select({
          id: recipes.id,
          slug: recipes.slug,
          name: recipes.name,
          description: recipes.description,
          category: recipes.category,
          imageUrl: recipes.imageUrl,
        })
        .from(recipes)
        .where(and(...conditions))
        .limit(10);
    },
  );

  const showRecipe = showRecipeToolDef.server(({ slug }) => ({ slug }));

  const adapter = createGeminiChat("gemini-2.5-flash", env.GOOGLE_AI_API_KEY!);

  const body = await request.json();

  try {
    const stream = chat({
      adapter,
      messages: body.messages ?? body,
      systemPrompts: [
        "You are a helpful recipe assistant. You can search the user's recipe collection and show recipe cards. When recommending a recipe, always use the showRecipe tool to display it. Be concise and friendly.",
      ],
      tools: [searchRecipes, showRecipe],
    });

    return toServerSentEventsResponse(stream);
  } catch (e) {
    console.error("Chat error:", e);
    return Response.json({ error: "Chat failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: ({ request }) => handleChat(request),
    },
  },
});
