"use client";

import React, { useState } from "react";
import { Copy, Check, Sparkles, RefreshCw, Eye, Code, Terminal, Heart } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

const TECH_BADGES: { name: string; slug: string; color: string; logo: string }[] = [
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
  const [title, setTitle] = useState("Full-Stack Software Engineer & Open Source Enthusiast");
  const [about, setAbout] = useState(
    "Building high-performance web applications, developer tooling, and distributed systems. Passionate about TypeScript, Rust, and modern web architectures."
  );
  const [githubUser, setGithubUser] = useState("alexrivers");
  const [twitterUser, setTwitterUser] = useState("alexrivers");
  const [portfolioUrl, setPortfolioUrl] = useState("https://castov.com");
  const [currentWork, setCurrentWork] = useState("building next-gen developer tools");
  const [learning, setLearning] = useState("Distributed consensus & WebGPU");
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
  const [activeTab, setActiveTab] = useState<"preview" | "code">("code");
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
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code className="w-6 h-6 text-emerald-400" />
            GitHub Profile & Repo README Builder
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Build stunning, viral GitHub profiles with dynamic badges, live stats, and tech stacks in seconds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "code"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code className="w-3.5 h-3.5" /> Markdown
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-500/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy README.md"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-300 font-medium">Headline / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-300 font-medium">About Bio</label>
                <textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">GitHub & Socials</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium">GitHub Username</label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-300 font-medium">Twitter / X Handle</label>
                <input
                  type="text"
                  value={twitterUser}
                  onChange={(e) => setTwitterUser(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-300 font-medium">Website / Portfolio</label>
                <input
                  type="text"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Tech Badges Picker */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Skills & Tech Stack Badges</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {TECH_BADGES.map((b) => {
                const active = selectedTechs.includes(b.slug);
                return (
                  <button
                    key={b.slug}
                    onClick={() => toggleTech(b.slug)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/10"
                        : "bg-zinc-950/70 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {b.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget Options */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Card Theme & Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-300 font-medium">Stats Theme</label>
                <select
                  value={statsTheme}
                  onChange={(e) => setStatsTheme(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none"
                >
                  <option value="tokyonight">Tokyo Night</option>
                  <option value="radical">Radical</option>
                  <option value="dracula">Dracula</option>
                  <option value="dark">Classic Dark</option>
                  <option value="merko">Merko</option>
                </select>
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeStreaks}
                    onChange={(e) => setIncludeStreaks(e.target.checked)}
                    className="rounded border-zinc-700 text-emerald-600 focus:ring-0"
                  />
                  Streak Counter Card
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeWatermark}
                    onChange={(e) => setIncludeWatermark(e.target.checked)}
                    className="rounded border-zinc-700 text-emerald-600 focus:ring-0"
                  />
                  Castov Backlink (Free)
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview / Output */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
              <span className="text-xs font-bold tracking-wide text-zinc-400 uppercase">
                {activeTab === "code" ? "README.md (Raw Markdown)" : "Live Markdown Preview"}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Ready to paste in GitHub</span>
            </div>

            {activeTab === "code" ? (
              <textarea
                readOnly
                value={generateMarkdown()}
                className="w-full flex-1 min-h-[500px] p-4 bg-zinc-950 border border-zinc-800/80 rounded-xl font-mono text-xs text-emerald-400 focus:outline-none leading-relaxed select-all"
              />
            ) : (
              <div className="w-full flex-1 min-h-[500px] p-6 bg-zinc-950 border border-zinc-800/80 rounded-xl text-zinc-200 space-y-4 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white border-b border-zinc-800 pb-2">
                  Hi there, I'm {name} 👋
                </h1>
                <h3 className="text-lg font-semibold text-zinc-300">{title}</h3>
                <p className="text-sm text-zinc-400">{about}</p>
                <hr className="border-zinc-800" />
                <h4 className="text-md font-bold text-zinc-200">🛠️ Tech Stack & Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTechs.map((t) => {
                    const item = TECH_BADGES.find((b) => b.slug === t);
                    return item ? (
                      <span
                        key={t}
                        className="px-2.5 py-1 text-xs rounded font-bold uppercase"
                        style={{ backgroundColor: `#${item.color}`, color: "#fff" }}
                      >
                        {item.name}
                      </span>
                    ) : null;
                  })}
                </div>
                <hr className="border-zinc-800" />
                <h4 className="text-md font-bold text-zinc-200">📊 GitHub Stats</h4>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="text-xs font-mono text-zinc-400">
                    Live dynamic SVG card will render on GitHub:
                  </div>
                  <div className="text-xs text-emerald-400 font-mono">
                    https://github-readme-stats.vercel.app/api?username={githubUser}&theme={statsTheme}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
