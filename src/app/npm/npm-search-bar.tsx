"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function NpmSearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().replace(/\/+$/, "").toLowerCase();
    if (clean) {
      const targetPath = clean.startsWith("@")
        ? `/npm/@${clean.slice(1).split("/").map(encodeURIComponent).join("/")}`
        : `/npm/${encodeURIComponent(clean)}`;
      router.push(targetPath);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 max-w-xl mx-auto flex items-center gap-2 bg-card border-2 border-border/80 focus-within:border-accent p-2 rounded-2xl shadow-xl transition-all"
    >
      <Search className="w-5 h-5 text-muted-fg ml-3 shrink-0" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search package (e.g. express, react, zod, @types/node)..."
        className="w-full bg-transparent px-3 py-2 text-fg placeholder:text-muted-fg outline-none font-mono text-sm"
        required
      />
      <button
        type="submit"
        className="btn btn-primary font-bold px-5 py-2.5 rounded-xl shrink-0"
      >
        Inspect
      </button>
    </form>
  );
}
