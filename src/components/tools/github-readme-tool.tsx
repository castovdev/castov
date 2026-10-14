"use client";

import React, { useState } from "react";
import { Copy, Check, Eye, Code2, Sparkles, Wand2 } from "lucide-react";

const TECH_BADGES = [
  { name: "TypeScript", slug: "typescript", color: "3178C6", logo: "typescript" },
  { name: "JavaScript", slug: "javascript", color: "F7DF1E", logo: "javascript" },
  { name: "React", slug: "react", color: "20232A", logo: "react" },
  { name: "Next.js", slug: "nextjs", color: "000000", logo: "nextdotjs" },
  { name: "Node.js", slug: "nodejs", color: "339933", logo: "nodedotjs" },
  { name: "Python", slug: "python", color: "3776AB", logo: "python" },
  { name: "Go", slug: "go", color: "00ADD8", logo: "go" },
  { name: "Rust", slug: "rust", color: "000000", logo: "rust" },
  { name: "Tailwind CSS", slug: "tailwindcss", color: "06B6D4", logo: "tailwindcss" },
  { name: "PostgreSQL", slug: "postgres", color: "4169E1", logo: "postgresql" },
  { name: "Docker", slug: "docker", color: "2496ED", logo: "docker" },
  { name: "GraphQL", slug: "graphql", color: "E10098", logo: "graphql" },
  { name: "Git", slug: "git", color: "F05032", logo: "git" },
  { name: "AWS", slug: "aws", color: "232F3E", logo: "amazonwebservices" },
];

