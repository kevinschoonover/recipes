import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from "@tanstack/ai-react";
import type { InferChatMessages } from "@tanstack/ai-react";
import { clientTools } from "@tanstack/ai-client";
import { showRecipeClient } from "#/lib/recipe-tools";

const chatOptions = createChatClientOptions({
  connection: fetchServerSentEvents("/api/ai/chat"),
  tools: clientTools(showRecipeClient),
});

export type ChatMessages = InferChatMessages<typeof chatOptions>;

export const useRecipeChat = () => useChat(chatOptions);
