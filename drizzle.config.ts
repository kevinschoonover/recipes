import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env["TURSO_DB_URL"]!,
    authToken: process.env["TURSO_DB_AUTH_TOKEN"],
  },
  tablesFilter: ["recipes_*"],
});