export function GithubReadmeTool() {
  const [name, setName] = useState("Alex Rivers");
  const [title, setTitle] = useState("Full-Stack Software Engineer & Open Source Builder");
  const [about, setAbout] = useState(
    "Building high-performance web applications, developer tooling, and distributed systems. Passionate about TypeScript, Rust, and modern web architectures."
  );
  const [githubUser, setGithubUser] = useState("alexrivers");
  const [twitterUser, setTwitterUser] = useState("alexrivers");
  const [portfolioUrl, setPortfolioUrl] = useState("https://castov.com");
  const currentWork = "building next-gen developer tools";
  const learning = "Distributed consensus & WebGPU";
  const [selectedTechs, setSelectedTechs] = useState<string[]>([
    "typescript",
    "react",
    "nextjs",
    "python",
    "tailwindcss",
    "docker",
  ]);
  const [statsTheme, setStatsTheme] = useState("tokyonight");
  const [includeStreaks, setIncludeStreaks] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [copied, setCopied] = useState(false);

  const toggleTech = (slug: string) => {
    setSelectedTechs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const generateMarkdown = () => {
    const techBadgesMd = selectedTechs
      .map((slug) => {
        const item = TECH_BADGES.find((b) => b.slug === slug);
        if (!item) return "";
        return `![${item.name}](https://img.shields.io/badge/${encodeURIComponent(
          item.name
        )}-${item.color}?style=for-the-badge&logo=${item.logo}&logoColor=white)`;
      })
      .filter(Boolean)
      .join(" ");

    return `# Hi there, I'm ${name} 👋

### ${title}

${about}

---

### 🚀 What I'm Up To
- 🔭 I’m currently working on **${currentWork}**
- 🌱 I’m currently learning **${learning}**
- 🌐 Explore my work: [${portfolioUrl}](${portfolioUrl})
- 💬 Connect with me on [Twitter/X](https://x.com/${twitterUser}) or [GitHub](https://github.com/${githubUser})

---

### 🛠️ Tech Stack & Skills
<p align="left">
  ${techBadgesMd}
</p>

---

### 📊 GitHub Activity & Stats
<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=${githubUser}&show_icons=true&theme=${statsTheme}&hide_border=true&count_private=true" alt="${name}'s GitHub Stats" />
  ${
    includeStreaks
      ? `\n  <br/>\n  <img src="https://github-readme-streak-stats.herokuapp.com/?user=${githubUser}&theme=${statsTheme}&hide_border=true" alt="${name}'s GitHub Streak" />`
      : ""
  }
</p>

---
${
  includeWatermark
    ? `\n<p align="center"><sub>Generated with ⚡ <a href="https://castov.com/github-readme-generator">Castov README Builder</a></sub></p>\n`
    : ""
}`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-field border border-line">
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-bg border border-line">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition ${
                activeTab === "code"
                  ? "bg-field text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Markdown Source
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition ${
                activeTab === "preview"
                  ? "bg-field text-fg shadow-sm"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Live Preview
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="btn bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-xs font-bold px-4 py-2 shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
          {copied ? "Copied Markdown!" : "Copy README.md"}
        </button>
      </div>

      {/* Main Grid Workspace */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Editor */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-field border border-line space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" /> Profile Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Full Name</label>
                <input
                  type="text"
                  aria-label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted block mb-1">Headline / Role</label>
                <input
                  type="text"
                  aria-label="Headline / Role"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted block mb-1">Bio Summary</label>
                <textarea
                  rows={3}
                  aria-label="Bio Summary"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-field border border-line space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-accent" /> Socials & Work
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">GitHub Username</label>
                <input
                  type="text"
                  aria-label="GitHub Username"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Twitter / X Handle</label>
                <input
                  type="text"
                  aria-label="Twitter / X Handle"
                  value={twitterUser}
                  onChange={(e) => setTwitterUser(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted block mb-1">Portfolio Website</label>
                <input
                  type="text"
                  aria-label="Portfolio Website"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-bg border border-line text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
            </div>
          </div>

          {/* Tech Badges Selector */}
          <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Tech Stack Badges</h2>
            <div className="flex flex-wrap gap-2">
              {TECH_BADGES.map((b) => {
                const active = selectedTechs.includes(b.slug);
                return (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => toggleTech(b.slug)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                      active
                        ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm"
                        : "bg-bg text-muted border-line hover:text-fg hover:border-muted/50"
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget Options */}
          <div className="p-6 rounded-2xl bg-field border border-line space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">Card Theme & Options</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Stats Theme</label>
                <select
                  aria-label="Stats Theme"
                  value={statsTheme}
                  onChange={(e) => setStatsTheme(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-bg border border-line text-fg focus:outline-none"
                >
                  <option value="tokyonight">Tokyo Night</option>
                  <option value="radical">Radical</option>
                  <option value="dracula">Dracula</option>
                  <option value="dark">Dark Theme</option>
                  <option value="merko">Merko Green</option>
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label="Streak Counter Card"
                    checked={includeStreaks}
                    onChange={(e) => setIncludeStreaks(e.target.checked)}
                    className="accent-accent"
                  />
                  Streak Counter Card
                </label>
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label="Castov Backlink (Free)"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="accent-accent"
                  />
                  Castov Backlink (Free)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <label className="text-xs font-semibold text-muted uppercase tracking-wider">
            {activeTab === "code" ? "Generated Markdown" : "Profile Render View"}
          </label>

          {activeTab === "code" ? (
            <textarea
              readOnly
              aria-label="Generated Markdown"
              value={generateMarkdown()}
              className="w-full min-h-[580px] p-5 font-mono text-xs leading-relaxed rounded-2xl bg-field border border-line text-fg focus:outline-none select-all resize-y"
            />
          ) : (
            <div className="w-full min-h-[580px] p-6 rounded-2xl bg-field border border-line text-fg space-y-5 overflow-y-auto">
              <h1 className="text-2xl font-bold border-b border-line pb-2">
                Hi there, I'm {name} 👋
              </h1>
              <h3 className="text-base font-semibold text-muted">{title}</h3>
              <p className="text-sm text-fg/80 leading-relaxed">{about}</p>
              <hr className="border-line" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted">🛠️ Tech Stack & Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTechs.map((t) => {
                  const item = TECH_BADGES.find((b) => b.slug === t);
                  return item ? (
                    <span
                      key={t}
                      className="px-2.5 py-1 text-xs rounded-md font-bold uppercase shadow-sm"
                      style={{ backgroundColor: `#${item.color}`, color: "#fff" }}
                    >
                      {item.name}
                    </span>
                  ) : null;
                })}
              </div>
              <hr className="border-line" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted">📊 GitHub Stats</h4>
              <div className="p-4 rounded-xl bg-bg border border-line flex flex-col items-center justify-center gap-2 text-center">
                <span className="text-xs text-muted">Dynamic SVG Cards live on GitHub:</span>
                <span className="text-xs text-accent font-mono">
                  https://github-readme-stats.vercel.app/api?username={githubUser}&theme={statsTheme}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
