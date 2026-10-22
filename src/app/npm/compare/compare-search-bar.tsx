"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRightLeft } from "lucide-react";
import { getComparisonSlug } from "@/lib/npm-comparisons";

export function CompareSearchBar() {
  const [pkg1, setPkg1] = useState("");
  const [pkg2, setPkg2] = useState("");
  const router = useRouter();

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    const clean1 = pkg1.trim().toLowerCase();
    const clean2 = pkg2.trim().toLowerCase();

    if (clean1 && clean2 && clean1 !== clean2) {
      const slug = getComparisonSlug(clean1, clean2);
      router.push(`/npm/compare/${slug}`);
    }
  };

  return (
    <form
      onSubmit={handleCompare}
      className="mt-8 max-w-2xl mx-auto bg-card border-2 border-border/80 focus-within:border-accent p-3 rounded-2xl shadow-xl transition-all"
    >
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-fg absolute left-3 top-3.5" />
          <input
            type="text"
            value={pkg1}
            onChange={(e) => setPkg1(e.target.value)}
            placeholder="Package 1 (e.g. react, express, @types/node)..."
            className="w-full bg-bg/50 border border-border/50 rounded-xl pl-9 pr-3 py-2.5 text-fg placeholder:text-muted-fg outline-none font-mono text-sm focus:border-accent"
            required
          />
        </div>

        <div className="p-1 rounded-full bg-muted/20 text-muted-fg shrink-0 hidden sm:block">
          <ArrowRightLeft className="w-4 h-4" />
        </div>

        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-fg absolute left-3 top-3.5" />
          <input
            type="text"
            value={pkg2}
            onChange={(e) => setPkg2(e.target.value)}
            placeholder="Package 2 (e.g. vue, fastify, typescript)..."
            className="w-full bg-bg/50 border border-border/50 rounded-xl pl-9 pr-3 py-2.5 text-fg placeholder:text-muted-fg outline-none font-mono text-sm focus:border-accent"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary font-bold px-6 py-2.5 rounded-xl shrink-0 w-full sm:w-auto"
        >
          Compare
        </button>
      </div>
    </form>
  );
}
