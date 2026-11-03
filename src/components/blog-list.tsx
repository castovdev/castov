"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Tag, ArrowRight } from "lucide-react";
import type { BlogPost } from "@/content/blog";

interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
}

export function BlogList({ posts, categories }: BlogListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search & Category Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search across 100 engineering articles, tutorials, and security guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-card text-fg placeholder:text-muted/60 focus:outline-none focus:border-accent text-sm shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === "All"
                ? "bg-accent text-accent-fg shadow-sm"
                : "bg-card border border-line text-muted hover:text-fg hover:border-line-hover"
            }`}
          >
            All Categories ({posts.length})
          </button>
          {categories.map((cat) => {
            const count = posts.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-accent text-accent-fg shadow-sm"
                    : "bg-card border border-line text-muted hover:text-fg hover:border-line-hover"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-muted font-mono flex items-center justify-between border-b border-line pb-2">
        <span>Showing {filteredPosts.length} of {posts.length} articles</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-accent hover:underline cursor-pointer"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Grid of Articles */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredPosts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="card group flex flex-col justify-between p-5 rounded-2xl border border-line bg-card hover:border-accent transition-all duration-200 hover:shadow-md"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block text-[11px] font-mono font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted font-mono">
                  <Clock className="w-3 h-3" />
                  {post.readingMinutes} min read
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-fg group-hover:text-accent transition-colors line-clamp-2">
                {post.title}
              </h2>

              <p className="text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed">
                {post.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-[10px] text-muted/80 bg-subtle/50 px-1.5 py-0.5 rounded font-mono"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-xs font-semibold text-accent inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Read <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 border border-dashed border-line rounded-2xl p-6">
          <p className="text-sm text-muted">No articles matched your criteria.</p>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="mt-3 text-xs text-accent font-medium hover:underline"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
