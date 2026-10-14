export interface ConfigVariable {
  key: string;
  label: string;
  defaultValue: string;
  placeholder: string;
}

export interface ErrorFix {
  slug: string;
  name: string;
  title: string;
  summary: string;
  category: "Next.js & React" | "Network & HTTP" | "DevOps & Docker" | "Database & ORM" | "TypeScript & Node.js" | "Git & Version Control" | "Cloud & Security";
  errorMessage: string;
  rootCause: string;
  brokenCode: string;
  fixedCode: string;
  diagnosticCommands: string[];
  configVariables: ConfigVariable[];
  generateCustomSolution: (vars: Record<string, string>) => string;
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const ERROR_FIXES: ErrorFix[] = [
  // 1. Next.js Hydration Failed
  {
    slug: "nextjs-hydration-failed",
    name: "Next.js Hydration Failed",
    title: "How to Fix 'Hydration failed because the initial UI does not match' in Next.js",
    summary: "Resolve Next.js React hydration mismatch errors caused by browser-only APIs (window, localStorage), timestamps, or invalid HTML nesting.",
    category: "Next.js & React",
    errorMessage: "Error: Hydration failed because the initial UI does not match what was rendered on the server.",
    rootCause: "The server renders HTML with one state (e.g., server timestamp or no window object), but the client immediately renders different HTML upon hydration (e.g. `Date.now()`, `window.innerWidth`, or `typeof window !== 'undefined'`). Also triggered by invalid HTML like placing a `<p>` inside another `<p>` or `<div>` inside `<p>`.",
    brokenCode: `// ❌ Broken: Server has no window/localStorage or different time
export default function UserWidget() {
  const theme = localStorage.getItem("theme");
  return <div>Current theme: {theme} (rendered at {new Date().toLocaleTimeString()})</div>;
}`,
    fixedCode: `// ✅ Fixed: Guard client-only state with useEffect or suppressHydrationWarning
"use client";
import { useState, useEffect } from "react";

export default function UserWidget() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    setTheme(localStorage.getItem("theme") || "light");
  }, []);

  return <div>Current theme: {theme ?? "loading..."}</div>;
}`,
    diagnosticCommands: [
      "npm run build",
      "npx @next/codemod@canary name-of-mod .",
    ],
    configVariables: [
      { key: "component", label: "Component Name", defaultValue: "ClientComponent", placeholder: "e.g. NavigationBar" },
      { key: "property", label: "Browser API / Property", defaultValue: "localStorage.getItem('user')", placeholder: "e.g. window.innerWidth" },
    ],
    generateCustomSolution: (vars) => {
      const comp = vars.component || "ClientComponent";
      const prop = vars.property || "localStorage.getItem('token')";
      return `"use client";
import { useState, useEffect } from "react";

export function ${comp}() {
  const [value, setValue] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setValue(${prop});
    } catch (e) {
      console.warn("Storage access restricted:", e);
    }
  }, []);

  if (!mounted) {
    // Render matching fallback on server & initial hydration pass
    return <div className="skeleton-loader animate-pulse" />;
  }

  return <div>Loaded value: {value}</div>;
}`;
    },
    faqs: [
      { q: "Can I use suppressHydrationWarning?", a: "Yes, for text elements where differences are benign (such as dynamic dates or localized timestamps), adding `suppressHydrationWarning` to the element silences the error." },
      { q: "Why does invalid HTML nesting trigger hydration failure?", a: "The browser's native HTML parser will auto-close or reposition invalid tags (like `<p><div></div></p>`), causing React's virtual DOM reconciliation to mismatch the browser DOM." },
    ],
    relatedSlugs: ["react-too-many-re-renders", "react-maximum-update-depth-exceeded", "nextjs-dynamic-server-usage"],
  },

  // 2. CORS Access-Control-Allow-Origin Missing
  {
    slug: "cors-access-control-allow-origin-missing",
    name: "CORS 'Access-Control-Allow-Origin' Missing",
    title: "Fix CORS Error: No 'Access-Control-Allow-Origin' Header is Present on the Requested Resource",
    summary: "Resolve browser cross-origin resource sharing errors by configuring backend HTTP headers and handling preflight OPTIONS requests.",
    category: "Network & HTTP",
    errorMessage: "Access to fetch at 'https://api.example.com' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.",
    rootCause: "The browser blocks client-side JavaScript requests to a different domain, port, or protocol unless the target server explicitly returns the `Access-Control-Allow-Origin` HTTP header responding to the origin and properly answers the preflight HTTP `OPTIONS` request.",
    brokenCode: `// ❌ Broken: Server doesn't send CORS headers or handle OPTIONS preflight
app.post('/api/data', (req, res) => {
  res.json({ success: true });
});`,
    fixedCode: `// ✅ Fixed: Handle OPTIONS preflight and send Access-Control headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});`,
    diagnosticCommands: [
      "curl -I -X OPTIONS -H \"Origin: http://localhost:3000\" -H \"Access-Control-Request-Method: POST\" https://api.example.com",
    ],
    configVariables: [
      { key: "origin", label: "Allowed Client Origin", defaultValue: "http://localhost:3000", placeholder: "e.g. https://myclient.com" },
      { key: "methods", label: "Allowed HTTP Methods", defaultValue: "GET, POST, PUT, DELETE, OPTIONS", placeholder: "e.g. GET, POST" },
    ],
    generateCustomSolution: (vars) => {
      const origin = vars.origin || "http://localhost:3000";
      const methods = vars.methods || "GET, POST, PUT, DELETE, OPTIONS";
      return `// Node.js / Express Middleware Solution
import cors from "cors";

const allowedOrigins = ["${origin}"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS blocked by server policy"));
    }
  },
  methods: [${methods.split(",").map(m => `"${m.trim()}"`).join(", ")}],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true
}));

// Or Next.js Route Handler headers:
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "${origin}",
      "Access-Control-Allow-Methods": "${methods}",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}`;
    },
    faqs: [
      { q: "Can I use wildcard `*` with credentials?", a: "No! Browsers explicitly reject `Access-Control-Allow-Origin: *` when `credentials: include` is sent." },
      { q: "Why does Postman or cURL work but my browser fails?", a: "CORS is a browser security mechanism; curl and Postman are not web browsers and do not enforce CORS." },
    ],
    relatedSlugs: ["fetch-typeerror-failed-to-fetch", "nginx-502-bad-gateway-upstream", "csp-refused-to-execute-inline-script"],
  },

  // 3. Docker Bind Address Already in Use
  {
    slug: "docker-bind-address-already-in-use",
    name: "Docker: Bind for 0.0.0.0:Port Failed",
    title: "Fix Docker Error: 'Bind for 0.0.0.0:port failed: address already in use'",
    summary: "Identify and terminate conflicting host processes or adjust Docker port mapping to resolve port bind collisions.",
    category: "DevOps & Docker",
    errorMessage: "Error response from daemon: driver failed programming external connectivity on endpoint web: Bind for 0.0.0.0:5432 failed: port is already allocated",
    rootCause: "A local service running on the host OS (such as local PostgreSQL, Nginx, Apache, or a previous unstopped Docker container) is already bound and listening to the requested host port.",
    brokenCode: `// ❌ Host port 5432 is already occupied by local postgres service
docker run -p 5432:5432 postgres:15`,
    fixedCode: `// ✅ Map to a different host port (e.g., 5433) or kill conflicting host process
docker run -p 5433:5432 postgres:15`,
    diagnosticCommands: [
      "lsof -i :5432 || netstat -ano | findstr :5432",
      "docker ps -a --filter \"publish=5432\"",
      "sudo systemctl stop postgresql",
    ],
    configVariables: [
      { key: "port", label: "Conflicting Host Port", defaultValue: "5432", placeholder: "e.g. 80, 3000, 5432" },
      { key: "newPort", label: "Alternative Host Port", defaultValue: "5433", placeholder: "e.g. 5433, 8080" },
      { key: "containerPort", label: "Container Internal Port", defaultValue: "5432", placeholder: "e.g. 5432" },
    ],
    generateCustomSolution: (vars) => {
      const port = vars.port || "5432";
      const newPort = vars.newPort || "5433";
      const cPort = vars.containerPort || "5432";
      return `# Step 1: Find which process is locking port ${port}
# Linux / macOS:
lsof -i :${port}
# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess

# Step 2: Stop existing Docker containers holding the port:
docker stop $(docker ps -q --filter "publish=${port}")

# Step 3: Or remap to non-conflicting host port ${newPort} in docker-compose.yml:
services:
  app:
    ports:
      - "${newPort}:${cPort}"`;
    },
    faqs: [
      { q: "Does changing the host port change the port inside the container?", a: "No. The container continues listening on its internal port; only the host entry point changes." },
    ],
    relatedSlugs: ["docker-no-space-left-on-device", "postgres-remaining-connection-slots-reserved", "nginx-502-bad-gateway-upstream"],
  },

  // 4. Postgres Remaining Connection Slots Reserved
  {
    slug: "postgres-remaining-connection-slots-reserved",
    name: "PostgreSQL: Remaining Connection Slots Reserved",
    title: "Fix PostgreSQL 'FATAL: remaining connection slots are reserved for non-replication superuser connections'",
    summary: "Resolve PostgreSQL connection exhaustion caused by connection leaks or missing pooling with PgBouncer / Prisma Accelerate.",
    category: "Database & ORM",
    errorMessage: "FATAL: remaining connection slots are reserved for non-replication superuser connections",
    rootCause: "Active database connections reached `max_connections` (default 100). Serverless functions or application instances without connection pooling leak idle connections until exhaustion.",
    brokenCode: `// ❌ Creating new PrismaClient / Pool instance on every API request
export async function GET() {
  const prisma = new PrismaClient(); // Leaks pool per invocation!
  const users = await prisma.user.findMany();
  return Response.json(users);
}`,
    fixedCode: `// ✅ Singleton pattern for Prisma Client or pooler URL
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;`,
    diagnosticCommands: [
      "SELECT count(*), state FROM pg_stat_activity GROUP BY state;",
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '5 minutes';",
      "SHOW max_connections;",
    ],
    configVariables: [
      { key: "maxConnections", label: "Max Connections", defaultValue: "200", placeholder: "e.g. 200" },
      { key: "poolTimeout", label: "Idle Pool Timeout", defaultValue: "30", placeholder: "e.g. 30s" },
    ],
    generateCustomSolution: (vars) => {
      const maxConn = vars.maxConnections || "200";
      return `# PostgreSQL Configuration Fix (postgresql.conf)
max_connections = ${maxConn}
shared_buffers = 512MB

# Terminal Emergency Unlock (Kill idle connections):
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND state = 'idle';"

# Recommended: Enable connection pooling in database URL:
# DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"`;
    },
    faqs: [
      { q: "Why is raising max_connections alone not recommended?", a: "Each PostgreSQL connection consumes ~10MB RAM. Excessive connections cause RAM thrashing. A connection pooler like PgBouncer is required for high concurrency." },
    ],
    relatedSlugs: ["prisma-p1001-cant-reach-database-server", "postgres-deadlock-detected", "sqlite-busy-database-is-locked"],
  },

  // 5. SQLite Busy Database is Locked
  {
    slug: "sqlite-busy-database-is-locked",
    name: "SQLite: Database is Locked (SQLITE_BUSY)",
    title: "Fix SQLite Error: 'SQLITE_BUSY: database is locked'",
    summary: "Resolve SQLite file lock contention during concurrent write transactions by enabling Write-Ahead Logging (WAL) and setting busy_timeout.",
    category: "Database & ORM",
    errorMessage: "SqliteError: database is locked (code 5, SQLITE_BUSY)",
    rootCause: "SQLite is a serverless single-file database. Standard rollback journal locks the entire database file during writes. Multiple concurrent processes trying to write simultaneously trigger SQLITE_BUSY.",
    brokenCode: `// ❌ Default journal mode blocks concurrent readers/writers
const db = new Database('data.db');
// No busy_timeout configured`,
    fixedCode: `// ✅ Enable WAL mode (concurrent readers + 1 writer) & set busy_timeout
const db = new Database('data.db');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000'); // wait up to 5000ms before erroring`,
    diagnosticCommands: [
      "sqlite3 data.db \"PRAGMA journal_mode;\"",
      "sqlite3 data.db \"PRAGMA journal_mode=WAL;\"",
      "sqlite3 data.db \"PRAGMA busy_timeout=5000;\"",
    ],
    configVariables: [
      { key: "timeout", label: "Busy Timeout (ms)", defaultValue: "5000", placeholder: "e.g. 5000" },
    ],
    generateCustomSolution: (vars) => {
      const timeout = vars.timeout || "5000";
      return `// Better-SQLite3 / Prisma SQLite WAL Configuration
import Database from 'better-sqlite3';

const db = new Database('app.db', { timeout: ${timeout} });

// 1. Enable Write-Ahead Logging for high concurrency
db.pragma('journal_mode = WAL');

// 2. Set retry timeout to prevent immediate lock exceptions
db.pragma('busy_timeout = ${timeout}');

// 3. Normal synchronous mode provides optimal performance with WAL
db.pragma('synchronous = NORMAL');`;
    },
    faqs: [
      { q: "What is WAL mode in SQLite?", a: "Write-Ahead Logging allows multiple readers to read concurrently while a writer writes to a separate `.db-wal` log file." },
    ],
    relatedSlugs: ["postgres-remaining-connection-slots-reserved", "prisma-p1001-cant-reach-database-server", "node-heap-out-of-memory"],
  },

  // 6. Node ERR_OSSL_EVP_UNSUPPORTED
  {
    slug: "node-err-ossl-evp-unsupported",
    name: "Node.js: ERR_OSSL_EVP_UNSUPPORTED",
    title: "Fix Node.js 'error:0308010C:digital envelope routines::unsupported'",
    summary: "Resolve OpenSSL 3.0 cryptographic deprecation errors in Node.js 17+ when running Webpack 4 or legacy build tools.",
    category: "TypeScript & Node.js",
    errorMessage: "Error: error:0308010C:digital envelope routines::unsupported (code: 'ERR_OSSL_EVP_UNSUPPORTED')",
    rootCause: "Node.js v17+ upgraded to OpenSSL 3.0, which deprecated legacy hashing algorithms (like MD4 used by older Webpack 4 plugins).",
    brokenCode: `// ❌ Running npm start on Node 18+ with Webpack 4 / React Scripts < 5
"scripts": {
  "start": "react-scripts start"
}`,
    fixedCode: `// ✅ Add --openssl-legacy-provider flag or upgrade react-scripts
"scripts": {
  "start": "react-scripts --openssl-legacy-provider start"
}`,
    diagnosticCommands: [
      "node -v",
      "export NODE_OPTIONS=--openssl-legacy-provider",
    ],
    configVariables: [
      { key: "script", label: "NPM Script Command", defaultValue: "npm run build", placeholder: "e.g. next build" },
    ],
    generateCustomSolution: (vars) => {
      const script = vars.script || "npm run build";
      return `# Option 1: Set environment variable before running
# Linux / macOS:
export NODE_OPTIONS=--openssl-legacy-provider
${script}

# Windows (PowerShell):
$env:NODE_OPTIONS="--openssl-legacy-provider"
${script}

# Option 2: Add cross-env to package.json
# npm install --save-dev cross-env
"scripts": {
  "build": "cross-env NODE_OPTIONS=--openssl-legacy-provider ${script}"
}`;
    },
    faqs: [
      { q: "Is --openssl-legacy-provider safe for production?", a: "It is safe as a temporary bridge, but upgrading Webpack / bundlers to modern versions using SHA-256 is the long-term solution." },
    ],
    relatedSlugs: ["webpack-module-parse-failed", "node-heap-out-of-memory", "ts-cannot-find-module-or-type-declarations"],
  },

  // 7. TS Cannot Find Module or Type Declarations
  {
    slug: "ts-cannot-find-module-or-type-declarations",
    name: "TS: Cannot find module or its type declarations",
    title: "Fix TypeScript Error TS2307: 'Cannot find module or its corresponding type declarations'",
    summary: "Resolve missing npm package types, misconfigured tsconfig path aliases, or missing declaration files.",
    category: "TypeScript & Node.js",
    errorMessage: "error TS2307: Cannot find module '@/components/Button' or its corresponding type declarations.",
    rootCause: "TypeScript cannot locate the module in node_modules, path mapping in `tsconfig.json` does not match the file structure, or `@types/<package>` is not installed.",
    brokenCode: `// ❌ tsconfig.json missing paths mapping
{
  "compilerOptions": {
    "baseUrl": "."
    // Missing "paths": { "@/*": ["./src/*"] }
  }
}`,
    fixedCode: `// ✅ Configure baseUrl and paths alias in tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`,
    diagnosticCommands: [
      "npm i --save-dev @types/node",
      "npx tsc --noEmit",
    ],
    configVariables: [
      { key: "moduleName", label: "Module / Package Name", defaultValue: "@/components/ui", placeholder: "e.g. lodash" },
      { key: "srcPath", label: "Source Directory", defaultValue: "./src/*", placeholder: "e.g. ./src/*" },
    ],
    generateCustomSolution: (vars) => {
      const mod = vars.moduleName || "package-name";
      return `# 1. If it is an external package lacking types:
npm install --save-dev @types/${mod.replace(/^@types\//, '')}

# 2. Or create a declaration file (src/types/declarations.d.ts):
declare module "${mod}" {
  const content: any;
  export default content;
}

# 3. If it is a path alias (@/*), update tsconfig.json:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["${vars.srcPath || "./src/*"}"]
    }
  }
}`;
    },
    faqs: [
      { q: "Why does Vite or Next.js resolve it but tsc fails?", a: "Bundlers have their own path alias resolution plugins. TypeScript CLI `tsc` relies strictly on `tsconfig.json`." },
    ],
    relatedSlugs: ["ts-object-is-possibly-undefined", "vite-failed-to-resolve-import", "webpack-module-parse-failed"],
  },

  // 8. Prisma P1001 Can't Reach Database Server
  {
    slug: "prisma-p1001-cant-reach-database-server",
    name: "Prisma Error P1001: Can't Reach Database",
    title: "Fix Prisma P1001: 'Can't reach database server at host:port'",
    summary: "Troubleshoot network connectivity, SSL certificates, wrong port mappings, and environment variable issues with Prisma ORM.",
    category: "Database & ORM",
    errorMessage: "PrismaClientInitializationError: Can't reach database server at `localhost`:`5432` (P1001)",
    rootCause: "Database container is not running, incorrect hostname (using `localhost` instead of Docker container name or `host.docker.internal`), or missing SSL flags (`sslmode=require`).",
    brokenCode: `// ❌ .env using localhost inside Docker or missing connection params
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"`,
    fixedCode: `// ✅ Use correct host name and connection timeout
DATABASE_URL="postgresql://postgres:postgres@db:5432/mydb?schema=public&connect_timeout=30"`,
    diagnosticCommands: [
      "nc -zv localhost 5432",
      "npx prisma db pull",
      "docker ps",
    ],
    configVariables: [
      { key: "dbHost", label: "Database Host", defaultValue: "db", placeholder: "e.g. localhost, db, aws-rds.com" },
      { key: "dbPort", label: "Database Port", defaultValue: "5432", placeholder: "e.g. 5432" },
      { key: "dbName", label: "Database Name", defaultValue: "production_db", placeholder: "e.g. mydb" },
    ],
    generateCustomSolution: (vars) => {
      return `# Test TCP port connection:
nc -zv ${vars.dbHost || "localhost"} ${vars.dbPort || "5432"}

# If using Docker Compose, ensure both services share the same network:
# services:
#   web:
#     environment:
#       - DATABASE_URL=postgresql://user:pass@${vars.dbHost || "db"}:${vars.dbPort || "5432"}/${vars.dbName || "mydb"}?schema=public
#     depends_on:
#       db:
#         condition: service_healthy`;
    },
    faqs: [
      { q: "How to connect from Docker container to host machine?", a: "On Linux/macOS/Windows, use `host.docker.internal` instead of `localhost`." },
    ],
    relatedSlugs: ["postgres-remaining-connection-slots-reserved", "docker-bind-address-already-in-use", "sqlite-busy-database-is-locked"],
  },

  // 9. JWT Malformed or JWT Expired
  {
    slug: "jwt-malformed-or-jwt-expired",
    name: "JWT Malformed / TokenExpiredError",
    title: "Fix JWT Error: 'JsonWebTokenError: jwt malformed' or 'jwt expired'",
    summary: "Handle authorization header parsing, Bearer prefix stripping, and token expiration gracefully.",
    category: "Cloud & Security",
    errorMessage: "JsonWebTokenError: jwt malformed",
    rootCause: "Passing the string `'Bearer <token>'` directly into `jwt.verify()` without splitting the `'Bearer '` prefix, passing an empty string, or using an expired token.",
    brokenCode: `// ❌ Broken: Passing raw header directly
const authHeader = req.headers['authorization'];
const decoded = jwt.verify(authHeader, SECRET); // Crash: includes "Bearer "!`,
    fixedCode: `// ✅ Fixed: Strip "Bearer " and catch expiration errors
const authHeader = req.headers['authorization'];
if (!authHeader?.startsWith("Bearer ")) {
  return res.status(401).json({ error: "Missing Bearer token" });
}

const token = authHeader.split(" ")[1];
try {
  const decoded = jwt.verify(token, SECRET);
} catch (err: any) {
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired, please refresh" });
  }
  return res.status(401).json({ error: "Invalid token" });
}`,
    diagnosticCommands: [
      "curl -H \"Authorization: Bearer <TOKEN>\" https://api.example.com",
    ],
    configVariables: [
      { key: "secretKey", label: "Secret Environment Variable", defaultValue: "process.env.JWT_SECRET", placeholder: "e.g. process.env.JWT_SECRET" },
    ],
    generateCustomSolution: (vars) => {
      return `import jwt from "jsonwebtoken";

export function authenticateToken(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED_MISSING_HEADER");
  }

  const token = authHeader.slice(7).trim();
  if (!token) throw new Error("UNAUTHORIZED_EMPTY_TOKEN");

  try {
    return jwt.verify(token, ${vars.secretKey || "process.env.JWT_SECRET"}!);
  } catch (error: any) {
    if (error.name === "TokenExpiredError") throw new Error("TOKEN_EXPIRED");
    throw new Error("TOKEN_INVALID");
  }
}`;
    },
    faqs: [
      { q: "What causes 'jwt malformed'?", a: "It occurs when the token doesn't contain two dots separating header, payload, and signature (not a valid 3-part Base64URL string)." },
    ],
    relatedSlugs: ["cors-access-control-allow-origin-missing", "nextjs-hydration-failed", "csp-refused-to-execute-inline-script"],
  },

  // 10. Nginx 502 Bad Gateway Upstream
  {
    slug: "nginx-502-bad-gateway-upstream",
    name: "Nginx 502 Bad Gateway",
    title: "Fix Nginx Error: '502 Bad Gateway' (Connection Refused to Upstream)",
    summary: "Resolve reverse proxy gateway errors when Nginx cannot establish a connection with Node.js, Next.js, or Gunicorn backends.",
    category: "Network & HTTP",
    errorMessage: "502 Bad Gateway: [error] connect() failed (111: Connection refused) while connecting to upstream",
    rootCause: "The backend server process (e.g. Next.js on port 3000) has crashed or stopped, is listening only on IPv6 (`::1`) while Nginx proxies to IPv4 (`127.0.0.1`), or firewall/SELinux blocks the proxy connection.",
    brokenCode: `// ❌ Nginx upstream pointing to dead port or IPv6 localhost
proxy_pass http://localhost:3000;`,
    fixedCode: `// ✅ Explicit 127.0.0.1 with Host and Upgrade proxy headers
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection 'upgrade';
  proxy_set_header Host $host;
  proxy_cache_bypass $http_upgrade;
}`,
    diagnosticCommands: [
      "sudo tail -f /var/log/nginx/error.log",
      "curl -I http://127.0.0.1:3000",
      "sudo nginx -t && sudo systemctl reload nginx",
    ],
    configVariables: [
      { key: "upstreamPort", label: "Backend App Port", defaultValue: "3000", placeholder: "e.g. 3000" },
      { key: "domain", label: "Server Domain Name", defaultValue: "api.example.com", placeholder: "e.g. castov.com" },
    ],
    generateCustomSolution: (vars) => {
      const port = vars.upstreamPort || "3000";
      const domain = vars.domain || "example.com";
      return `# /etc/nginx/sites-available/${domain}
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}`;
    },
    faqs: [
      { q: "Why use 127.0.0.1 instead of localhost in Nginx?", a: "`localhost` can resolve to IPv6 `::1` while Node.js might be bound to IPv4 `0.0.0.0`, resulting in immediate connection refusal." },
    ],
    relatedSlugs: ["nginx-413-request-entity-too-large", "cors-access-control-allow-origin-missing", "docker-bind-address-already-in-use"],
  },

  // 11. Nginx 413 Request Entity Too Large
  {
    slug: "nginx-413-request-entity-too-large",
    name: "Nginx 413 Request Entity Too Large",
    title: "Fix Nginx Error: '413 Request Entity Too Large' on File Uploads",
    summary: "Increase Nginx client_max_body_size and framework upload limits to allow large file and payload transfers.",
    category: "Network & HTTP",
    errorMessage: "413 Request Entity Too Large: client intended to send too large body",
    rootCause: "Nginx defaults to a 1MB max body limit (`client_max_body_size 1m`). Uploads exceeding 1MB are rejected before reaching application code.",
    brokenCode: `// ❌ Default Nginx config rejects files > 1MB
http {
  # client_max_body_size is 1m by default
}`,
    fixedCode: `// ✅ Set client_max_body_size in nginx.conf or server block
server {
  client_max_body_size 50M;
}`,
    diagnosticCommands: [
      "sudo nginx -t",
      "sudo systemctl reload nginx",
    ],
    configVariables: [
      { key: "maxSize", label: "Max Body Size", defaultValue: "50M", placeholder: "e.g. 50M, 100M" },
    ],
    generateCustomSolution: (vars) => {
      const size = vars.maxSize || "50M";
      return `# /etc/nginx/nginx.conf or /etc/nginx/conf.d/default.conf
http {
    client_max_body_size ${size};
    client_body_buffer_size 128k;
}

# Next.js Server Action / API Route Body Limit (next.config.js):
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '${size}',
    },
  },
};`;
    },
    faqs: [
      { q: "Do I also need to update my Node.js express/bodyParser limit?", a: "Yes. In Express, configure `app.use(express.json({ limit: '50mb' }))` to match Nginx." },
    ],
    relatedSlugs: ["nginx-502-bad-gateway-upstream", "cors-access-control-allow-origin-missing", "node-heap-out-of-memory"],
  },

  // 12. Git Fatal Refusing to Merge Unrelated Histories
  {
    slug: "git-fatal-refusing-to-merge-unrelated-histories",
    name: "Git: Refusing to merge unrelated histories",
    title: "Fix Git Error: 'fatal: refusing to merge unrelated histories'",
    summary: "Merge repositories initialized independently with different initial commits using --allow-unrelated-histories.",
    category: "Git & Version Control",
    errorMessage: "fatal: refusing to merge unrelated histories",
    rootCause: "Occurs when pulling from a remote repository that was initialized independently (e.g. with a README generated on GitHub) while having existing local commits.",
    brokenCode: `// ❌ Standard git pull fails
git pull origin main`,
    fixedCode: `// ✅ Add the allow unrelated histories flag
git pull origin main --allow-unrelated-histories`,
    diagnosticCommands: [
      "git log --oneline -n 3",
      "git status",
    ],
    configVariables: [
      { key: "branch", label: "Remote Branch Name", defaultValue: "main", placeholder: "e.g. main, master" },
    ],
    generateCustomSolution: (vars) => {
      const b = vars.branch || "main";
      return `# Run pull with unrelated histories enabled:
git pull origin ${b} --allow-unrelated-histories

# Resolve any merge conflicts, then commit:
git add .
git commit -m "Merge unrelated remote history"
git push origin ${b}`;
    },
    faqs: [
      { q: "Is it safe to run --allow-unrelated-histories?", a: "Yes, provided you review any conflicting files (like README.md or .gitignore) before finalizing the merge commit." },
    ],
    relatedSlugs: ["git-detached-head-state", "linux-permission-denied-publickey", "npm-eresolve-unable-to-resolve-dependency-tree"],
  },

  // 13. Git Detached HEAD State
  {
    slug: "git-detached-head-state",
    name: "Git: Detached HEAD State",
    title: "Fix Git 'You are in detached HEAD state' and Save Uncommitted Work",
    summary: "Safely create a new branch from a detached HEAD or return to your main branch without losing commits.",
    category: "Git & Version Control",
    errorMessage: "You are in 'detached HEAD' state. You can look around, make experimental changes and commit them...",
    rootCause: "You checked out a specific commit hash, tag, or remote branch directly rather than a local tracking branch.",
    brokenCode: `// ❌ Checked out commit hash directly
git checkout f21e094`,
    fixedCode: `// ✅ Create a new branch preserving your commits:
git switch -c my-saved-work`,
    diagnosticCommands: [
      "git status",
      "git log -n 1",
    ],
    configVariables: [
      { key: "newBranch", label: "New Branch Name", defaultValue: "recovered-branch", placeholder: "e.g. feature-fix" },
    ],
    generateCustomSolution: (vars) => {
      const b = vars.newBranch || "recovered-branch";
      return `# If you have commits you want to keep:
git switch -c ${b}

# If you just want to discard and return to main:
git switch main`;
    },
    faqs: [
      { q: "Will I lose my changes if I checkout main directly?", a: "Any commits made in detached HEAD will become orphaned. Creating a branch first preserves them permanently." },
    ],
    relatedSlugs: ["git-fatal-refusing-to-merge-unrelated-histories", "linux-permission-denied-publickey", "docker-bind-address-already-in-use"],
  },

  // 14. React Too Many Re-Renders
  {
    slug: "react-too-many-re-renders",
    name: "React: Too many re-renders",
    title: "Fix React Error: 'Too many re-renders. React limits the number of renders to prevent an infinite loop'",
    summary: "Prevent infinite re-render loops caused by immediately invoking setState functions inside JSX render bodies.",
    category: "Next.js & React",
    errorMessage: "Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.",
    rootCause: "Calling `setState()` directly inside the component body or passing `onClick={handleClick()}` (calling the function immediately upon render rather than passing a callback reference).",
    brokenCode: `// ❌ Broken: Invoking setCount() immediately during render
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={setCount(count + 1)}>Click</button>;
}`,
    fixedCode: `// ✅ Fixed: Pass an arrow function callback
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Click</button>;
}`,
    diagnosticCommands: [
      "npx eslint src/ --ext .tsx,.ts",
    ],
    configVariables: [
      { key: "stateName", label: "State Variable", defaultValue: "activeTab", placeholder: "e.g. count" },
    ],
    generateCustomSolution: (vars) => {
      const s = vars.stateName || "active";
      return `// Always wrap handlers in an arrow function:
// ❌ WRONG: onClick={set${s.charAt(0).toUpperCase() + s.slice(1)}(true)}
// ✅ CORRECT:
<button onClick={() => set${s.charAt(0).toUpperCase() + s.slice(1)}(true)}>
  Activate
</button>`;
    },
    faqs: [
      { q: "Can useEffect trigger this error?", a: "Yes! If a `useEffect` updates state `A`, and state `A` is listed in the effect's dependency array without an exit condition, an infinite loop occurs." },
    ],
    relatedSlugs: ["react-maximum-update-depth-exceeded", "nextjs-hydration-failed", "nextjs-dynamic-server-usage"],
  },

  // 15. React Maximum Update Depth Exceeded
  {
    slug: "react-maximum-update-depth-exceeded",
    name: "React: Maximum update depth exceeded",
    title: "Fix React 'Maximum update depth exceeded' in useEffect Loops",
    summary: "Break circular state dependency loops in useEffect and custom hooks.",
    category: "Next.js & React",
    errorMessage: "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate.",
    rootCause: "A `useEffect` hook triggers a state update, and that updated state or an unstable object reference is listed in the dependency array, causing the effect to run repeatedly forever.",
    brokenCode: `// ❌ Broken: Object recreated every render triggers effect loop
const options = { filter: category };
useEffect(() => {
  fetchData(options).then(setData);
}, [options]); // New object reference on every render!`,
    fixedCode: `// ✅ Fixed: Memoize object or depend only on primitive values
useEffect(() => {
  fetchData({ filter: category }).then(setData);
}, [category]); // Stable primitive dependency`,
    diagnosticCommands: [
      "npm test",
    ],
    configVariables: [
      { key: "dep", label: "Stable Dependency", defaultValue: "userId", placeholder: "e.g. query" },
    ],
    generateCustomSolution: (vars) => {
      const d = vars.dep || "userId";
      return `import { useEffect, useMemo } from "react";

// Option 1: Depend directly on primitive string/number:
useEffect(() => {
  fetchData(${d});
}, [${d}]);

// Option 2: Wrap objects in useMemo if required by sub-functions:
const options = useMemo(() => ({ id: ${d} }), [${d}]);`;
    },
    faqs: [
      { q: "Why do object dependencies cause re-render loops in React?", a: "In JavaScript, `{ a: 1 } !== { a: 1 }`. Every render creates a new memory reference, tricking React into thinking dependencies changed." },
    ],
    relatedSlugs: ["react-too-many-re-renders", "nextjs-hydration-failed", "ts-object-is-possibly-undefined"],
  },

  // 16. Node Heap Out of Memory
  {
    slug: "node-heap-out-of-memory",
    name: "Node.js: JavaScript heap out of memory",
    title: "Fix Node.js 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory'",
    summary: "Increase V8 memory allocation using --max-old-space-size and identify memory leaks during builds.",
    category: "TypeScript & Node.js",
    errorMessage: "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory",
    rootCause: "Node.js defaults to ~2GB to 4GB of RAM heap limit. Heavy builds (Next.js Turbopack, Webpack, large TypeScript ASTs) or unreleased object references exceed the default quota.",
    brokenCode: `// ❌ Large build runs out of memory under default 2GB limit
next build`,
    fixedCode: `// ✅ Allocate 8GB of memory to Node.js V8 engine
NODE_OPTIONS="--max-old-space-size=8192" next build`,
    diagnosticCommands: [
      "node -e 'console.log(v8.getHeapStatistics().heap_size_limit / 1024 / 1024)'",
    ],
    configVariables: [
      { key: "memoryMB", label: "Heap Size (MB)", defaultValue: "8192", placeholder: "e.g. 4096, 8192" },
    ],
    generateCustomSolution: (vars) => {
      const mem = vars.memoryMB || "8192";
      return `# Linux / macOS:
export NODE_OPTIONS="--max-old-space-size=${mem}"
npm run build

# Windows PowerShell:
$env:NODE_OPTIONS="--max-old-space-size=${mem}"
npm run build

# Add directly to package.json scripts:
"scripts": {
  "build": "cross-env NODE_OPTIONS=--max-old-space-size=${mem} next build"
}`;
    },
    faqs: [
      { q: "What is the recommended heap limit for Next.js builds on CI/CD?", a: "Setting 4096MB (4GB) or 8192MB (8GB) is standard on GitHub Actions / Vercel agents with sufficient host RAM." },
    ],
    relatedSlugs: ["node-err-ossl-evp-unsupported", "webpack-module-parse-failed", "docker-no-space-left-on-device"],
  },

  // 17. NPM ERESOLVE Unable to Resolve Dependency Tree
  {
    slug: "npm-eresolve-unable-to-resolve-dependency-tree",
    name: "NPM: ERESOLVE unable to resolve dependency tree",
    title: "Fix NPM Error: 'ERESOLVE unable to resolve dependency tree' (Peer Dependencies)",
    summary: "Resolve strict peer dependency conflicts in npm 7+ using --legacy-peer-deps or updating outdated packages.",
    category: "TypeScript & Node.js",
    errorMessage: "npm error code ERESOLVE\nnpm error ERESOLVE unable to resolve dependency tree",
    rootCause: "npm v7+ installs peer dependencies by default. If package A requires React 18, but package B requires React 19, npm halts with an ERESOLVE conflict.",
    brokenCode: `// ❌ Installing package with conflicting peer dependency
npm install react-calendar`,
    fixedCode: `// ✅ Install with --legacy-peer-deps or --force
npm install react-calendar --legacy-peer-deps`,
    diagnosticCommands: [
      "npm ls <package-name>",
      "npm install --legacy-peer-deps",
    ],
    configVariables: [
      { key: "pkg", label: "Package to Install", defaultValue: "package-name", placeholder: "e.g. lucide-react" },
    ],
    generateCustomSolution: (vars) => {
      const p = vars.pkg || "package-name";
      return `# Option 1: Temporary bypass (recommended for peer conflicts):
npm install ${p} --legacy-peer-deps

# Option 2: Persist in project (.npmrc file):
echo "legacy-peer-deps=true" >> .npmrc

# Option 3: Check conflicting dependency tree:
npm ls react`;
    },
    faqs: [
      { q: "What does --legacy-peer-deps do?", a: "It tells npm to ignore conflicting peerDependencies, adopting npm v4-v6 behavior." },
    ],
    relatedSlugs: ["ts-cannot-find-module-or-type-declarations", "node-err-ossl-evp-unsupported", "webpack-module-parse-failed"],
  },

  // 18. Docker No Space Left on Device
  {
    slug: "docker-no-space-left-on-device",
    name: "Docker: no space left on device",
    title: "Fix Docker Error: 'write /var/lib/docker/...: no space left on device'",
    summary: "Clean dangling Docker build caches, unused volumes, and stopped containers to free disk space.",
    category: "DevOps & Docker",
    errorMessage: "ERROR: failed to solve: failed to register layer: write /var/lib/docker/overlay2/...: no space left on device",
    rootCause: "Docker accumulated gigabytes of unpruned build cache, dangling intermediate image layers, stopped containers, and orphaned volumes.",
    brokenCode: `// ❌ Disk full from accumulated build artifacts
docker build -t app . // Fails with no space left`,
    fixedCode: `// ✅ Prune unused containers, networks, images, and build caches
docker system prune -a --volumes -f`,
    diagnosticCommands: [
      "docker system df",
      "df -h",
      "docker builder prune -a",
    ],
    configVariables: [],
    generateCustomSolution: () => {
      return `# Step 1: Inspect Docker disk usage:
docker system df

# Step 2: Prune build cache (often releases 20GB+):
docker builder prune -a -f

# Step 3: Complete purge of all unused containers, images, and volumes:
docker system prune --all --volumes -f

# Step 4: Check host disk space:
df -h`;
    },
    faqs: [
      { q: "Will docker system prune delete my active running database volumes?", a: "No, active volumes attached to currently running containers are preserved." },
    ],
    relatedSlugs: ["docker-bind-address-already-in-use", "node-heap-out-of-memory", "redis-misconf-rdb-snapshot-error"],
  },

  // 19. Redis MISCONF RDB Snapshot Error
  {
    slug: "redis-misconf-rdb-snapshot-error",
    name: "Redis: MISCONF Errors writing to RDB",
    title: "Fix Redis 'MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk'",
    summary: "Resolve Redis write-block when memory overcommit is disabled on Linux hosts.",
    category: "Database & ORM",
    errorMessage: "MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk. Commands that may modify the data set are disabled.",
    rootCause: "Linux kernel memory overcommit (`vm.overcommit_memory`) is set to 0. When Redis forks a background process to write the RDB file, the OS refuses the fork if available RAM is low.",
    brokenCode: `// ❌ Redis rejects writes when background snapshotting fails
redis-cli SET key value // Error: MISCONF...`,
    fixedCode: `// ✅ Set vm.overcommit_memory = 1 in host OS
sudo sysctl vm.overcommit_memory=1`,
    diagnosticCommands: [
      "sysctl vm.overcommit_memory",
      "redis-cli INFO persistence",
    ],
    configVariables: [],
    generateCustomSolution: () => {
      return `# Immediate temporary unlock in redis-cli:
redis-cli config set stop-writes-on-bgsave-error no

# Permanent host kernel fix:
sudo sysctl vm.overcommit_memory=1
echo "vm.overcommit_memory = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p`;
    },
    faqs: [
      { q: "Why does Redis need memory overcommit?", a: "Redis uses copy-on-write during `bgsave`. Without overcommit, the OS reserves equal virtual memory, failing even if actual physical memory is sufficient." },
    ],
    relatedSlugs: ["postgres-remaining-connection-slots-reserved", "sqlite-busy-database-is-locked", "docker-no-space-left-on-device"],
  },

  // 20. Webpack Module Parse Failed
  {
    slug: "webpack-module-parse-failed",
    name: "Webpack: Module parse failed",
    title: "Fix Webpack 'Module parse failed: Unexpected token. You may need an appropriate loader'",
    summary: "Configure appropriate loaders for TypeScript, JSX, CSS modules, or modern JavaScript syntax.",
    category: "TypeScript & Node.js",
    errorMessage: "Module parse failed: Unexpected token (10:2). You may need an appropriate loader to handle this file type...",
    rootCause: "Webpack encountered modern syntax (TS, JSX, optional chaining `?.`, nullish coalescing `??`) without the corresponding Babel / SWC loader configured in `webpack.config.js`.",
    brokenCode: `// ❌ Webpack config missing ts-loader or babel-loader for .tsx
module: {
  rules: [
    // missing rules for /\\.(ts|tsx)$/
  ]
}`,
    fixedCode: `// ✅ Add swc-loader or ts-loader to module rules
module: {
  rules: [
    {
      test: /\\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: "swc-loader"
      }
    }
  ]
}`,
    diagnosticCommands: [
      "npm ls webpack",
    ],
    configVariables: [
      { key: "extension", label: "File Extension", defaultValue: "tsx", placeholder: "e.g. tsx, jsx, svg" },
    ],
    generateCustomSolution: (vars) => {
      const ext = vars.extension || "tsx";
      return `// webpack.config.js rule configuration:
module.exports = {
  module: {
    rules: [
      {
        test: /\\.${ext}$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"]
          }
        }
      }
    ]
  }
};`;
    },
    faqs: [
      { q: "Why use SWC over Babel for Webpack?", a: "SWC is written in Rust and operates 20-50x faster than Babel." },
    ],
    relatedSlugs: ["node-err-ossl-evp-unsupported", "ts-cannot-find-module-or-type-declarations", "vite-failed-to-resolve-import"],
  },

  // 21. Fetch TypeError Failed to Fetch
  {
    slug: "fetch-typeerror-failed-to-fetch",
    name: "Fetch: TypeError: Failed to fetch",
    title: "Fix JavaScript 'TypeError: Failed to fetch' in Browser & Node.js",
    summary: "Diagnose network drops, CORS blocks, HTTPS certificate invalidity, and ad-blocker request cancellations.",
    category: "Network & HTTP",
    errorMessage: "TypeError: Failed to fetch (at window.fetch)",
    rootCause: "Generic browser error thrown when a network request fails before receiving an HTTP response: triggered by CORS preflight rejections, DNS resolution failures, offline network, or mixed content (HTTP on HTTPS).",
    brokenCode: `// ❌ Calling HTTP from HTTPS site or uncaught network failure
const res = await fetch("http://api.mysite.com/data");`,
    fixedCode: `// ✅ Use HTTPS, catch network errors, and inspect offline states
try {
  const res = await fetch("https://api.mysite.com/data");
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
} catch (err: any) {
  if (!navigator.onLine) console.error("Device is offline");
  else console.error("CORS or network error:", err.message);
}`,
    diagnosticCommands: [
      "curl -I https://api.mysite.com/data",
    ],
    configVariables: [
      { key: "apiUrl", label: "Target API URL", defaultValue: "https://api.example.com/v1", placeholder: "https://api.example.com" },
    ],
    generateCustomSolution: (vars) => {
      const url = vars.apiUrl || "https://api.example.com";
      return `async function safeFetch() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res = await fetch("${url}", {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error(\`Server returned \${res.status}\`);
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("Request timed out after 10s");
    } else {
      console.error("Network or CORS failure:", err.message);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}`;
    },
    faqs: [
      { q: "Why doesn't fetch reject on 404 or 500 status?", a: "Fetch only rejects on network failures or CORS errors. For 404 or 500 responses, check `res.ok === false`." },
    ],
    relatedSlugs: ["cors-access-control-allow-origin-missing", "ssl-err-cert-authority-invalid", "nginx-502-bad-gateway-upstream"],
  },

  // 22. SSL ERR_CERT_AUTHORITY_INVALID
  {
    slug: "ssl-err-cert-authority-invalid",
    name: "SSL: NET::ERR_CERT_AUTHORITY_INVALID",
    title: "Fix 'NET::ERR_CERT_AUTHORITY_INVALID' and Self-Signed Certificate Errors",
    summary: "Resolve SSL/TLS certificate trust errors in development, curl, Node.js, and local HTTPS environments.",
    category: "Network & HTTP",
    errorMessage: "NET::ERR_CERT_AUTHORITY_INVALID / self signed certificate in certificate chain",
    rootCause: "The browser or Node.js does not recognize the certificate authority that signed the SSL certificate (common with mkcert, self-signed dev certificates, or missing intermediate CA certificates).",
    brokenCode: `// ❌ Node.js rejecting self-signed cert in development
fetch("https://localhost:8443/api"); // Throws self signed cert error`,
    fixedCode: `// ✅ Use mkcert to install local root CA or set NODE_TLS_REJECT_UNAUTHORIZED in dev
// Terminal: mkcert -install && mkcert localhost 127.0.0.1`,
    diagnosticCommands: [
      "mkcert -install",
      "openssl s_client -connect localhost:443 -servername localhost",
    ],
    configVariables: [
      { key: "domain", label: "Dev Domain", defaultValue: "localhost", placeholder: "e.g. localhost, local.dev" },
    ],
    generateCustomSolution: (vars) => {
      const d = vars.domain || "localhost";
      return `# Step 1: Install trusted local CA using mkcert
brew install mkcert # or choco install mkcert
mkcert -install

# Step 2: Generate trusted certs for ${d}:
mkcert ${d} 127.0.0.1 ::1

# In Node.js development only (.env.development):
# NODE_TLS_REJECT_UNAUTHORIZED=0 (DO NOT USE IN PRODUCTION)`;
    },
    faqs: [
      { q: "Why is NODE_TLS_REJECT_UNAUTHORIZED=0 dangerous?", a: "It disables all SSL certificate validation, exposing network traffic to man-in-the-middle (MITM) attacks." },
    ],
    relatedSlugs: ["fetch-typeerror-failed-to-fetch", "cors-access-control-allow-origin-missing", "nginx-502-bad-gateway-upstream"],
  },

  // 23. K8s CrashLoopBackOff
  {
    slug: "k8s-crashloopbackoff",
    name: "Kubernetes: CrashLoopBackOff",
    title: "Fix Kubernetes 'CrashLoopBackOff' Pod Status — Diagnostic Guide",
    summary: "Debug and recover crashing Kubernetes pods caused by failed startup commands, missing secrets, or exit code 1.",
    category: "DevOps & Docker",
    errorMessage: "The container in pod 'api-deployment-7889' is crashing repeatedly with status: CrashLoopBackOff",
    rootCause: "The containerized application process terminates immediately after launch due to an unhandled exception, missing environment variable, failed database connection, or wrong CMD instruction.",
    brokenCode: `// ❌ Pod starts and container exits immediately
spec:
  containers:
  - name: web
    image: node:20
    # No long-running process specified`,
    fixedCode: `// ✅ Provide valid startup command and health probes
spec:
  containers:
  - name: web
    image: node:20
    command: ["npm", "start"]
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 15`,
    diagnosticCommands: [
      "kubectl logs <pod-name> --previous",
      "kubectl describe pod <pod-name>",
    ],
    configVariables: [
      { key: "podName", label: "Pod Name", defaultValue: "my-app-pod", placeholder: "e.g. api-789" },
    ],
    generateCustomSolution: (vars) => {
      const p = vars.podName || "my-app-pod";
      return `# 1. View logs of the crashed container prior to restart:
kubectl logs ${p} --previous

# 2. Check exit code and events:
kubectl describe pod ${p}

# 3. Override command to keep container alive for debugging:
kubectl debug pod/${p} -it --image=busybox -- sh`;
    },
    faqs: [
      { q: "What does BackOff mean?", a: "Kubernetes introduces an exponential delay (10s, 20s, 40s...) between restart attempts to prevent overloading the node." },
    ],
    relatedSlugs: ["k8s-imagepullbackoff", "docker-bind-address-already-in-use", "systemd-service-start-request-repeated-too-quickly"],
  },

  // 24. K8s ImagePullBackOff
  {
    slug: "k8s-imagepullbackoff",
    name: "Kubernetes: ImagePullBackOff / ErrImagePull",
    title: "Fix Kubernetes 'ImagePullBackOff' and 'ErrImagePull' Registry Errors",
    summary: "Resolve container image registry authentication failures, wrong image tags, or private registry credentials.",
    category: "DevOps & Docker",
    errorMessage: "Failed to pull image 'ghcr.io/org/private-app:v1': rpc error: code = Unknown desc = failed to pull and unpack image: failed to resolve reference: unexpected status: 401 Unauthorized",
    rootCause: "Typo in image name or tag, non-existent repository, or missing `imagePullSecrets` required to authenticate with private registries (Docker Hub, GHCR, AWS ECR).",
    brokenCode: `// ❌ Missing imagePullSecrets for private image
spec:
  containers:
  - name: app
    image: ghcr.io/company/private-service:v1.0.0`,
    fixedCode: `// ✅ Add imagePullSecrets linking to registry secret
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: ghcr.io/company/private-service:v1.0.0`,
    diagnosticCommands: [
      "kubectl describe pod <pod-name>",
      "kubectl create secret docker-registry regcred ...",
    ],
    configVariables: [
      { key: "registry", label: "Registry Domain", defaultValue: "ghcr.io", placeholder: "e.g. docker.io, ghcr.io" },
      { key: "secretName", label: "K8s Secret Name", defaultValue: "ghcr-auth", placeholder: "e.g. regcred" },
    ],
    generateCustomSolution: (vars) => {
      const reg = vars.registry || "ghcr.io";
      const sec = vars.secretName || "regcred";
      return `# Create registry secret in Kubernetes:
kubectl create secret docker-registry ${sec} \\
  --docker-server=${reg} \\
  --docker-username=YOUR_USER \\
  --docker-password=YOUR_TOKEN \\
  --docker-email=admin@example.com

# Then add to deployment manifest:
spec:
  imagePullSecrets:
    - name: ${sec}`;
    },
    faqs: [
      { q: "What is the difference between ErrImagePull and ImagePullBackOff?", a: "`ErrImagePull` is the immediate error on the first attempt; `ImagePullBackOff` is the status as Kubernetes waits before retrying." },
    ],
    relatedSlugs: ["k8s-crashloopbackoff", "docker-image-tag", "docker-bind-address-already-in-use"],
  },

  // 25. Postgres Deadlock Detected
  {
    slug: "postgres-deadlock-detected",
    name: "PostgreSQL: deadlock detected",
    title: "Fix PostgreSQL 'ERROR: deadlock detected' in Concurrent Transactions",
    summary: "Prevent transaction circular wait conditions by enforcing consistent table lock ordering and shortening transaction scopes.",
    category: "Database & ORM",
    errorMessage: "ERROR: deadlock detected (SQLSTATE 40P01) Detail: Process 12345 waits for ShareLock on transaction 6789; Process 6789 waits for ShareLock on transaction 12345.",
    rootCause: "Two or more concurrent database transactions update the same rows in reverse order (Transaction A locks Row 1 then requests Row 2; Transaction B locks Row 2 then requests Row 1).",
    brokenCode: `// ❌ Tx 1 updates A then B; Tx 2 updates B then A (Deadlock!)
// Tx 1: UPDATE accounts SET bal = bal - 10 WHERE id = 1;
// Tx 2: UPDATE accounts SET bal = bal - 10 WHERE id = 2;`,
    fixedCode: `// ✅ Always lock/update rows in identical sorted order
const ids = [fromId, toId].sort();
await db.transaction(async (tx) => {
  for (const id of ids) {
    await tx.query("SELECT * FROM accounts WHERE id = $1 FOR UPDATE", [id]);
  }
});`,
    diagnosticCommands: [
      "SHOW deadlock_timeout;",
    ],
    configVariables: [],
    generateCustomSolution: () => {
      return `// Rule: Sort primary keys before locking multiple rows:
async function transferFunds(accountA: number, accountB: number, amount: number) {
  // Sort IDs so all concurrent transactions lock resources in identical order:
  const [firstId, secondId] = [accountA, accountB].sort((a, b) => a - b);

  return await prisma.$transaction(async (tx) => {
    // 1. Lock lower ID first
    await tx.$executeRaw\`SELECT id FROM accounts WHERE id = \${firstId} FOR UPDATE\`;
    // 2. Lock higher ID second
    await tx.$executeRaw\`SELECT id FROM accounts WHERE id = \${secondId} FOR UPDATE\`;

    // 3. Perform updates safely without deadlocks
    await tx.accounts.update({ where: { id: accountA }, data: { balance: { decrement: amount } } });
    await tx.accounts.update({ where: { id: accountB }, data: { balance: { increment: amount } } });
  });
}`;
    },
    faqs: [
      { q: "How long does PostgreSQL wait before cancelling a deadlocked transaction?", a: "By default `deadlock_timeout` is 1 second (1000ms), after which Postgres aborts one of the transactions." },
    ],
    relatedSlugs: ["postgres-remaining-connection-slots-reserved", "sqlite-busy-database-is-locked", "prisma-p1001-cant-reach-database-server"],
  },

  // 26. MySQL ER_NOT_SUPPORTED_AUTH_MODE
  {
    slug: "mysql-er-not-supported-auth-mode",
    name: "MySQL: ER_NOT_SUPPORTED_AUTH_MODE",
    title: "Fix MySQL 'ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol'",
    summary: "Update MySQL 8 user authentication plugin from caching_sha2_password to mysql_native_password.",
    category: "Database & ORM",
    errorMessage: "Error: ER_NOT_SUPPORTED_AUTH_MODE: Client does not support authentication protocol requested by server; consider upgrading MySQL client",
    rootCause: "MySQL 8.0 defaulted to `caching_sha2_password` authentication, which older Node.js `mysql` client drivers do not support.",
    brokenCode: `// ❌ mysql client fails connecting to MySQL 8 default auth
const connection = mysql.createConnection({ user: 'root', password: 'password' });`,
    fixedCode: `// ✅ Switch user to mysql_native_password or upgrade to mysql2
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;`,
    diagnosticCommands: [
      "mysql -u root -p -e \"SELECT user, plugin FROM mysql.user;\"",
    ],
    configVariables: [
      { key: "username", label: "MySQL User", defaultValue: "root", placeholder: "e.g. root" },
      { key: "password", label: "User Password", defaultValue: "my_secure_password", placeholder: "e.g. secret" },
    ],
    generateCustomSolution: (vars) => {
      const u = vars.username || "root";
      const p = vars.password || "password";
      return `# Option 1: Upgrade to 'mysql2' package (Native SHA-256 Support):
npm uninstall mysql && npm install mysql2

# Option 2: Run SQL in MySQL terminal to alter user:
ALTER USER '${u}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${p}';
ALTER USER '${u}'@'%' IDENTIFIED WITH mysql_native_password BY '${p}';
FLUSH PRIVILEGES;`;
    },
    faqs: [
      { q: "Why is mysql2 preferred over modifying MySQL 8 server defaults?", a: "`mysql2` supports modern async/await promises and native SHA256 authentication without degrading database security." },
    ],
    relatedSlugs: ["postgres-remaining-connection-slots-reserved", "prisma-p1001-cant-reach-database-server", "sqlite-busy-database-is-locked"],
  },

  // 27. TS Object is Possibly Undefined
  {
    slug: "ts-object-is-possibly-undefined",
    name: "TypeScript: Object is possibly 'undefined'",
    title: "Fix TypeScript Error TS2532: 'Object is possibly undefined' (or 'null')",
    summary: "Safely handle optional types using optional chaining (?.) and nullish coalescing (??) operators.",
    category: "TypeScript & Node.js",
    errorMessage: "error TS2532: Object is possibly 'undefined'. (or TS18048)",
    rootCause: "Strict null checks (`strictNullChecks: true`) detected access to a property or method on a variable whose type union includes `undefined` or `null`.",
    brokenCode: `// ❌ user may be undefined
interface User { name?: string; }
function getLength(user?: User) {
  return user.name.length; // TS Error: user is possibly undefined!
}`,
    fixedCode: `// ✅ Optional chaining and nullish coalescing fallback
function getLength(user?: User) {
  return user?.name?.length ?? 0;
}`,
    diagnosticCommands: [
      "npx tsc --noEmit",
    ],
    configVariables: [
      { key: "varName", label: "Variable Name", defaultValue: "data", placeholder: "e.g. user, response" },
      { key: "propName", label: "Property Name", defaultValue: "items", placeholder: "e.g. id, title" },
    ],
    generateCustomSolution: (vars) => {
      const v = vars.varName || "data";
      const p = vars.propName || "items";
      return `// 1. Optional chaining (?.) with nullish coalescing (??):
const count = ${v}?.${p}?.length ?? 0;

// 2. Early return guard clause (Type Narrowing):
if (!${v} || !${v}.${p}) {
  return null; // TS automatically narrows type after this check
}

// 3. Non-null assertion (!) - ONLY use if 100% sure value is set:
const val = ${v}!.${p};`;
    },
    faqs: [
      { q: "What is the difference between ?? and || in JavaScript?", a: "`??` only falls back on `null` or `undefined`. `||` falls back on any falsy value including `0`, `\"\"`, and `false`." },
    ],
    relatedSlugs: ["ts-cannot-find-module-or-type-declarations", "react-too-many-re-renders", "fetch-typeerror-failed-to-fetch"],
  },

  // 28. Next.js Dynamic Server Usage
  {
    slug: "nextjs-dynamic-server-usage",
    name: "Next.js: Dynamic server usage",
    title: "Fix Next.js 'Dynamic server usage: Page couldn't be rendered statically'",
    summary: "Understand static vs dynamic rendering when accessing headers(), cookies(), or searchParams.",
    category: "Next.js & React",
    errorMessage: "Error: Dynamic server usage: Page couldn't be rendered statically because it used \`cookies\` or \`headers\`",
    rootCause: "A page intended for static generation (`output: export` or static generation phase) attempted to call dynamic runtime functions (`cookies()`, `headers()`, or unwrapped `searchParams`).",
    brokenCode: `// ❌ Using headers() in statically generated route
import { headers } from "next/headers";

export default async function Page() {
  const h = await headers(); // Forces dynamic rendering!
  return <div>IP: {h.get("x-forwarded-for")}</div>;
}`,
    fixedCode: `// ✅ Explicitly declare dynamic route or move to client component
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
export default async function Page() {
  const h = await headers();
  return <div>IP: {h.get("x-forwarded-for")}</div>;
}`,
    diagnosticCommands: [
      "npm run build",
    ],
    configVariables: [
      { key: "mode", label: "Export Mode", defaultValue: "force-dynamic", placeholder: "force-dynamic or force-static" },
    ],
    generateCustomSolution: (vars) => {
      const m = vars.mode || "force-dynamic";
      return `// Add route segment config at the top of your page.tsx:
export const dynamic = "${m}";
export const revalidate = 0; // Disable cache for fresh per-request data

// Or if reading searchParams in Next.js 15+:
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  return <div>Search: {params.q}</div>;
}`;
    },
    faqs: [
      { q: "Why did Next.js 15 make headers() and cookies() asynchronous?", a: "Async request APIs allow Next.js to start streaming the outer HTML layout before server request headers finish reading." },
    ],
    relatedSlugs: ["nextjs-hydration-failed", "react-too-many-re-renders", "cors-access-control-allow-origin-missing"],
  },

  // 29. CSP Refused to Execute Inline Script
  {
    slug: "csp-refused-to-execute-inline-script",
    name: "CSP: Refused to execute inline script",
    title: "Fix CSP 'Refused to execute inline script because it violates Content Security Policy'",
    summary: "Resolve Content Security Policy inline script blocks using nonces or SHA-256 hashes.",
    category: "Cloud & Security",
    errorMessage: "Refused to execute inline script because it violates the following Content Security Policy directive: \"script-src 'self'\". Either the 'unsafe-inline' keyword, a hash, or a nonce is required.",
    rootCause: "The browser's Content Security Policy HTTP header forbids executing inline `<script>` tags or inline `onclick` handlers without a cryptographic nonce or SHA hash.",
    brokenCode: `// ❌ Inline script blocked by CSP
<script>
  console.log("Analytics initialized");
</script>`,
    fixedCode: `// ✅ Pass cryptographic nonce generated per-request in middleware
import { headers } from "next/headers";

export default async function Layout() {
  const nonce = (await headers()).get("x-nonce");
  return <script nonce={nonce} dangerouslySetInnerHTML={{ __html: "..." }} />;
}`,
    diagnosticCommands: [
      "curl -I https://mysite.com | grep -i content-security-policy",
    ],
    configVariables: [
      { key: "allowedDomain", label: "External Script Domain", defaultValue: "https://www.google-analytics.com", placeholder: "https://scripts.com" },
    ],
    generateCustomSolution: (vars) => {
      const d = vars.allowedDomain || "https://scripts.com";
      return `# Next.js Middleware with Cryptographic Nonce:
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = \`
    default-src 'self';
    script-src 'self' 'nonce-\${nonce}' 'strict-dynamic' ${d};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  \`.replace(/\\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}`;
    },
    faqs: [
      { q: "Is 'unsafe-inline' secure?", a: "No. 'unsafe-inline' disables CSP protection against Cross-Site Scripting (XSS). Always prefer nonces or sha256 hashes." },
    ],
    relatedSlugs: ["cors-access-control-allow-origin-missing", "nextjs-hydration-failed", "jwt-malformed-or-jwt-expired"],
  },

  // 30. Vite Failed to Resolve Import
  {
    slug: "vite-failed-to-resolve-import",
    name: "Vite: Failed to resolve import",
    title: "Fix Vite Error: '[vite] Failed to resolve import \"...\" from \"...\" Does the file exist?'",
    summary: "Resolve Vite path alias misconfigurations and missing file extensions.",
    category: "TypeScript & Node.js",
    errorMessage: "[vite] Failed to resolve import \"@/components/header\" from \"src/App.tsx\". Does the file exist?",
    rootCause: "Vite build tool does not automatically read path aliases from `tsconfig.json` without configuring `vite-tsconfig-paths` or `resolve.alias` in `vite.config.ts`.",
    brokenCode: `// ❌ vite.config.ts missing resolve alias
export default defineConfig({
  plugins: [react()],
});`,
    fixedCode: `// ✅ Add vite-tsconfig-paths plugin or path alias
import path from "path";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`,
    diagnosticCommands: [
      "npm install --save-dev vite-tsconfig-paths",
    ],
    configVariables: [
      { key: "aliasPrefix", label: "Alias Prefix", defaultValue: "@", placeholder: "e.g. @" },
    ],
    generateCustomSolution: (vars) => {
      const a = vars.aliasPrefix || "@";
      return `// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '${a}': path.resolve(__dirname, './src')
    }
  }
});`;
    },
    faqs: [
      { q: "Can I use vite-tsconfig-paths?", a: "Yes! Running `npm i -D vite-tsconfig-paths` and adding `tsconfigPaths()` to your `plugins` array automatically synchronizes aliases from `tsconfig.json`." },
    ],
    relatedSlugs: ["ts-cannot-find-module-or-type-declarations", "webpack-module-parse-failed", "node-err-ossl-evp-unsupported"],
  },

  // 31. GraphQL Syntax Error Expected Name
  {
    slug: "graphql-syntax-error-expected-name",
    name: "GraphQL: Syntax Error Expected Name",
    title: "Fix GraphQL 'Syntax Error: Expected Name, found <EOF>' or Invalid Variable Syntax",
    summary: "Resolve GraphQL query parsing syntax errors caused by trailing commas or empty variables.",
    category: "Cloud & Security",
    errorMessage: "GraphQLError: Syntax Error: Expected Name, found <EOF> (or found \",\")",
    rootCause: "GraphQL specification strictly forbids trailing commas in field selections or variable lists, or empty query blocks `{}`.",
    brokenCode: `// ❌ Trailing comma in GraphQL query
query GetUser {
  user(id: 1) {
    name,
    email, // Syntax Error: trailing comma!
  }
}`,
    fixedCode: `// ✅ Remove trailing comma or use whitespace
query GetUser {
  user(id: 1) {
    name
    email
  }
}`,
    diagnosticCommands: [
      "npx graphql-codegen",
    ],
    configVariables: [],
    generateCustomSolution: () => {
      return `// Valid GraphQL Query Structure:
// Note: GraphQL uses whitespace delimiters; commas are optional but trailing commas are illegal.

const GET_USER_QUERY = \`
  query GetUserData($userId: ID!) {
    user(id: $userId) {
      id
      username
      email
      role
    }
  }
\`;`;
    },
    faqs: [
      { q: "Why are trailing commas illegal in GraphQL?", a: "The official GraphQL specification grammar treats commas as whitespace and does not allow terminal delimiters before closing braces." },
    ],
    relatedSlugs: ["fetch-typeerror-failed-to-fetch", "cors-access-control-allow-origin-missing", "dynamodb-provisioned-throughput-exceeded"],
  },

  // 32. DynamoDB Provisioned Throughput Exceeded
  {
    slug: "dynamodb-provisioned-throughput-exceeded",
    name: "DynamoDB: ProvisionedThroughputExceededException",
    title: "Fix AWS DynamoDB 'ProvisionedThroughputExceededException' (RCU/WCU Throttling)",
    summary: "Handle DynamoDB throttling with exponential backoff retries, On-Demand capacity, or DAX caching.",
    category: "Cloud & Security",
    errorMessage: "ProvisionedThroughputExceededException: The level of configured provisioned throughput for the table was exceeded.",
    rootCause: "Read Capacity Units (RCU) or Write Capacity Units (WCU) exceeded the configured threshold on a provisioned DynamoDB table due to traffic bursts or hot partition keys.",
    brokenCode: `// ❌ Direct put without retries or backoff
await dynamoDb.putItem(params);`,
    fixedCode: `// ✅ Use AWS SDK v3 with standard exponential backoff retry strategy
const client = new DynamoDBClient({
  maxAttempts: 5,
  retryMode: "adaptive"
});`,
    diagnosticCommands: [
      "aws dynamodb describe-table --table-name <table-name>",
    ],
    configVariables: [
      { key: "tableName", label: "DynamoDB Table Name", defaultValue: "UsersTable", placeholder: "e.g. Orders" },
    ],
    generateCustomSolution: (vars) => {
      const t = vars.tableName || "UsersTable";
      return `# Switch table to Pay-Per-Request (On-Demand) billing to auto-scale:
aws dynamodb update-table \\
    --table-name ${t} \\
    --billing-mode PAY_PER_REQUEST

# Or in AWS CDK:
# new Table(this, '${t}', {
#   billingMode: BillingMode.PAY_PER_REQUEST,
# });`;
    },
    faqs: [
      { q: "What causes a hot partition key in DynamoDB?", a: "When many items share the same partition key value (e.g. `status = 'pending'`), all traffic routes to a single storage partition, triggering throttles even if table capacity appears sufficient." },
    ],
    relatedSlugs: ["aws-s3-access-denied-403", "postgres-remaining-connection-slots-reserved", "redis-misconf-rdb-snapshot-error"],
  },

  // 33. AWS S3 Access Denied 403
  {
    slug: "aws-s3-access-denied-403",
    name: "AWS S3: Access Denied (403 Forbidden)",
    title: "Fix AWS S3 'Access Denied (403 Forbidden)' — IAM Policies & Bucket ACLs",
    summary: "Resolve S3 authorization rejections caused by IAM permissions, bucket policies, KMS encryption, or Block Public Access.",
    category: "Cloud & Security",
    errorMessage: "AccessDenied: Access Denied (Status Code: 403; Error Code: AccessDenied)",
    rootCause: "IAM user/role lacks `s3:GetObject` or `s3:PutObject` action permissions, S3 Block Public Access is active, or KMS decryption permission is missing.",
    brokenCode: `// ❌ Upload fails with 403 Access Denied
await s3.upload({ Bucket: 'my-bucket', Key: 'file.jpg', Body: stream });`,
    fixedCode: `// ✅ Verify IAM policy includes bucket ARN and bucket/* wildcard
{
  "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:PutObject"],
  "Resource": "arn:aws:s3:::my-bucket/*"
}`,
    diagnosticCommands: [
      "aws s3 ls s3://<bucket-name>",
      "aws sts get-caller-identity",
    ],
    configVariables: [
      { key: "bucketName", label: "S3 Bucket Name", defaultValue: "my-production-bucket", placeholder: "e.g. assets-bucket" },
    ],
    generateCustomSolution: (vars) => {
      const b = vars.bucketName || "my-bucket";
      return `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ObjectAccess",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::${b}/*"
    }
  ]
}`;
    },
    faqs: [
      { q: "Why is Resource: 'arn:aws:s3:::bucket' not enough for PutObject?", a: "Object-level actions (`GetObject`, `PutObject`) require the trailing wildcard `/*`, whereas bucket-level actions (`ListBucket`) require the bucket ARN itself." },
    ],
    relatedSlugs: ["dynamodb-provisioned-throughput-exceeded", "linux-permission-denied-publickey", "cors-access-control-allow-origin-missing"],
  },

  // 34. Systemd Service Start Request Repeated Too Quickly
  {
    slug: "systemd-service-start-request-repeated-too-quickly",
    name: "Systemd: Start request repeated too quickly",
    title: "Fix Systemd 'Failed with result start-limit-hit' and Rate Limit Crashes",
    summary: "Diagnose failing Linux systemd background services hit by StartLimitBurst protections.",
    category: "DevOps & Docker",
    errorMessage: "systemd[1]: my-app.service: Start request repeated too quickly.\nsystemd[1]: my-app.service: Failed with result 'start-limit-hit'.",
    rootCause: "The service failed to start and crashed immediately multiple times within a short interval, exceeding systemd's default burst limit (5 restarts in 10 seconds).",
    brokenCode: `// ❌ Service crashes in loop causing start-limit-hit
[Service]
Restart=always
# Service throws error on launch`,
    fixedCode: `// ✅ Add RestartSec delay and reset failed state
[Service]
Restart=always
RestartSec=5s
StartLimitIntervalSec=60s
StartLimitBurst=5`,
    diagnosticCommands: [
      "journalctl -u my-app.service -n 50 --no-pager",
      "systemctl reset-failed my-app.service",
    ],
    configVariables: [
      { key: "serviceName", label: "Systemd Service Name", defaultValue: "my-app.service", placeholder: "e.g. node-api.service" },
    ],
    generateCustomSolution: (vars) => {
      const s = vars.serviceName || "my-app.service";
      return `# Step 1: Inspect actual failure cause from logs:
journalctl -u ${s} -n 50 --no-pager

# Step 2: Clear systemd rate-limit counter:
sudo systemctl reset-failed ${s}

# Step 3: Add RestartSec delay in /etc/systemd/system/${s}:
# [Unit]
# StartLimitIntervalSec=120s
# StartLimitBurst=5
#
# [Service]
# Restart=on-failure
# RestartSec=5s

# Step 4: Reload and restart:
sudo systemctl daemon-reload
sudo systemctl start ${s}`;
    },
    faqs: [
      { q: "Why does systemd have a start-limit-hit threshold?", a: "It protects CPU and disk I/O from being overwhelmed by a broken service continuously crashing in tight infinite loops." },
    ],
    relatedSlugs: ["k8s-crashloopbackoff", "docker-bind-address-already-in-use", "linux-permission-denied-publickey"],
  },

  // 35. Linux Permission Denied (Publickey)
  {
    slug: "linux-permission-denied-publickey",
    name: "SSH: Permission denied (publickey)",
    title: "Fix SSH 'Permission denied (publickey,gssapi-keyex,gssapi-with-mic)' Error",
    summary: "Resolve SSH authentication failures caused by wrong file permissions, missing keys, or SSH agent issues.",
    category: "Cloud & Security",
    errorMessage: "git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository.",
    rootCause: "SSH server rejected connection because the matching private key is not loaded in `ssh-agent`, the public key is not registered in `~/.ssh/authorized_keys`, or file permissions on `~/.ssh` or private keys are too permissive.",
    brokenCode: `// ❌ Permissions too open on ~/.ssh/id_rsa (e.g. 777 or 664)
// SSH client refuses to use insecure keys!`,
    fixedCode: `// ✅ Enforce strict SSH key permissions (600 for keys, 700 for .ssh)
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub`,
    diagnosticCommands: [
      "ssh -vT git@github.com",
      "ssh-add -l",
      "eval \"$(ssh-agent -s)\" && ssh-add ~/.ssh/id_ed25519",
    ],
    configVariables: [
      { key: "keyName", label: "SSH Key File", defaultValue: "~/.ssh/id_ed25519", placeholder: "e.g. ~/.ssh/id_rsa" },
    ],
    generateCustomSolution: (vars) => {
      const k = vars.keyName || "~/.ssh/id_ed25519";
      return `# 1. Fix strict directory and file permissions:
chmod 700 ~/.ssh
chmod 600 ${k}
chmod 644 ${k}.pub

# 2. Start SSH Agent and add private key:
eval "$(ssh-agent -s)"
ssh-add ${k}

# 3. Test GitHub / Server SSH connectivity:
ssh -Tv git@github.com`;
    },
    faqs: [
      { q: "Why is ED25519 recommended over RSA?", a: "ED25519 keys are faster, provide stronger cryptographic security, and have much shorter key lengths than 4096-bit RSA keys." },
    ],
    relatedSlugs: ["git-fatal-refusing-to-merge-unrelated-histories", "aws-s3-access-denied-403", "systemd-service-start-request-repeated-too-quickly"],
  },
];

export function getErrorBySlug(slug: string): ErrorFix | undefined {
  return ERROR_FIXES.find((e) => e.slug === slug);
}
