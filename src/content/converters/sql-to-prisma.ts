import type { ConverterMeta } from "@/lib/converters/types";

export const sqlToPrismaMeta: ConverterMeta = {
  slug: "sql-to-prisma",
  name: "SQL to Prisma Schema",
  title: "SQL to Prisma Schema Converter",
  metaDescription:
    "Convert PostgreSQL and MySQL CREATE TABLE DDL statements into Prisma ORM models. Infers 1:1, 1:n, and n:m relations, enums, @default, @unique, and @@index.",
  category: "SQL & Database",
  inputLanguage: "sql",
  outputLanguage: "prisma",
  outputExtension: ".prisma",
  copyButtonLabel: "Copy Prisma Schema",
  isQualityApproved: true,
  isIndexed: true,

  defaultSample: `CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'MEMBER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  metadata JSONB,
  published BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_posts_author ON posts (author_id, published);`,

  initialOutput: `enum UserRole {
  ADMIN
  MEMBER
  VIEWER
}

model User {
  id String @id @default(uuid()) @db.Uuid
  email String @unique @db.VarChar(255)
  role UserRole @default(MEMBER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  userProfile UserProfile?
  posts Post[]

  @@map("users")
}

model UserProfile {
  id Int @id @default(autoincrement())
  userId String @unique @db.Uuid @map("user_id")
  bio String? @db.Text
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model Post {
  id Int @id @default(autoincrement())
  authorId String @db.Uuid @map("author_id")
  title String @db.VarChar(180)
  metadata Json?
  published Boolean @default(false)
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([authorId, published], map: "idx_posts_author")
  @@map("posts")
}
`,

  optionsConfig: [
    {
      id: "provider",
      label: "Database Provider",
      type: "select",
      defaultValue: "postgresql",
      options: [
        { label: "PostgreSQL (Recommended)", value: "postgresql" },
        { label: "MySQL / MariaDB", value: "mysql" },
        { label: "SQLite", value: "sqlite" },
      ],
      description: "Target SQL dialect for @db.* native type annotations",
    },
    {
      id: "useCamelCase",
      label: "Field Naming Convention",
      type: "select",
      defaultValue: "true",
      options: [
        { label: "camelCase + @map() (Idiomatic Prisma)", value: "true" },
        { label: "Keep Raw snake_case Names", value: "false" },
      ],
      description: "Convert snake_case SQL columns to camelCase Prisma fields with @map",
    },
    {
      id: "includeNativeDbTypes",
      label: "Native @db.* Type Attributes",
      type: "boolean",
      defaultValue: true,
      description: "Add @db.Uuid, @db.VarChar(n), @db.Decimal(p,s), and @db.Text",
    },
    {
      id: "includeGeneratorBlock",
      label: "Include datasource & generator",
      type: "boolean",
      defaultValue: false,
      description: "Prepend generator client and datasource db blocks",
    },
  ],

  deepDive: {
    overview:
      "Migrating an existing PostgreSQL or MySQL database schema into Prisma ORM requires translating raw DDL statements (`CREATE TABLE`, `CREATE TYPE AS ENUM`, and `CREATE INDEX`) into Prisma's declarative data modeling language. Beyond basic scalar mapping, a production Prisma schema requires bidirectional relation fields (`@relation(fields: [...], references: [...])`), distinguishing between One-to-One (`1:1` via `UNIQUE` foreign keys), One-to-Many (`1:n`), and Many-to-Many (`n:m` join tables with composite primary keys `@@id`), as well as preserving database column names via `@map` and `@@map`. Our client-side SQL parser resolves multi-table foreign keys, native `@db.*` annotations, and index definitions directly in your browser.",
    whyDevelopersUseThis: [
      "Infers bidirectional Prisma relations across multiple CREATE TABLE statements, automatically distinguishing 1:1 (unique foreign key), 1:n, and n:m join tables.",
      "Parses both PostgreSQL `CREATE TYPE ... AS ENUM` declarations and MySQL inline `ENUM(...)` columns into standalone Prisma `enum` blocks.",
      "Maps SQL defaults (`SERIAL`, `AUTO_INCREMENT`, `gen_random_uuid()`, `NOW()`, booleans, and literals) into `@default(autoincrement())`, `@default(uuid())`, and `@default(now())`.",
      "Translates `snake_case` SQL columns and plural table names into idiomatic `camelCase` fields and singular `PascalCase` models while preserving database compatibility via `@map` and `@@map`.",
    ],
    commonPitfalls: [
      {
        pitfall: "Confusing 1:1 and 1:n relations when defining Foreign Keys",
        solution:
          "In Prisma, a foreign key column (`user_id REFERENCES users(id)`) creates a One-to-Many (`1:n`) relation (`posts Post[]`) unless the foreign key column itself has a `UNIQUE` constraint (`user_id UUID UNIQUE REFERENCES users(id)`). Adding `UNIQUE` to the foreign key column restricts the relation to One-to-One (`userProfile UserProfile?`).",
      },
      {
        pitfall: "Renaming snake_case SQL columns to camelCase without @map()",
        solution:
          "If your existing SQL table has a column named `created_at` and you write `createdAt DateTime` in `schema.prisma` without `@map(\"created_at\")`, Prisma will query a non-existent `\"createdAt\"` column and fail at runtime. Always pair camelCase field names with `@map(\"snake_case\")` and plural table names with `@@map(\"table_name\")`.",
      },
      {
        pitfall: "Losing Decimal precision by mapping SQL NUMERIC(10, 2) to Float",
        solution:
          "Mapping financial `DECIMAL(10, 2)` or `NUMERIC` columns to Prisma `Float` introduces IEEE 754 floating-point rounding errors. Always map exact numeric columns to Prisma `Decimal` with `@db.Decimal(10, 2)`.",
      },
    ],
  },

  edgeCases: [
    {
      title: "Many-to-Many (n:m) Join Tables & Composite Primary Keys (@@id)",
      scenario:
        "Converting a join table with a composite PRIMARY KEY (post_id, tag_id) and two foreign keys.",
      inputSnippet: `CREATE TABLE post_tags (\n  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,\n  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,\n  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (post_id, tag_id)\n);`,
      outputSnippet: `model PostTag {\n  postId Int @map("post_id")\n  tagId Int @map("tag_id")\n  assignedAt DateTime @default(now()) @map("assigned_at")\n  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)\n  tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)\n\n  @@id([postId, tagId])\n  @@map("post_tags")\n}`,
      explanation:
        "The parser detects the table-level `PRIMARY KEY (post_id, tag_id)` constraint, emits `@@id([postId, tagId])` instead of individual `@id` attributes, and wires up both foreign key `@relation` definitions.",
    },
    {
      title: "MySQL AUTO_INCREMENT, TINYINT(1), and Inline ENUMs",
      scenario:
        "Parsing MySQL-specific table syntax including inline ENUM definitions, TINYINT(1) booleans, and DECIMAL precision.",
      inputSnippet: `CREATE TABLE invoices (\n  id BIGINT AUTO_INCREMENT PRIMARY KEY,\n  amount DECIMAL(10, 2) NOT NULL,\n  is_paid TINYINT(1) NOT NULL DEFAULT 0,\n  status ENUM('DRAFT', 'PAID', 'VOID') NOT NULL DEFAULT 'DRAFT'\n);`,
      outputSnippet: `enum InvoiceStatus {\n  DRAFT\n  PAID\n  VOID\n}\n\nmodel Invoice {\n  id BigInt @id @default(autoincrement())\n  amount Decimal @db.Decimal(10, 2)\n  isPaid Boolean @default(false) @map("is_paid")\n  status InvoiceStatus @default(DRAFT)\n\n  @@map("invoices")\n}`,
      explanation:
        "MySQL `TINYINT(1)` with `DEFAULT 0` is converted to `Boolean @default(false)`, `DECIMAL(10, 2)` preserves its scale via `@db.Decimal(10, 2)`, and the inline `ENUM` is extracted into a top-level `enum InvoiceStatus`.",
    },
    {
      title: "Standalone CREATE INDEX & Composite Unique Constraints",
      scenario:
        "Mapping standalone CREATE INDEX statements and multi-column UNIQUE constraints into @@index and @@unique.",
      inputSnippet: `CREATE TABLE audit_logs (\n  id BIGSERIAL PRIMARY KEY,\n  tenant_id UUID NOT NULL,\n  event_key VARCHAR(64) NOT NULL,\n  UNIQUE (tenant_id, event_key)\n);\nCREATE INDEX idx_audit_tenant ON audit_logs (tenant_id);`,
      outputSnippet: `model AuditLog {\n  id BigInt @id @default(autoincrement())\n  tenantId String @db.Uuid @map("tenant_id")\n  eventKey String @db.VarChar(64) @map("event_key")\n\n  @@unique([tenantId, eventKey])\n  @@index([tenantId], map: "idx_audit_tenant")\n  @@map("audit_logs")\n}`,
      explanation:
        "Multi-column `UNIQUE` constraints become `@@unique([...])` and external `CREATE INDEX` statements are attached to their target model via `@@index([...], map: \"...\")`.",
    },
  ],

  faqs: [
    {
      question: "How does the converter distinguish between 1:1, 1:n, and n:m relations in SQL?",
      answer:
        "In relational SQL, all relationships are expressed via `FOREIGN KEY ... REFERENCES`. If the foreign key column has a `UNIQUE` constraint (e.g., `user_id UUID UNIQUE REFERENCES users(id)`), our engine infers a One-to-One (`1:1`) relation (`userProfile UserProfile?`). Without `UNIQUE`, it infers a One-to-Many (`1:n`) relation (`posts Post[]`). When a join table has a composite `PRIMARY KEY (a_id, b_id)` referencing two tables, it generates an explicit Many-to-Many (`n:m`) join model with `@@id([aId, bId])`.",
    },
    {
      question: "Does it support both PostgreSQL and MySQL data types?",
      answer:
        "Yes. The engine parses PostgreSQL types (`SERIAL`, `BIGSERIAL`, `UUID`, `TIMESTAMPTZ`, `JSONB`, `BYTEA`, `TEXT[]` arrays, and `CREATE TYPE ... AS ENUM`) as well as MySQL types (`AUTO_INCREMENT`, `TINYINT(1)` booleans, `DATETIME`, `DECIMAL(p,s)`, and inline `ENUM(...)` columns).",
    },
    {
      question: "Why does the converter add @map and @@map attributes?",
      answer:
        "SQL databases conventionally use `snake_case` column names (`created_at`) and plural table names (`users`), whereas Prisma and TypeScript conventions favor `camelCase` properties (`createdAt`) and singular `PascalCase` models (`User`). Adding `@map` and `@@map` gives you clean TypeScript client code without renaming columns in your existing database.",
    },
    {
      question: "Is my database schema sent to any external server?",
      answer:
        "No. All SQL DDL parsing and Prisma schema generation execute 100% locally in your browser using JavaScript. Your proprietary database structure never leaves your device.",
    },
  ],

  relatedSlugs: ["json-to-zod", "json-to-typescript", "yaml-to-json", "curl-to-fetch"],
};
