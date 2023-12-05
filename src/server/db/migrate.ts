import { migrate } from "drizzle-orm/libsql/migrator"; 
import { db } from "~/server/db"

try {
  await migrate(db, {
    migrationsFolder: "./migrations",
  });
  console.log("Tables migrated!");
  process.exit(0);
} catch (error) {
  console.error("Error performing migration: ", error);
  process.exit(1);
}
