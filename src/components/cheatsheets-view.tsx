"use client";

import { useState } from "react";
import { 
  GitBranch, 
  Container, 
  Terminal, 
  Globe, 
  Regex, 
  Copy, 
  Check, 
  Search,
  BookOpen
} from "lucide-react";

interface CheatItem {
  cmd: string;
  desc: string;
  example?: string;
}

interface CategoryData {
  id: string;
  name: string;
  icon: any;
  items: CheatItem[];
}

const CHEATSHEETS: CategoryData[] = [
  {
    id: "git",
    name: "Git Version Control",
    icon: GitBranch,
    items: [
      { cmd: "git checkout -b <branch>", desc: "Create and switch to a new branch instantly." },
      { cmd: "git commit --amend --no-edit", desc: "Add staged changes to the last commit without changing message." },
      { cmd: "git reset --soft HEAD~1", desc: "Undo the last commit while keeping all changes in your working tree." },
      { cmd: "git stash push -m 'wip'", desc: "Stash uncommitted changes with a custom description label." },
      { cmd: "git stash pop", desc: "Restore the most recently stashed changes and remove from stash list." },
      { cmd: "git clean -fd", desc: "Forcefully remove all untracked files and directories." },
      { cmd: "git cherry-pick <commit-hash>", desc: "Apply the changes introduced by an existing commit to current branch." },
      { cmd: "git log --oneline --graph --all", desc: "Visual ascii tree of all branches and commit history." }
    ]
  },
  {
    id: "docker",
    name: "Docker & Containers",
    icon: Container,
    items: [
      { cmd: "docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'", desc: "List all containers in clean tabular formatting." },
      { cmd: "docker system prune -a --volumes", desc: "Clean up all unused containers, networks, images, and volumes." },
      { cmd: "docker exec -it <container> /bin/sh", desc: "Open an interactive shell inside a running container." },
      { cmd: "docker logs -f --tail 100 <container>", desc: "Stream logs in real-time starting from the last 100 lines." },
      { cmd: "docker compose up -d --build", desc: "Build images and start all services defined in docker-compose.yml in background." },
      { cmd: "docker compose down -v", desc: "Stop and remove all containers, networks, and persistent volumes." }
    ]
  },
  {
    id: "bash",
    name: "Linux & Bash Commands",
    icon: Terminal,
    items: [
      { cmd: "lsof -i :3000", desc: "Find which process is listening on port 3000." },
      { cmd: "kill -9 $(lsof -t -i:3000)", desc: "Force kill the process occupying port 3000 immediately." },
      { cmd: "grep -rnwi './src' -e 'TODO'", desc: "Recursively search for exact whole word 'TODO' in ./src with line numbers." },
      { cmd: "tar -czvf archive.tar.gz /path/to/folder", desc: "Compress a folder into a gzip tar archive." },
      { cmd: "tar -xzvf archive.tar.gz", desc: "Extract a compressed gzip tar archive." },
      { cmd: "chmod -R 755 /var/www", desc: "Recursively set standard web directory permissions (Owner: rwx, Others: rx)." },
      { cmd: "df -h", desc: "Check human-readable disk space usage across all mounted drives." },
      { cmd: "journalctl -u nginx.service -f", desc: "Follow systemd service logs live in terminal." }
    ]
  },
  {
    id: "http",
    name: "HTTP Status Codes",
    icon: Globe,
    items: [
      { cmd: "200 OK", desc: "Request succeeded. Standard response for successful HTTP requests." },
      { cmd: "201 Created", desc: "Request succeeded and led to the creation of a new resource (e.g. POST /users)." },
      { cmd: "204 No Content", desc: "Request succeeded, but no body is returned (typical for DELETE requests)." },
      { cmd: "301 Moved Permanently", desc: "Resource permanently moved to a new URI. Tells search engines to update links." },
      { cmd: "304 Not Modified", desc: "Client can use cached version; conditional GET indicated entity hasn't changed." },
      { cmd: "400 Bad Request", desc: "Server cannot process request due to client error (invalid syntax, bad payload)." },
      { cmd: "401 Unauthorized", desc: "Authentication required. Client lacks valid authentication credentials." },
      { cmd: "403 Forbidden", desc: "Server understands request but refuses to authorize it (insufficient permissions)." },
      { cmd: "404 Not Found", desc: "Requested resource could not be found on server." },
      { cmd: "429 Too Many Requests", desc: "User has sent too many requests in a given amount of time (rate limit exceeded)." },
      { cmd: "500 Internal Server Error", desc: "Generic server error; an unhandled exception occurred on the backend." },
      { cmd: "502 Bad Gateway", desc: "Server acting as gateway/proxy received an invalid response from upstream server." },
      { cmd: "503 Service Unavailable", desc: "Server is temporarily down or overloaded (e.g. maintenance window)." }
    ]
  },
  {
    id: "regex",
    name: "Regex Patterns & Quantifiers",
    icon: Regex,
    items: [
      { cmd: "^ and $", desc: "Anchors: ^ matches beginning of line, $ matches end of line." },
      { cmd: "\\b and \\B", desc: "Word boundary: \\b matches start/end of word, \\B matches non-boundary." },
      { cmd: "[a-zA-Z0-9_]", desc: "Character class: Matches letters, numbers, and underscore (equivalent to \\w)." },
      { cmd: "(?:...)", desc: "Non-capturing group: Groups expressions without creating a backreference." },
      { cmd: "(?=...)", desc: "Positive lookahead: Matches only if followed by specified pattern without including it." },
      { cmd: "(?!...)", desc: "Negative lookahead: Matches only if NOT followed by specified pattern." },
      { cmd: "+? and *?", desc: "Lazy quantifiers: Matches as few characters as possible instead of greedy matching." }
    ]
  }
];

export function CheatSheetsView() {
  const [activeTab, setActiveTab] = useState("git");
  const [query, setQuery] = useState("");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = async (cmd: string) => {
    await navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const currentCategory = CHEATSHEETS.find((c) => c.id === activeTab) || CHEATSHEETS[0];
  const filteredItems = currentCategory.items.filter(
    (item) =>
      item.cmd.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-field border border-line">
        <div className="flex flex-wrap items-center gap-1.5">
          {CHEATSHEETS.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveTab(cat.id);
                  setQuery("");
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent text-accent-fg shadow-sm font-bold"
                    : "bg-bg/60 text-muted hover:text-fg hover:bg-hover"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${currentCategory.name}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-bg border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
      </div>

      {/* Cheatsheet Grid */}
      <div className="grid gap-3">
        {filteredItems.map((item) => {
          const isCopied = copiedCmd === item.cmd;
          return (
            <div
              key={item.cmd}
              onClick={() => copyToClipboard(item.cmd)}
              className="group p-4 rounded-xl bg-card border border-line/70 hover:border-accent/40 hover:bg-hover/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer shadow-xs"
            >
              <div className="space-y-1 flex-1 pr-4">
                <code className="font-mono text-xs font-bold text-accent group-hover:underline">
                  {item.cmd}
                </code>
                <p className="text-xs text-muted leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <button
                type="button"
                aria-label="Copy snippet"
                className={`self-start sm:self-center px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                  isCopied
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    : "bg-field border-line text-muted group-hover:text-fg group-hover:border-accent/30"
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted text-sm">
            No commands matched your query "{query}".
          </div>
        )}
      </div>
    </div>
  );
}
