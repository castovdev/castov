export interface ComparisonPair {
  pkg1: string;
  pkg2: string;
  category: string;
}

export const POPULAR_NPM_COMPARISONS: ComparisonPair[] = [
  // Web Frameworks & UI
  { pkg1: "react", pkg2: "vue", category: "Frontend Frameworks" },
  { pkg1: "react", pkg2: "angular", category: "Frontend Frameworks" },
  { pkg1: "react", pkg2: "svelte", category: "Frontend Frameworks" },
  { pkg1: "vue", pkg2: "svelte", category: "Frontend Frameworks" },
  { pkg1: "react", pkg2: "solid-js", category: "Frontend Frameworks" },
  { pkg1: "preact", pkg2: "react", category: "Frontend Frameworks" },
  { pkg1: "next", pkg2: "remix", category: "Meta Frameworks" },
  { pkg1: "next", pkg2: "astro", category: "Meta Frameworks" },
  { pkg1: "next", pkg2: "nuxt", category: "Meta Frameworks" },
  { pkg1: "astro", pkg2: "gatsby", category: "Meta Frameworks" },
  { pkg1: "svelte", pkg2: "solid-js", category: "Frontend Frameworks" },
  { pkg1: "vue", pkg2: "angular", category: "Frontend Frameworks" },

  // Backend & Servers
  { pkg1: "express", pkg2: "fastify", category: "Backend Frameworks" },
  { pkg1: "express", pkg2: "koa", category: "Backend Frameworks" },
  { pkg1: "express", pkg2: "@nestjs/core", category: "Backend Frameworks" },
  { pkg1: "fastify", pkg2: "@nestjs/core", category: "Backend Frameworks" },
  { pkg1: "express", pkg2: "hono", category: "Backend Frameworks" },
  { pkg1: "fastify", pkg2: "hono", category: "Backend Frameworks" },
  { pkg1: "koa", pkg2: "fastify", category: "Backend Frameworks" },
  { pkg1: "express", pkg2: "polka", category: "Backend Frameworks" },

  // Package Managers & Runtimes
  { pkg1: "pnpm", pkg2: "npm", category: "Package Managers" },
  { pkg1: "npm", pkg2: "yarn", category: "Package Managers" },
  { pkg1: "pnpm", pkg2: "yarn", category: "Package Managers" },
  { pkg1: "bun", pkg2: "node", category: "Runtimes" },
  { pkg1: "deno", pkg2: "node", category: "Runtimes" },
  { pkg1: "pnpm", pkg2: "bun", category: "Package Managers" },

  // State Management
  { pkg1: "zustand", pkg2: "redux", category: "State Management" },
  { pkg1: "@reduxjs/toolkit", pkg2: "zustand", category: "State Management" },
  { pkg1: "zustand", pkg2: "jotai", category: "State Management" },
  { pkg1: "mobx", pkg2: "zustand", category: "State Management" },
  { pkg1: "recoil", pkg2: "jotai", category: "State Management" },
  { pkg1: "pinia", pkg2: "vuex", category: "State Management" },
  { pkg1: "zustand", pkg2: "recoil", category: "State Management" },
  { pkg1: "valtio", pkg2: "zustand", category: "State Management" },

  // Data Fetching & Networking
  { pkg1: "@tanstack/react-query", pkg2: "swr", category: "Data Fetching" },
  { pkg1: "axios", pkg2: "ky", category: "HTTP Clients" },
  { pkg1: "axios", pkg2: "got", category: "HTTP Clients" },
  { pkg1: "axios", pkg2: "node-fetch", category: "HTTP Clients" },
  { pkg1: "@apollo/client", pkg2: "urql", category: "GraphQL Clients" },
  { pkg1: "@trpc/server", pkg2: "graphql", category: "API Frameworks" },

  // Validation & Schemas
  { pkg1: "zod", pkg2: "yup", category: "Validation" },
  { pkg1: "zod", pkg2: "joi", category: "Validation" },
  { pkg1: "valibot", pkg2: "zod", category: "Validation" },
  { pkg1: "yup", pkg2: "joi", category: "Validation" },
  { pkg1: "@sinclair/typebox", pkg2: "zod", category: "Validation" },
  { pkg1: "arktype", pkg2: "zod", category: "Validation" },

  // Databases & ORMs
  { pkg1: "prisma", pkg2: "drizzle-orm", category: "Databases & ORMs" },
  { pkg1: "@prisma/client", pkg2: "drizzle-orm", category: "Databases & ORMs" },
  { pkg1: "typeorm", pkg2: "prisma", category: "Databases & ORMs" },
  { pkg1: "mongoose", pkg2: "prisma", category: "Databases & ORMs" },
  { pkg1: "drizzle-orm", pkg2: "kysely", category: "Databases & ORMs" },
  { pkg1: "sequelize", pkg2: "typeorm", category: "Databases & ORMs" },
  { pkg1: "knex", pkg2: "prisma", category: "Databases & ORMs" },
  { pkg1: "typeorm", pkg2: "drizzle-orm", category: "Databases & ORMs" },

  // Date & Time
  { pkg1: "dayjs", pkg2: "moment", category: "Date & Time" },
  { pkg1: "date-fns", pkg2: "dayjs", category: "Date & Time" },
  { pkg1: "moment", pkg2: "date-fns", category: "Date & Time" },
  { pkg1: "luxon", pkg2: "date-fns", category: "Date & Time" },
  { pkg1: "luxon", pkg2: "dayjs", category: "Date & Time" },

  // Utilities & Classnames
  { pkg1: "lodash", pkg2: "ramda", category: "Utilities" },
  { pkg1: "lodash", pkg2: "underscore", category: "Utilities" },
  { pkg1: "clsx", pkg2: "classnames", category: "Utilities" },
  { pkg1: "tailwind-merge", pkg2: "clsx", category: "Utilities" },
  { pkg1: "radash", pkg2: "lodash", category: "Utilities" },

  // Testing & Quality
  { pkg1: "jest", pkg2: "vitest", category: "Testing Frameworks" },
  { pkg1: "mocha", pkg2: "jest", category: "Testing Frameworks" },
  { pkg1: "cypress", pkg2: "playwright", category: "E2E Testing" },
  { pkg1: "playwright", pkg2: "puppeteer", category: "Browser Automation" },
  { pkg1: "vitest", pkg2: "mocha", category: "Testing Frameworks" },
  { pkg1: "@testing-library/react", pkg2: "enzyme", category: "Component Testing" },

  // Linters & Formatters
  { pkg1: "eslint", pkg2: "prettier", category: "Code Quality" },
  { pkg1: "@biomejs/biome", pkg2: "prettier", category: "Code Quality" },
  { pkg1: "@biomejs/biome", pkg2: "eslint", category: "Code Quality" },
  { pkg1: "tslint", pkg2: "eslint", category: "Code Quality" },
  { pkg1: "oxlint", pkg2: "eslint", category: "Code Quality" },

  // Styling & CSS
  { pkg1: "tailwindcss", pkg2: "styled-components", category: "Styling" },
  { pkg1: "styled-components", pkg2: "@emotion/react", category: "Styling" },
  { pkg1: "sass", pkg2: "less", category: "CSS Preprocessors" },
  { pkg1: "postcss", pkg2: "sass", category: "CSS Tooling" },
  { pkg1: "@vanilla-extract/css", pkg2: "styled-components", category: "Styling" },

  // Bundlers & Build Tools
  { pkg1: "vite", pkg2: "webpack", category: "Build Tools" },
  { pkg1: "esbuild", pkg2: "webpack", category: "Build Tools" },
  { pkg1: "rollup", pkg2: "webpack", category: "Build Tools" },
  { pkg1: "tsup", pkg2: "rollup", category: "Build Tools" },
  { pkg1: "turbopack", pkg2: "webpack", category: "Build Tools" },
  { pkg1: "parcel", pkg2: "webpack", category: "Build Tools" },

  // AI & Machine Learning SDKs
  { pkg1: "@google/genai", pkg2: "openai", category: "AI & LLM SDKs" },
  { pkg1: "openai", pkg2: "@anthropic-ai/sdk", category: "AI & LLM SDKs" },
  { pkg1: "@google/genai", pkg2: "@anthropic-ai/sdk", category: "AI & LLM SDKs" },
  { pkg1: "langchain", pkg2: "llamaindex", category: "AI Frameworks" },
  { pkg1: "ollama", pkg2: "openai", category: "AI SDKs" },
  { pkg1: "ai", pkg2: "langchain", category: "AI Frameworks" },

  // Auth & Security
  { pkg1: "next-auth", pkg2: "@clerk/nextjs", category: "Authentication" },
  { pkg1: "jsonwebtoken", pkg2: "jose", category: "Cryptography & JWT" },
  { pkg1: "bcrypt", pkg2: "argon2", category: "Hashing" },
  { pkg1: "helmet", pkg2: "cors", category: "Security Middleware" },
  { pkg1: "lucia", pkg2: "next-auth", category: "Authentication" },

  // Animation & 3D
  { pkg1: "framer-motion", pkg2: "gsap", category: "Animation" },
  { pkg1: "three", pkg2: "@react-three/fiber", category: "3D & Graphics" },
  { pkg1: "animejs", pkg2: "gsap", category: "Animation" },

  // TypeScript & Types
  { pkg1: "typescript", pkg2: "flow-bin", category: "Type Checkers" },
  { pkg1: "@types/node", pkg2: "typescript", category: "TypeScript Tooling" },
  { pkg1: "ts-node", pkg2: "tsx", category: "TypeScript Runtimes" },
  { pkg1: "zod", pkg2: "typescript", category: "Type Utilities" },
];

export function getComparisonSlug(pkg1: string, pkg2: string): string {
  return `${pkg1}-vs-${pkg2}`;
}

export function parseComparisonSlug(
  rawSlug: string | string[]
): { pkg1: string; pkg2: string } | null {
  const full = Array.isArray(rawSlug) ? rawSlug.join("/") : String(rawSlug || "");
  const decoded = decodeURIComponent(full).trim().toLowerCase();

  // Split on '-vs-' (case-insensitive)
  const parts = decoded.split(/-vs-/i);
  if (parts.length !== 2) return null;

  const pkg1 = parts[0].trim();
  const pkg2 = parts[1].trim();

  if (!pkg1 || !pkg2 || pkg1 === pkg2) return null;

  return { pkg1, pkg2 };
}
