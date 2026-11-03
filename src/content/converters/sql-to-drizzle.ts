import type { ConverterMeta } from "@/lib/converters/types";

export const sqlToDrizzleMeta: ConverterMeta = {
  slug: "sql-to-drizzle",
  name: "SQL to Drizzle Schema",
  title: "SQL to Drizzle ORM Schema Converter",
  metaDescription:
    "Convert PostgreSQL, MySQL, and SQLite CREATE TABLE DDL into Drizzle ORM TypeScript schemas (pgTable, mysqlTable, sqliteTable, relations, and $inferSelect).",
  category: "SQL & Database",
  inputLanguage: "sql",
  outputLanguage: "typescript",
  outputExtension: ".ts",
  copyButtonLabel: "Copy Drizzle Schema",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  metadata JSONB,
  published BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_posts_author ON posts (author_id, published);`,

  initialOutput: `import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "MEMBER", "VIEWER"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").default("MEMBER").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    metadata: jsonb("metadata"),
    published: boolean("published").default(false).notNull(),
  },
  (t) => ({
    idxPostsAuthor: index("idx_posts_author").on(t.authorId, t.published),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
`,

  optionsConfig: [
    {
      id: "dialect",
      label: "Drizzle SQL Dialect",
      type: "select",
      defaultValue: "postgresql",
      options: [
        { label: "PostgreSQL (drizzle-orm/pg-core)", value: "postgresql" },
        { label: "MySQL (drizzle-orm/mysql-core)", value: "mysql" },
        { label: "SQLite / Turso (drizzle-orm/sqlite-core)", value: "sqlite" },
      ],
      description: "Target Drizzle ORM core package and column builders",
    },
    {
      id: "useCamelCase",
      label: "Property Naming",
      type: "select",
      defaultValue: "true",
      options: [
        { label: "camelCase Keys + snake_case DB Columns", value: "true" },
        { label: "Keep Raw snake_case Keys", value: "false" },
      ],
      description: "Map snake_case SQL columns to camelCase TypeScript properties",
    },
    {
      id: "includeRelations",
      label: "Generate relations() Blocks",
      type: "boolean",
      defaultValue: true,
      description: "Emit Drizzle Relational Queries API definitions (one / many)",
    },
    {
      id: "includeInferTypes",
      label: "Export $inferSelect & $inferInsert",
      type: "boolean",
      defaultValue: true,
      description: "Export TypeScript select and insert row types for each table",
    },
  ],

  deepDive: {
    overview:
      "Migrating raw SQL DDL statements (`CREATE TABLE`, `CREATE TYPE ... AS ENUM`, and `CREATE INDEX`) into Drizzle ORM requires mapping SQL types into dialect-specific column builders from `drizzle-orm/pg-core`, `drizzle-orm/mysql-core`, or `drizzle-orm/sqlite-core`. Unlike Prisma's custom DSL, Drizzle defines schemas directly in TypeScript where foreign keys require both database-level `.references(() => table.col)` constraints (for `drizzle-kit` migrations) and application-level `relations()` declarations (for `db.query.*` relational queries). This converter parses multi-table SQL schemas entirely in your browser and outputs idiomatic Drizzle TypeScript code.",
    whyDevelopersUseThis: [
      "Generates both database-level `.references(() => parent.id, { onDelete })` constraints and Drizzle Query API `relations(table, ({ one, many }) => ...)` blocks.",
      "Supports PostgreSQL (`pgTable`, `pgEnum`, `uuid().defaultRandom()`), MySQL (`mysqlTable`, `varchar`), and SQLite/Turso (`sqliteTable`, `integer({ mode: 'boolean' })`).",
      "Translates composite `PRIMARY KEY (a, b)` constraints and `CREATE INDEX` statements into Drizzle's third-argument table callback `(t) => ({ pk: primaryKey(...), idx: index(...) })`.",
      "Exports modern `typeof table.$inferSelect` and `typeof table.$inferInsert` TypeScript types instead of deprecated `InferModel` helpers.",
    ],
    commonPitfalls: [
      {
        pitfall: "Defining .references() without relations() and wondering why db.query.*.findMany({ with: ... }) fails",
        solution:
          "In Drizzle ORM, `.references(() => users.id)` only defines the SQL `FOREIGN KEY` constraint for migrations. To use Drizzle's relational query builder (`db.query.users.findMany({ with: { posts: true } })`), you must also export `relations(users, ({ many }) => ({ posts: many(posts) }))`.",
      },
      {
        pitfall: "Using JavaScript number mode on 64-bit BIGINT columns that exceed Number.MAX_SAFE_INTEGER",
        solution:
          "Drizzle's `bigint('col', { mode: 'number' })` is convenient for standard auto-increment IDs under `2^53 - 1`, but if you store 64-bit Snowflake IDs, switch to `{ mode: 'bigint' }` so values are not silently rounded in JavaScript.",
      },
      {
        pitfall: "Forgetting that SQLite lacks native BOOLEAN and TIMESTAMP column types",
        solution:
          "When targeting `drizzle-orm/sqlite-core`, use `integer('col', { mode: 'boolean' })` and `integer('col', { mode: 'timestamp' })` so Drizzle automatically serializes booleans (`0`/`1`) and JavaScript `Date` objects.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Many-to-Many Join Tables with Composite Primary Keys",
      scenario:
        "A join table defines `PRIMARY KEY (post_id, tag_id)` across two foreign keys instead of a single `id` column.",
      inputSnippet: `CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);`,
      outputSnippet: `export const postTags = pgTable(
  "post_tags",
  {
    postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
  })
);`,
      explanation:
        "Single-column primary keys use `.primaryKey()` directly on the column builder, whereas composite primary keys must be returned inside the table configuration callback using `primaryKey({ columns: [...] })`.",
    },
    {
      title: "PostgreSQL Native ENUMs and TIMESTAMPTZ Defaults",
      scenario:
        "A PostgreSQL schema declares `CREATE TYPE status AS ENUM` alongside `TIMESTAMPTZ DEFAULT NOW()` and `UUID DEFAULT gen_random_uuid()`.",
      inputSnippet: `CREATE TYPE order_status AS ENUM ('PENDING', 'PAID');
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status order_status NOT NULL DEFAULT 'PENDING',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`,
      outputSnippet: `export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PAID"]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  placedAt: timestamp("placed_at", { withTimezone: true }).defaultNow().notNull(),
});`,
      explanation:
        "PostgreSQL enums must be declared as standalone exported constants via `pgEnum()` so `drizzle-kit` generates the `CREATE TYPE` migration before the table.",
    },
  ],

  faqs: [
    {
      question: "How do I infer TypeScript row types from a Drizzle table?",
      answer:
        "Modern Drizzle ORM (v0.28+) provides built-in `$inferSelect` and `$inferInsert` properties directly on every table object: `export type User = typeof users.$inferSelect` and `export type NewUser = typeof users.$inferInsert`.",
    },
    {
      question: "What is the difference between .references() and relations() in Drizzle ORM?",
      answer:
        "`.references(() => users.id)` generates the physical SQL `FOREIGN KEY` constraint in the database via `drizzle-kit`. `relations()` is an application-level declaration that tells Drizzle's TypeScript query builder how to join tables when using `db.query`.",
    },
    {
      question: "Is my SQL schema sent to any server during conversion?",
      answer:
        "No. The SQL DDL lexer and Drizzle code generator run 100% locally inside your browser tab with zero network requests.",
    },
  ],

  relatedSlugs: ["sql-to-prisma", "json-to-zod", "env-to-zod"],
};
