import { drizzle } from "drizzle-orm/libsql/web";
import { createClient } from "@libsql/client/web";
import { env } from "#/env";
import * as schema from "./schema";

const client = createClient({
  url: env.TURSO_DB_URL,
  authToken: env.TURSO_DB_AUTH_TOKEN,
  fetch: globalThis.fetch,
});

export const db = drizzle(client, { schema });
