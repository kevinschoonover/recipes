import { type Config } from "drizzle-kit";
import { env } from "~/env";

export default {
  schema: "./src/server/db/schema.ts",
  out: "./migrations",
  driver: "turso",
  dbCredentials: {
    url: env.TURSO_DB_URL,
    authToken: env.TURSO_DB_AUTH_TOKEN,
  },
  tablesFilter: ["recipes_*"],
} satisfies Config;
