import type { ErrorFix } from "./error-fixes-registry";

/**
 * High-volume terminal errors developers copy-paste straight into Google.
 * Merged into ERROR_FIXES in error-fixes-registry.ts.
 */
export const TERMINAL_ERROR_FIXES: ErrorFix[] = [
  // T1. Node.js EADDRINUSE
  {
    slug: "node-eaddrinuse-port-already-in-use",
    name: "Node.js: Error listen EADDRINUSE: address already in use",
    title: "Fix 'Error: listen EADDRINUSE: address already in use :::3000' in Node.js, Next.js & Vite",
    summary: "Find and kill the process holding port 3000 (or any port) on macOS, Linux, and Windows, or start your dev server on another port.",
    category: "TypeScript & Node.js",
    errorMessage: "Error: listen EADDRINUSE: address already in use :::3000",
    rootCause: "Another process — usually a previous dev server that did not shut down, a zombie `node` process, or another app — is already bound to the port your server tries to listen on. Only one process can listen on a TCP port per interface.",
    brokenCode: `// ❌ Hard-coded port collides with a dev server still running in another terminal
app.listen(3000);`,
    fixedCode: `// ✅ Respect PORT and fail with a clear message
const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => console.log("Listening on " + port));
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port " + port + " is busy. Run: npx castov port " + port);
    process.exit(1);
  }
  throw err;
});`,
    diagnosticCommands: [
      "npx castov port 3000",
      "lsof -i :3000",
      "netstat -ano | findstr :3000",
    ],
    configVariables: [
      { key: "port", label: "Busy Port", defaultValue: "3000", placeholder: "e.g. 3000, 5173, 8080" },
    ],
    generateCustomSolution: (vars) => {
      const p = vars.port || "3000";
      return `# 1. See which process owns port ${p}
npx castov port ${p}

# 2a. macOS / Linux: kill it
kill -9 $(lsof -t -i:${p})

# 2b. Windows (PowerShell): kill it
Stop-Process -Id (Get-NetTCPConnection -LocalPort ${p}).OwningProcess -Force

# 3. Or simply start on another port
PORT=${Number(p) + 1} npm run dev      # Next.js / Express
npx vite --port ${Number(p) + 1}       # Vite`;
    },
    faqs: [
      { q: "Why does EADDRINUSE happen after I close VS Code?", a: "The integrated terminal can leave a detached `node` process running. Kill it by port (`npx castov port 3000` shows the PID) instead of hunting through Task Manager." },
      { q: "What does ':::3000' mean in the error?", a: "`::` is the IPv6 unspecified address (all interfaces). Node binds to it by default, so the port is busy on every interface." },
    ],
    relatedSlugs: ["docker-bind-address-already-in-use", "node-econnrefused-ipv6-localhost", "ollama-port-11434-connection-refused-docker"],
  },

  // T2. Cannot connect to the Docker daemon
  {
    slug: "docker-cannot-connect-to-docker-daemon",
    name: "Docker: Cannot connect to the Docker daemon at unix:///var/run/docker.sock",
    title: "Fix 'Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?'",
    summary: "Start the Docker daemon, fix docker.sock permissions, or switch to the right Docker context on Linux, macOS, WSL2 and CI runners.",
    category: "DevOps & Docker",
    errorMessage: "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?",
    rootCause: "The Docker CLI talks to the daemon (dockerd) through a Unix socket. The error appears when the daemon is stopped, Docker Desktop is not running, your user lacks permission on `/var/run/docker.sock`, or the CLI points to a stale Docker context.",
    brokenCode: `# ❌ Daemon not running or user not in the docker group
docker ps`,
    fixedCode: `# ✅ Start the daemon and allow your user to use the socket
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
docker ps`,
    diagnosticCommands: [
      "systemctl status docker",
      "ls -l /var/run/docker.sock",
      "docker context ls",
    ],
    configVariables: [
      { key: "context", label: "Docker Context", defaultValue: "default", placeholder: "e.g. default, desktop-linux, colima" },
    ],
    generateCustomSolution: (vars) => {
      const ctx = vars.context || "default";
      return `# Linux: start the daemon
sudo systemctl start docker

# Permission denied on docker.sock? add yourself to the docker group
sudo usermod -aG docker $USER && newgrp docker

# macOS / Windows: open Docker Desktop (or: colima start)

# Wrong context? switch to "${ctx}"
docker context use ${ctx}
docker info`;
    },
    faqs: [
      { q: "Is adding my user to the docker group safe?", a: "It grants root-equivalent access to the host. It is fine on a personal dev machine; on shared servers prefer rootless Docker or sudo." },
      { q: "Why does this happen inside WSL2?", a: "Docker Desktop's WSL integration is disabled for your distro. Enable it in Docker Desktop → Settings → Resources → WSL Integration." },
    ],
    relatedSlugs: ["docker-bind-address-already-in-use", "docker-no-space-left-on-device", "docker-exec-format-error-platform-mismatch"],
  },

  // T3. git failed to push some refs
  {
    slug: "git-error-failed-to-push-some-refs",
    name: "Git: error: failed to push some refs to origin",
    title: "Fix Git 'error: failed to push some refs to' (Updates were rejected because the remote contains work)",
    summary: "Resolve rejected pushes caused by remote commits you do not have locally, protected branches, or secret-scanning push protection.",
    category: "Git & Version Control",
    errorMessage: "! [rejected] main -> main (fetch first)\nerror: failed to push some refs to 'github.com:user/repo.git'",
    rootCause: "The remote branch has commits your local branch does not contain (someone else pushed, or you edited on GitHub), so a fast-forward push is impossible. It can also be triggered by branch protection rules or GitHub push protection detecting a secret.",
    brokenCode: `# ❌ Local main is behind origin/main
git push origin main`,
    fixedCode: `# ✅ Integrate remote work first, then push
git pull --rebase origin main
git push origin main`,
    diagnosticCommands: [
      "git fetch origin && git status",
      "git log --oneline HEAD..origin/main",
      "npx castov scan .",
    ],
    configVariables: [
      { key: "branch", label: "Branch", defaultValue: "main", placeholder: "e.g. main, develop" },
    ],
    generateCustomSolution: (vars) => {
      const b = vars.branch || "main";
      return `# See what the remote has that you don't
git fetch origin
git log --oneline HEAD..origin/${b}

# Rebase your commits on top and push
git pull --rebase origin ${b}
git push origin ${b}

# Only if you intentionally rewrote history (never on shared branches):
git push --force-with-lease origin ${b}`;
    },
    faqs: [
      { q: "Should I use git push --force?", a: "Use `--force-with-lease` instead: it refuses to overwrite remote commits you have not fetched, protecting teammates' work." },
      { q: "The push is rejected with GH013 even after pulling. Why?", a: "GitHub push protection found a secret in your commits. Remove it from history and rotate the key — scan locally first with `npx castov scan .`." },
    ],
    relatedSlugs: ["github-push-protection-gh013-secret-detected", "git-fatal-refusing-to-merge-unrelated-histories", "git-fatal-not-a-git-repository"],
  },

  // T4. fatal: not a git repository
  {
    slug: "git-fatal-not-a-git-repository",
    name: "Git: fatal: not a git repository (or any of the parent directories): .git",
    title: "Fix 'fatal: not a git repository (or any of the parent directories): .git'",
    summary: "Run Git from the right folder, initialize a repository, or repair a missing/corrupted .git directory and safe.directory ownership checks.",
    category: "Git & Version Control",
    errorMessage: "fatal: not a git repository (or any of the parent directories): .git",
    rootCause: "Git searches the current directory and its parents for a `.git` folder. The error means you are outside the project folder, the repository was never initialized, the `.git` directory was deleted, or (in CI/Docker) the checkout step did not run.",
    brokenCode: `# ❌ Running git in the home directory instead of the project
cd ~
git status`,
    fixedCode: `# ✅ Move into the project, or initialize a new repository
cd ~/projects/my-app
git status

# New project:
git init && git add . && git commit -m "Initial commit"`,
    diagnosticCommands: [
      "pwd",
      "ls -la | grep .git",
      "git rev-parse --show-toplevel",
    ],
    configVariables: [
      { key: "remote", label: "Remote URL", defaultValue: "git@github.com:user/repo.git", placeholder: "e.g. https://github.com/user/repo.git" },
    ],
    generateCustomSolution: (vars) => {
      const r = vars.remote || "git@github.com:user/repo.git";
      return `# Option A: you are in the wrong folder
cd /path/to/your/project && git status

# Option B: initialize and connect to the remote
git init
git remote add origin ${r}
git fetch origin
git checkout -b main --track origin/main

# Option C: CI / Docker - make sure the checkout step runs (actions/checkout@v4)
# and that .git is not excluded by .dockerignore`;
    },
    faqs: [
      { q: "Why does this happen inside a Docker build?", a: "`.git` is usually listed in `.dockerignore`, so it is not copied into the image. Pass the commit SHA as a build arg instead of running git inside the build." },
    ],
    relatedSlugs: ["git-error-failed-to-push-some-refs", "git-detached-head-state", "git-fatal-refusing-to-merge-unrelated-histories"],
  },

  // T5. npm EACCES global install
  {
    slug: "npm-eacces-permission-denied-global-install",
    name: "npm ERR! code EACCES: permission denied, mkdir '/usr/local/lib/node_modules'",
    title: "Fix 'npm ERR! code EACCES permission denied' When Installing Global Packages (Without sudo)",
    summary: "Stop using sudo npm. Reconfigure npm's global prefix or use a Node version manager so global installs and npx work without root.",
    category: "TypeScript & Node.js",
    errorMessage: "npm ERR! code EACCES\nnpm ERR! syscall mkdir\nnpm ERR! path /usr/local/lib/node_modules\nnpm ERR! Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/castov'",
    rootCause: "Node was installed system-wide (via a package manager or installer), so npm's global prefix points to a root-owned directory. Your regular user cannot write there, and running `sudo npm` creates root-owned files that cause more errors later.",
    brokenCode: `# ❌ Using sudo creates root-owned cache files
sudo npm install -g castov`,
    fixedCode: `# ✅ Option 1: no global install needed at all
npx castov@latest

# ✅ Option 2: user-owned global prefix
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g castov`,
    diagnosticCommands: [
      "npm config get prefix",
      "ls -ld $(npm config get prefix)/lib/node_modules",
      "sudo chown -R $(whoami) ~/.npm",
    ],
    configVariables: [
      { key: "pkg", label: "Global Package", defaultValue: "castov", placeholder: "e.g. typescript, pnpm" },
    ],
    generateCustomSolution: (vars) => {
      const pkg = vars.pkg || "castov";
      return `# Fix root-owned npm cache left by earlier sudo installs
sudo chown -R $(whoami) ~/.npm

# Recommended: install Node with a version manager (nvm / fnm)
curl -fsSL https://fnm.vercel.app/install | bash
fnm install --lts

# Then global installs work without sudo
npm install -g ${pkg}`;
    },
    faqs: [
      { q: "Is sudo npm install -g ever OK?", a: "Avoid it. npm runs package install scripts as root, which is a security risk, and it leaves root-owned files in ~/.npm that break future installs." },
    ],
    relatedSlugs: ["npm-eresolve-unable-to-resolve-dependency-tree", "node-gyp-rebuild-failed", "node-err-module-not-found-esm"],
  },

  // T6. ERR_MODULE_NOT_FOUND (ESM)
  {
    slug: "node-err-module-not-found-esm",
    name: "Node.js: Error [ERR_MODULE_NOT_FOUND]: Cannot find module",
    title: "Fix Node.js 'Error [ERR_MODULE_NOT_FOUND]: Cannot find module' in ES Modules",
    summary: "Fix ESM import resolution: add .js extensions to relative imports, install missing packages, and align \"type\": \"module\" with your TypeScript output.",
    category: "TypeScript & Node.js",
    errorMessage: "Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/dist/utils' imported from /app/dist/index.js",
    rootCause: "Native ES modules in Node.js do not guess file extensions or index files. `import './utils'` works in bundlers and CommonJS but fails in ESM, which requires `./utils.js`. The same error appears when a dependency is not installed or `node_modules` is missing in the runtime image.",
    brokenCode: `// ❌ Extensionless relative import in an ESM package ("type": "module")
import { slugify } from "./utils";`,
    fixedCode: `// ✅ Include the runtime .js extension (works from .ts sources too)
import { slugify } from "./utils.js";

// tsconfig.json
// "module": "NodeNext", "moduleResolution": "NodeNext"`,
    diagnosticCommands: [
      "node -p \"require('./package.json').type\"",
      "npm ls --depth=0",
      "npx tsc --showConfig | grep -i module",
    ],
    configVariables: [
      { key: "file", label: "Imported File", defaultValue: "./utils", placeholder: "e.g. ./lib/db" },
    ],
    generateCustomSolution: (vars) => {
      const f = (vars.file || "./utils").replace(/\.(t|j)s$/, "");
      return `// Change:
import x from "${f}";
// To:
import x from "${f}.js";

// tsconfig.json for Node ESM projects
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}

# If the missing module is a package, reinstall dependencies:
rm -rf node_modules package-lock.json && npm install`;
    },
    faqs: [
      { q: "Why .js when my source file is .ts?", a: "TypeScript does not rewrite import paths. The import must match the emitted file name that Node loads at runtime, which is `.js`." },
    ],
    relatedSlugs: ["ts-cannot-find-module-or-type-declarations", "node-err-require-async-module-top-level-await", "vite-failed-to-resolve-import"],
  },

  // T7. pip externally-managed-environment
  {
    slug: "pip-externally-managed-environment",
    name: "pip: error: externally-managed-environment (PEP 668)",
    title: "Fix pip 'error: externally-managed-environment' on Ubuntu 24.04, Debian 12 & macOS Homebrew",
    summary: "Install Python packages safely with a virtual environment, pipx, or uv instead of fighting the system Python's PEP 668 protection.",
    category: "DevOps & Docker",
    errorMessage: "error: externally-managed-environment\n× This environment is externally managed\n╰─> To install Python packages system-wide, try apt install python3-xyz",
    rootCause: "Modern Linux distributions and Homebrew mark the system Python as externally managed (PEP 668). `pip install` into it is blocked to prevent breaking OS tools that depend on specific package versions.",
    brokenCode: `# ❌ Installing into the OS Python
pip install requests`,
    fixedCode: `# ✅ Use a virtual environment per project
python3 -m venv .venv
source .venv/bin/activate
pip install requests`,
    diagnosticCommands: [
      "python3 -m pip --version",
      "which python3",
      "python3 -c \"import sys; print(sys.prefix)\"",
    ],
    configVariables: [
      { key: "pkg", label: "Package", defaultValue: "requests", placeholder: "e.g. httpie, black" },
    ],
    generateCustomSolution: (vars) => {
      const pkg = vars.pkg || "requests";
      return `# Libraries for a project -> virtual environment
python3 -m venv .venv && source .venv/bin/activate
pip install ${pkg}

# CLI tools you want globally -> pipx
sudo apt install pipx && pipx ensurepath
pipx install ${pkg}

# Fastest option -> uv
curl -LsSf https://astral.sh/uv/install.sh | sh
uv venv && uv pip install ${pkg}`;
    },
    faqs: [
      { q: "Can I just use --break-system-packages?", a: "It works but can break apt-managed tools. Only use it inside throwaway Docker images, never on your workstation or servers." },
    ],
    relatedSlugs: ["docker-exec-format-error-platform-mismatch", "npm-eacces-permission-denied-global-install", "node-gyp-rebuild-failed"],
  },

  // T8. SSH host key verification failed
  {
    slug: "ssh-remote-host-identification-has-changed",
    name: "SSH: WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED! Host key verification failed",
    title: "Fix SSH 'WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED' and 'Host key verification failed'",
    summary: "Safely remove a stale host key from known_hosts after a server rebuild or IP reuse, and verify the new fingerprint before trusting it.",
    category: "Cloud & Security",
    errorMessage: "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nHost key verification failed.",
    rootCause: "The server presented a different host key than the one stored in `~/.ssh/known_hosts`. This is expected after reinstalling a VPS, rebuilding a container, or when a cloud provider reassigns an IP — but it is also exactly what a man-in-the-middle attack looks like.",
    brokenCode: `# ❌ Disabling host key checking globally hides real attacks
ssh -o StrictHostKeyChecking=no user@203.0.113.10`,
    fixedCode: `# ✅ Remove only the stale entry, then verify the new fingerprint
ssh-keygen -R 203.0.113.10
ssh user@203.0.113.10
# Compare the fingerprint shown with your provider's console output`,
    diagnosticCommands: [
      "ssh-keygen -F 203.0.113.10",
      "ssh-keyscan -t ed25519 203.0.113.10 | ssh-keygen -lf -",
    ],
    configVariables: [
      { key: "host", label: "Host / IP", defaultValue: "203.0.113.10", placeholder: "e.g. github.com, 10.0.0.5" },
    ],
    generateCustomSolution: (vars) => {
      const h = vars.host || "203.0.113.10";
      return `# 1. Remove the old key for ${h}
ssh-keygen -R ${h}

# 2. Fetch and print the new fingerprint BEFORE trusting it
ssh-keyscan -t ed25519 ${h} | ssh-keygen -lf -

# 3. If it matches your provider's console / docs, connect
ssh user@${h}`;
    },
    faqs: [
      { q: "Is it safe to just delete ~/.ssh/known_hosts?", a: "It works but throws away every trusted fingerprint. Use `ssh-keygen -R host` to remove only the changed one." },
    ],
    relatedSlugs: ["linux-permission-denied-publickey", "ssl-err-cert-authority-invalid", "git-error-failed-to-push-some-refs"],
  },

  // T9. ECONNREFUSED ::1 (Node 17+ localhost IPv6)
  {
    slug: "node-econnrefused-ipv6-localhost",
    name: "Node.js: connect ECONNREFUSED ::1:5432 (localhost resolves to IPv6)",
    title: "Fix 'connect ECONNREFUSED ::1' in Node.js 18+ When localhost Resolves to IPv6",
    summary: "Node.js 17+ no longer reorders DNS results to IPv4 first, so 'localhost' hits ::1 while your database only listens on 127.0.0.1.",
    category: "Network & HTTP",
    errorMessage: "Error: connect ECONNREFUSED ::1:5432\n    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)",
    rootCause: "Since Node.js 17, `dns.lookup` returns addresses in the order the OS provides (`verbatim`). On many systems `localhost` resolves to the IPv6 address `::1` first, but services like PostgreSQL, Redis, or a Docker-published port often listen only on IPv4 `127.0.0.1`.",
    brokenCode: `# ❌ localhost resolves to ::1, service listens on 127.0.0.1 only
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"`,
    fixedCode: `# ✅ Use the explicit IPv4 loopback address
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app"`,
    diagnosticCommands: [
      "npx castov port 5432",
      "node -e \"require('dns').lookup('localhost',{all:true},(e,a)=>console.log(a))\"",
    ],
    configVariables: [
      { key: "port", label: "Service Port", defaultValue: "5432", placeholder: "e.g. 5432, 6379, 3000" },
    ],
    generateCustomSolution: (vars) => {
      const p = vars.port || "5432";
      return `# Option 1: replace localhost with 127.0.0.1 in your connection string
HOST=127.0.0.1 PORT=${p}

# Option 2: prefer IPv4 for the whole Node process
NODE_OPTIONS="--dns-result-order=ipv4first" npm run dev

# Option 3: in code (Node 18+)
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

# Confirm what is actually listening on ${p}
npx castov port ${p}`;
    },
    faqs: [
      { q: "Why did this start after upgrading Node?", a: "Node 17 changed the default DNS result order from ipv4first to verbatim. Code that relied on localhost meaning 127.0.0.1 broke on IPv6-first systems." },
    ],
    relatedSlugs: ["node-eaddrinuse-port-already-in-use", "prisma-p1001-cant-reach-database-server", "ollama-port-11434-connection-refused-docker"],
  },

  // T10. node-gyp rebuild failed
  {
    slug: "node-gyp-rebuild-failed",
    name: "npm ERR! gyp ERR! build error / node-gyp rebuild failed",
    title: "Fix 'gyp ERR! build error' and 'node-gyp rebuild failed' (bcrypt, sharp, sqlite3, canvas)",
    summary: "Install the native build toolchain (Python, make, C++ compiler) or switch to prebuilt / pure-JS alternatives to stop node-gyp failures.",
    category: "TypeScript & Node.js",
    errorMessage: "gyp ERR! build error\ngyp ERR! stack Error: `make` failed with exit code: 2\nnpm ERR! code 1\nnpm ERR! command sh -c node-gyp rebuild",
    rootCause: "A dependency ships native C/C++ addons and no prebuilt binary matches your Node.js version, OS, or CPU architecture, so npm compiles it from source. Compilation fails when Python 3, make, or a C++ compiler is missing, or when the package does not support your Node major version yet.",
    brokenCode: `# ❌ Alpine image without build tools compiling bcrypt from source
FROM node:22-alpine
RUN npm install bcrypt`,
    fixedCode: `# ✅ Use a pure-JS alternative, or add the toolchain
# package.json: "bcryptjs" instead of "bcrypt"
FROM node:22-alpine
RUN apk add --no-cache python3 make g++
RUN npm ci`,
    diagnosticCommands: [
      "node -v && npm -v",
      "npm config get python",
      "npx node-gyp --version",
    ],
    configVariables: [
      { key: "os", label: "Operating System", defaultValue: "ubuntu", placeholder: "ubuntu, alpine, macos, windows" },
    ],
    generateCustomSolution: (vars) => {
      const os = (vars.os || "ubuntu").toLowerCase();
      const cmd =
        os === "alpine" ? "apk add --no-cache python3 make g++"
        : os === "macos" ? "xcode-select --install"
        : os === "windows" ? "winget install Microsoft.VisualStudio.2022.BuildTools  # select 'Desktop development with C++'"
        : "sudo apt-get install -y python3 make g++ build-essential";
      return `# Install the native toolchain for ${os}
${cmd}

# Clean and reinstall
rm -rf node_modules package-lock.json
npm install

# Prefer prebuilt / pure-JS packages when possible:
#   bcrypt  -> bcryptjs
#   sqlite3 -> better-sqlite3 (prebuilt) or node:sqlite (Node 22+)`;
    },
    faqs: [
      { q: "Why does it work locally but fail in Docker?", a: "Your machine has build tools and a prebuilt binary cache; slim/alpine images do not. Use a multi-stage build with the toolchain only in the build stage." },
    ],
    relatedSlugs: ["npm-eresolve-unable-to-resolve-dependency-tree", "docker-exec-format-error-platform-mismatch", "npm-eacces-permission-denied-global-install"],
  },

  // T11. docker-compose: command not found
  {
    slug: "docker-compose-command-not-found",
    name: "docker-compose: command not found (Compose V1 removed)",
    title: "Fix 'docker-compose: command not found' — Migrate to Docker Compose V2 (docker compose)",
    summary: "Compose V1 (docker-compose, Python) is end-of-life. Use the V2 plugin with 'docker compose' or install the compose plugin on Linux servers and CI.",
    category: "DevOps & Docker",
    errorMessage: "bash: docker-compose: command not found",
    rootCause: "Docker Compose V1 was a standalone Python binary named `docker-compose`. It reached end-of-life in 2023 and is no longer shipped. Compose V2 is a Docker CLI plugin invoked as `docker compose` (with a space).",
    brokenCode: `# ❌ Legacy V1 binary
docker-compose up -d`,
    fixedCode: `# ✅ Compose V2 plugin
docker compose up -d`,
    diagnosticCommands: [
      "docker compose version",
      "docker --version",
    ],
    configVariables: [
      { key: "file", label: "Compose File", defaultValue: "docker-compose.yml", placeholder: "e.g. compose.yaml" },
    ],
    generateCustomSolution: (vars) => {
      const f = vars.file || "docker-compose.yml";
      return `# Debian / Ubuntu: install the V2 plugin
sudo apt-get update && sudo apt-get install -y docker-compose-plugin
docker compose version

# Run your stack
docker compose -f ${f} up -d

# Keep old scripts working with an alias
echo 'alias docker-compose="docker compose"' >> ~/.bashrc`;
    },
    faqs: [
      { q: "Do I need to change my docker-compose.yml?", a: "No. V2 reads the same files. You can also delete the obsolete top-level `version:` key, which V2 ignores and warns about." },
    ],
    relatedSlugs: ["docker-compose-version-attribute-is-obsolete", "docker-cannot-connect-to-docker-daemon", "docker-bind-address-already-in-use"],
  },

  // T12. unable to get local issuer certificate
  {
    slug: "unable-to-get-local-issuer-certificate",
    name: "Error: unable to get local issuer certificate (UNABLE_TO_GET_ISSUER_CERT_LOCALLY)",
    title: "Fix 'unable to get local issuer certificate' in npm, Node.js, git and curl",
    summary: "Trust your corporate proxy or custom CA properly with NODE_EXTRA_CA_CERTS instead of disabling TLS verification.",
    category: "Cloud & Security",
    errorMessage: "npm ERR! code UNABLE_TO_GET_ISSUER_CERT_LOCALLY\nnpm ERR! request to https://registry.npmjs.org/ failed, reason: unable to get local issuer certificate",
    rootCause: "A TLS-inspecting corporate proxy, antivirus, or self-signed internal server re-signs HTTPS traffic with a root CA that Node.js, npm, git, or curl do not trust. Node.js uses its own bundled CA store, not the operating system's.",
    brokenCode: `# ❌ Disables certificate validation for everything (MITM risk)
npm config set strict-ssl false
export NODE_TLS_REJECT_UNAUTHORIZED=0`,
    fixedCode: `# ✅ Trust the specific corporate root CA
export NODE_EXTRA_CA_CERTS=/path/to/corp-root-ca.pem
npm config set cafile /path/to/corp-root-ca.pem
git config --global http.sslCAInfo /path/to/corp-root-ca.pem`,
    diagnosticCommands: [
      "openssl s_client -connect registry.npmjs.org:443 -showcerts </dev/null",
      "npm config get cafile",
      "node -e \"console.log(process.versions.openssl)\"",
    ],
    configVariables: [
      { key: "ca", label: "CA Certificate Path", defaultValue: "/etc/ssl/certs/corp-root-ca.pem", placeholder: "e.g. C:\\certs\\corp.pem" },
    ],
    generateCustomSolution: (vars) => {
      const ca = vars.ca || "/etc/ssl/certs/corp-root-ca.pem";
      return `# Node.js / npm / npx
export NODE_EXTRA_CA_CERTS="${ca}"
npm config set cafile "${ca}"

# git
git config --global http.sslCAInfo "${ca}"

# curl
curl --cacert "${ca}" https://registry.npmjs.org/

# Node 23.8+ can also use the OS trust store:
NODE_OPTIONS="--use-system-ca" npm install`;
    },
    faqs: [
      { q: "Where do I get the corporate CA file?", a: "Export it from your browser's certificate viewer (the top certificate in the chain on any HTTPS site) or ask IT for the proxy's root CA in PEM format." },
    ],
    relatedSlugs: ["ssl-err-cert-authority-invalid", "npm-eacces-permission-denied-global-install", "ssh-remote-host-identification-has-changed"],
  },

  // T13. Git LF will be replaced by CRLF
  {
    slug: "git-lf-will-be-replaced-by-crlf",
    name: "Git: warning: LF will be replaced by CRLF the next time Git touches it",
    title: "Fix Git 'warning: in the working copy of file, LF will be replaced by CRLF' on Windows",
    summary: "Normalize line endings for cross-platform teams with a .gitattributes file and the right core.autocrlf setting.",
    category: "Git & Version Control",
    errorMessage: "warning: in the working copy of 'src/app/page.tsx', LF will be replaced by CRLF the next time Git touches it",
    rootCause: "On Windows, `core.autocrlf=true` converts LF to CRLF on checkout. When a file with LF endings is staged, Git warns that it will rewrite the endings. Without a repository-level `.gitattributes`, every developer's local setting produces different diffs.",
    brokenCode: `# ❌ Line endings depend on each developer's machine settings
git add .`,
    fixedCode: `# ✅ .gitattributes - force LF in the repository for all text files
* text=auto eol=lf
*.bat text eol=crlf
*.ps1 text eol=crlf
*.png binary`,
    diagnosticCommands: [
      "git config --get core.autocrlf",
      "git ls-files --eol | head",
    ],
    configVariables: [
      { key: "eol", label: "Repository Line Ending", defaultValue: "lf", placeholder: "lf or crlf" },
    ],
    generateCustomSolution: (vars) => {
      const eol = (vars.eol || "lf").toLowerCase() === "crlf" ? "crlf" : "lf";
      return `# 1. Create .gitattributes at the repository root
echo "* text=auto eol=${eol}" > .gitattributes

# 2. Renormalize every tracked file once
git add --renormalize .
git commit -m "chore: normalize line endings to ${eol.toUpperCase()}"

# 3. (Windows) stop local conversion fighting the repo setting
git config --global core.autocrlf input`;
    },
    faqs: [
      { q: "Is the LF/CRLF warning dangerous?", a: "No, it is informational. But mixed line endings create noisy diffs and can break shell scripts in Linux containers, so normalizing is recommended." },
    ],
    relatedSlugs: ["git-fatal-not-a-git-repository", "git-error-failed-to-push-some-refs", "docker-exec-format-error-platform-mismatch"],
  },

  // T14. Next.js Module not found: Can't resolve 'fs'
  {
    slug: "nextjs-module-not-found-cant-resolve-fs",
    name: "Next.js: Module not found: Can't resolve 'fs'",
    title: "Fix Next.js 'Module not found: Can't resolve 'fs'' (and 'path', 'child_process', 'net')",
    summary: "Keep Node.js-only modules out of Client Components with 'server-only', Server Actions, or Route Handlers instead of webpack fallbacks.",
    category: "Next.js & React",
    errorMessage: "Module not found: Can't resolve 'fs'\nImport trace for requested module:\n./src/lib/read-config.ts\n./src/components/settings-panel.tsx",
    rootCause: "A file imported (directly or transitively) by a `\"use client\"` component uses a Node.js built-in like `fs`, `path`, or `child_process`. Browser bundles cannot include Node.js APIs, so the bundler fails to resolve them.",
    brokenCode: `// ❌ Client Component importing a module that uses fs
"use client";
import { readConfig } from "@/lib/read-config"; // uses fs.readFileSync`,
    fixedCode: `// ✅ Read on the server, pass plain data to the Client Component
// src/lib/read-config.ts
import "server-only";
import { readFileSync } from "node:fs";
export function readConfig() {
  return JSON.parse(readFileSync("config.json", "utf8"));
}

// src/app/settings/page.tsx (Server Component)
import { readConfig } from "@/lib/read-config";
import { SettingsPanel } from "@/components/settings-panel";
export default function Page() {
  return <SettingsPanel config={readConfig()} />;
}`,
    diagnosticCommands: [
      "npm run build",
      "npm install server-only",
    ],
    configVariables: [
      { key: "module", label: "Node Module", defaultValue: "fs", placeholder: "e.g. fs, path, child_process, net" },
    ],
    generateCustomSolution: (vars) => {
      const m = vars.module || "fs";
      return `// 1. Mark the module that uses '${m}' as server-only
import "server-only";
import * as nodeModule from "node:${m}";

// 2. Call it from a Server Component, Route Handler, or Server Action
//    and pass the serializable result to your "use client" component as props.

// 3. Find the client file that pulls it in - read the "Import trace" lines
//    in the build error from bottom (client component) to top (the '${m}' user).`;
    },
    faqs: [
      { q: "Should I add resolve.fallback { fs: false } to next.config?", a: "Only as a last resort for third-party packages that optionally require fs. For your own code it hides the real problem: server logic leaking into the client bundle." },
    ],
    relatedSlugs: ["nextjs-functions-cannot-be-passed-directly-to-client-components", "nextjs-hydration-failed", "nextjs-dynamic-server-usage"],
  },

  // T15. npm ERR! code ELIFECYCLE / exit status 1
  {
    slug: "npm-err-code-elifecycle-exit-status-1",
    name: "npm ERR! code ELIFECYCLE / npm ERR! errno 1",
    title: "Fix 'npm ERR! code ELIFECYCLE' and 'npm ERR! errno 1' (Script Exited With Status 1)",
    summary: "ELIFECYCLE is a wrapper error: find the real failure above it, then clear caches, reinstall dependencies, or fix the failing script.",
    category: "TypeScript & Node.js",
    errorMessage: "npm ERR! code ELIFECYCLE\nnpm ERR! errno 1\nnpm ERR! my-app@1.0.0 build: `next build`\nnpm ERR! Exit status 1",
    rootCause: "npm only reports that a package.json script (build, start, postinstall) exited with a non-zero code. The real cause — a TypeScript error, missing environment variable, out-of-memory crash, or corrupted node_modules — is printed in the lines above the npm ERR! block.",
    brokenCode: `# ❌ Reading only the last lines of the log
npm run build
# npm ERR! code ELIFECYCLE`,
    fixedCode: `# ✅ Scroll up to the first real error, then reinstall cleanly
npm run build 2>&1 | tee build.log
grep -n -i "error" build.log | head

rm -rf node_modules package-lock.json
npm cache verify
npm install`,
    diagnosticCommands: [
      "npm run build --verbose",
      "npm cache verify",
      "npx castov scan .",
    ],
    configVariables: [
      { key: "script", label: "Failing Script", defaultValue: "build", placeholder: "e.g. build, start, postinstall" },
    ],
    generateCustomSolution: (vars) => {
      const sc = vars.script || "build";
      return `# 1. Capture the full output of the failing script
npm run ${sc} --verbose 2>&1 | tee ${sc}.log

# 2. Look for the first real error (TS errors, missing env vars, OOM)
grep -n -i -E "error|cannot|not found|heap" ${sc}.log | head -20

# 3. Clean reinstall
rm -rf node_modules package-lock.json && npm install

# 4. Out of memory during ${sc}?
NODE_OPTIONS="--max-old-space-size=4096" npm run ${sc}`;
    },
    faqs: [
      { q: "Is ELIFECYCLE an npm bug?", a: "No. It just forwards the exit code of your script. Fix the error printed before it and ELIFECYCLE disappears." },
    ],
    relatedSlugs: ["node-heap-out-of-memory", "npm-eresolve-unable-to-resolve-dependency-tree", "node-gyp-rebuild-failed"],
  },
];
