import { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { CheatSheetsView } from "@/components/cheatsheets-view";
import { Breadcrumb } from "@/components/breadcrumb";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Developer Cheat Sheets – Git, Docker, Bash, HTTP & Regex | Castov",
    description: "Instant developer reference cheat sheets with one-click copy. Git commands, Docker lifecycle, Linux bash utilities, HTTP status codes, and Regex patterns.",
    path: "/cheatsheets"
  })
};

export default function CheatSheetsPage() {
  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <Breadcrumb
        path="/cheatsheets"
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Resources", href: "/guides" },
          { name: "Cheat Sheets" }
        ]}
      />

      <div className="mt-8 mb-12">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-semibold text-accent w-fit mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          <span>DEVELOPER REFERENCE HUB</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg mb-4">
          Developer <span className="bg-gradient-to-r from-accent to-emerald-400 bg-clip-text text-transparent">Cheat Sheets</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl leading-relaxed">
          Quick, reliable reference guides for modern software workflows. Click any command to copy it immediately to your clipboard.
        </p>
      </div>

      <CheatSheetsView />
    </div>
  );
}
