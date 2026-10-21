export const POPULAR_NPM_PACKAGES = Array.from(
  new Set([
    // Core Frontend & Frameworks
    "react",
    "react-dom",
    "next",
    "vue",
    "svelte",
    "solid-js",
    "astro",
    "@remix-run/react",
    "angular",

    // State Management
    "zustand",
    "redux",
    "@reduxjs/toolkit",
    "jotai",
    "recoil",
    "pinia",
    "mobx",

    // Backend & API Frameworks
    "express",
    "fastify",
    "hono",
    "koa",
    "nestjs",
    "@nestjs/core",
    "trpc",
    "@trpc/server",
    "@trpc/client",

    // AI & LLMs
    "openai",
    "@google/genai",
    "@anthropic-ai/sdk",
    "ai",
    "langchain",
    "ollama",

    // TypeScript & Tooling
    "typescript",
    "@types/node",
    "@types/react",
    "tslib",
    "tsx",
    "ts-node",
    "type-fest",
    "esbuild",
    "webpack",
    "vite",
    "turbo",
    "rollup",
    "swc",
    "@swc/core",

    // Data Validation & Schema
    "zod",
    "zod-validation-error",
    "yup",
    "joi",
    "valibot",
    "superjson",

    // Databases & ORMs
    "prisma",
    "@prisma/client",
    "drizzle-orm",
    "mongoose",
    "pg",
    "mysql2",
    "better-sqlite3",
    "sql.js",
    "redis",
    "ioredis",

    // HTTP & Networking
    "axios",
    "node-fetch",
    "undici",
    "got",
    "ky",
    "superagent",
    "form-data",
    "qs",

    // Realtime & WebSockets
    "ws",
    "socket.io",
    "socket.io-client",

    // Security & Auth
    "jsonwebtoken",
    "bcrypt",
    "bcryptjs",
    "helmet",
    "cors",
    "cookie-parser",
    "express-rate-limit",
    "nanoid",
    "uuid",

    // Styling & UI
    "tailwindcss",
    "postcss",
    "autoprefixer",
    "clsx",
    "tailwind-merge",
    "class-variance-authority",
    "framer-motion",
    "lucide-react",
    "styled-components",
    "radix-ui",

    // Utilities & Helpers
    "lodash",
    "lodash-es",
    "chalk",
    "commander",
    "yargs",
    "dotenv",
    "dotenv-expand",
    "cross-env",
    "semver",
    "glob",
    "rimraf",
    "execa",
    "chokidar",
    "yaml",
    "js-yaml",
    "debug",
    "winston",
    "pino",
    "morgan",
    "sharp",
    "rxjs",
    "dayjs",
    "date-fns",
    "moment",
    "shiki",
    "marked",

    // Testing
    "vitest",
    "jest",
    "mocha",
    "playwright",
    "puppeteer",
    "supertest",
    "cypress",

    // Linting & Formatting
    "eslint",
    "prettier",

    // Payments & Services
    "stripe",
    "nodemailer",
    "bullmq",
  ])
);

export const NPM_CATEGORIES = [
  {
    name: "Web Frameworks",
    packages: ["next", "react", "vue", "express", "fastify", "hono"],
  },
  {
    name: "AI & LLMs",
    packages: ["openai", "@google/genai", "@anthropic-ai/sdk", "ai", "langchain"],
  },
  {
    name: "Databases & ORMs",
    packages: ["prisma", "drizzle-orm", "mongoose", "pg", "redis", "ioredis"],
  },
  {
    name: "Security & Utilities",
    packages: ["zod", "helmet", "cors", "jsonwebtoken", "bcrypt", "dotenv"],
  },
  {
    name: "Styling & UI",
    packages: ["tailwindcss", "lucide-react", "clsx", "tailwind-merge", "framer-motion"],
  },
];
