import Link from "next/link";
import { TOOL_CATEGORIES, TOOLS, toolPath } from "@/content/tools";
import { ArrowRightIcon, CategoryIcon } from "./icons";

const CATEGORY_DESCRIPTIONS: Record<(typeof TOOL_CATEGORIES)[number], string> = {
  Timestamp: "Convert, validate, compare and work with Unix timestamps.",
  "Date & Duration": "Calculate differences, durations, and add or subtract time from a date.",
  "Time Zones": "Convert, compare and browse time across the world's time zones.",
  Developer: "ISO 8601, RFC 3339, cron and other formats developers work with daily.",
  Labs: "Experimental tools: WebRTC P2P mesh, steganography, AST parsing, and in-browser WebGL computing.",
};

const MAIN_CATEGORIES = TOOL_CATEGORIES.filter((c) => c !== "Labs");

/** Grouped tool listing used on the homepage and the /tools page, for visual consistency. */
export function CategorySection({ headingLevel = 2 }: { headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const SubHeading = headingLevel === 2 ? "h3" : "h4";
  const labsTools = TOOLS.filter((t) => t.category === "Labs");

  return (
    <div className="space-y-8">
      {/* Main Categories (2 columns) */}
      <div className="grid gap-5 sm:grid-cols-2">
        {MAIN_CATEGORIES.map((category) => {
          const tools = TOOLS.filter((t) => t.category === category);
          return (
            <div key={category} className="bg-card border border-line hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-field border border-line text-primary">
                  <CategoryIcon category={category} />
                </span>
                <div className="min-w-0">
                  <Heading className="text-xl font-bold text-fg tracking-tight">{category}</Heading>
                  <p className="text-sm font-semibold text-muted">{tools.length} tools</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted leading-relaxed">{CATEGORY_DESCRIPTIONS[category]}</p>
              <ul className="mt-6 space-y-1 border-t border-line pt-4">
                {tools.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={toolPath(t.slug)}
                      className="group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-fg hover:bg-hover hover:text-primary transition-colors"
                    >
                      <span className="truncate">{t.name}</span>
                      <ArrowRightIcon className="w-4 h-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Labs Section (Positioned Below Main Categories) */}
      <div className="bg-card/70 border border-primary/20 rounded-2xl p-6 md:p-8 transition-all duration-300 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
              <CategoryIcon category="Labs" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <Heading className="text-xl font-bold text-fg tracking-tight">Labs</Heading>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Experimental tools
                </span>
              </div>
              <p className="text-sm text-muted mt-1">{CATEGORY_DESCRIPTIONS.Labs}</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-muted self-start sm:self-center shrink-0">
            {labsTools.length} experimental tools
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {labsTools.map((t) => (
            <Link
              key={t.slug}
              href={toolPath(t.slug)}
              className="group p-4 rounded-xl bg-field/60 border border-line/60 hover:border-primary/40 hover:bg-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-fg group-hover:text-primary transition-colors truncate">
                    {t.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-card text-muted border border-line">
                    Lab
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {t.cardDescription}
                </p>
              </div>
              <div className="mt-3 text-xs text-primary font-medium flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                Open experiment <ArrowRightIcon className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
