import { sql } from "drizzle-orm";
import {
  index,
  int,
  integer,
  sqliteTableCreator,
  primaryKey,
  text,
} from "drizzle-orm/sqlite-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const sqliteTable = sqliteTableCreator((name) => `recipes_${name}`);

export const posts = sqliteTable(
  "post",
  {
    id: int("id", { mode: "number" }).primaryKey({autoIncrement: true}),
    name: text("name", { length: 256 }),
    createdById: text("createdById", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: int("created_at", {mode: "timestamp"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: int("updatedAt", {mode: "timestamp"}),
  },
  (example) => ({
    createdByIdIdx: index("createdById_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  })
);

export const users = sqliteTable("user", {
 id: text("id").notNull().primaryKey(),
 name: text("name"),
 email: text("email").notNull(),
 emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
 image: text("image"),
})

export const accounts = sqliteTable(
 "account",
 {
   userId: text("userId")
     .notNull()
     .references(() => users.id, { onDelete: "cascade" }),
   type: text("type").$type<AdapterAccount["type"]>().notNull(),
   provider: text("provider").notNull(),
   providerAccountId: text("providerAccountId").notNull(),
   refresh_token: text("refresh_token"),
   access_token: text("access_token"),
   expires_at: integer("expires_at"),
   token_type: text("token_type"),
   scope: text("scope"),
   id_token: text("id_token"),
   session_state: text("session_state"),
 },
 (account) => ({
   compoundKey: primaryKey(account.provider, account.providerAccountId),
 })
)

export const sessions = sqliteTable("session", {
sessionToken: text("sessionToken").notNull().primaryKey(),
userId: text("userId")
  .notNull()
  .references(() => users.id, { onDelete: "cascade" }),
expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
"verificationToken",
{
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
},
(vt) => ({
  compoundKey: primaryKey(vt.identifier, vt.token),
})
)
