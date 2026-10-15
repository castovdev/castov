#!/usr/bin/env node

const { program } = require("commander");
const fs = require("node:fs");

program
  .name("castov")
  .description("Castov CLI - Your Local-First Developer Toolkit & Terminal Error Healer")
  .version("1.1.0");

program
  .command("time")
  .description("Show current UTC and local time, and unix timestamp")
  .action(() => {
    const now = new Date();
    console.log("----------------------------------------");
    console.log(`🌐 UTC Time:    ${now.toISOString()}`);
    console.log(`💻 Local Time:  ${now.toString()}`);
    console.log(`⏱️  Unix Epoch:  ${Math.floor(now.getTime() / 1000)}`);
    console.log("----------------------------------------");
  });

program
  .command("jwt <token>")
  .description("Decode a JWT token locally")
  .action((token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      console.log("✅ JWT Payload (Decoded Offline):");
      console.log(JSON.stringify(JSON.parse(jsonPayload), null, 2));
    } catch {
      console.error("❌ Invalid JWT Token");
    }
  });

program
  .command("base64 <action> <text>")
  .description("Encode or Decode Base64 (action: encode | decode)")
  .action((action, text) => {
    if (action === "encode") {
      console.log(`Encoded: ${btoa(text)}`);
    } else if (action === "decode") {
      try {
        console.log(`Decoded: ${atob(text)}`);
      } catch {
        console.error("❌ Invalid Base64 string");
      }
    } else {
      console.error("❌ Action must be 'encode' or 'decode'");
    }
  });

// ---------------------------------------------------------------------------
// Error Signatures & Instant Healer
// ---------------------------------------------------------------------------
const ERROR_DATABASE = [
  {
    regex: /hydration failed|initial UI does not match/i,
    name: "Next.js / React Hydration Mismatch",
    cause: "Server-rendered HTML differs from initial client render (browser APIs like window, localStorage, or Date.now() evaluated on server).",
    fix: 'Wrap client-only reads in useEffect() or add suppressHydrationWarning to the mismatched HTML tag.',
    url: "https://www.castov.com/error-fixes/nextjs-hydration-failed",
  },
  {
    regex: /EADDRINUSE|address already in use/i,
    name: "Port / Address Conflict (EADDRINUSE)",
    cause: "Another local server or process is already bound to this port.",
    fix: "Kill the occupying process: npx kill-port <port> (or: lsof -ti:<port> | xargs kill -9)",
    url: "https://www.castov.com/error-fixes/docker-bind-address-already-in-use",
  },
  {
    regex: /Access-Control-Allow-Origin|CORS/i,
    name: "CORS (Cross-Origin Resource Sharing) Blocked",
    cause: "The API endpoint does not return Access-Control-Allow-Origin matching your client domain.",
    fix: 'Return header: "Access-Control-Allow-Origin": "*" (or your origin) and handle preflight OPTIONS.',
    url: "https://www.castov.com/error-fixes/cors-access-control-allow-origin-missing",
  },
  {
    regex: /JavaScript heap out of memory|ERR_WORKER_OUT_OF_MEMORY/i,
    name: "Node.js Heap Out of Memory",
    cause: "Process exceeded V8's default memory allocation during build or bundling.",
    fix: 'Increase Node memory allocation: export NODE_OPTIONS="--max-old-space-size=4096"',
    url: "https://www.castov.com/error-fixes",
  },
  {
    regex: /ModuleNotFoundError|No module named/i,
    name: "Python Module Missing",
    cause: "Requested package is not installed in the active virtual environment.",
    fix: "Activate your venv (source .venv/bin/activate) and run: pip install <package>",
    url: "https://www.castov.com/error-fixes",
  },
  {
    regex: /ENOENT: no such file or directory/i,
    name: "File or Directory Not Found (ENOENT)",
    cause: "Target file path does not exist or relative path was resolved against incorrect working directory.",
    fix: "Verify working directory with 'pwd' / 'cd' or ensure parent directories exist (mkdir -p).",
    url: "https://www.castov.com/error-fixes",
  },
  {
    regex: /ERESOLVE unable to resolve dependency tree|peer dep/i,
    name: "NPM Peer Dependency Conflict",
    cause: "Conflicting peer dependencies between installed packages.",
    fix: "Run installation with legacy peer resolution: npm install --legacy-peer-deps",
    url: "https://www.castov.com/error-fixes",
  },
  {
    regex: /Cannot connect to the Docker daemon|docker\.sock/i,
    name: "Docker Daemon Inactive",
    cause: "Docker Desktop or the docker daemon service is not running or lacks user permissions.",
    fix: "Start Docker Desktop or service: sudo systemctl start docker && sudo usermod -aG docker $USER",
    url: "https://www.castov.com/error-fixes",
  },
  {
    regex: /<<<<<<< HEAD|merge conflict/i,
    name: "Git Merge Conflict Markers Present",
    cause: "Unresolved git conflict markers (<<<<<<<, =======, >>>>>>>) remain in code.",
    fix: "Search and resolve conflict markers, then run: git add . && git commit",
    url: "https://www.castov.com/error-fixes",
  },
];

function diagnoseError(errorText) {
  for (const item of ERROR_DATABASE) {
    if (item.regex.test(errorText)) {
      console.log("\n=======================================================");
      console.log("⚡ Castov Instant Terminal Diagnosis");
      console.log("=======================================================");
      console.log(`❌ Detected Issue : ${item.name}`);
      console.log(`💡 Root Cause     : ${item.cause}`);
      console.log(`🛠️  1-Line Fix     : ${item.fix}`);
      console.log(`🔗 Full Solution  : ${item.url}`);
      console.log("=======================================================\n");
      return true;
    }
  }

  console.log("\n=======================================================");
  console.log("⚡ Castov Error Assistant");
  console.log("=======================================================");
  console.log("No exact pre-configured pattern matched, but we got you covered:");
  console.log("🔍 Search solutions in the Castov Error Encyclopedia:");
  console.log("👉 https://www.castov.com/error-fixes");
  console.log("=======================================================\n");
  return false;
}

program
  .command("fix [error...]")
  .description("Analyze a terminal error message or log and get an instant one-line fix")
  .action((errorArgs) => {
    if (errorArgs && errorArgs.length > 0) {
      diagnoseError(errorArgs.join(" "));
    } else {
      // Read from stdin pipe
      let buffer = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (chunk) => {
        buffer += chunk;
      });
      process.stdin.on("end", () => {
        if (!buffer.trim()) {
          console.error("Usage: npx castov fix \"<error text>\" OR cat build.log | npx castov fix");
          process.exit(1);
        }
        diagnoseError(buffer);
      });
    }
  });

program
  .command("rules [stack]")
  .description("Generate .cursorrules / CLAUDE.md for your tech stack (e.g. nextjs, python, fastapi, react)")
  .option("-w, --write", "Write output directly to .cursorrules file in current directory")
  .action(async (stack, options) => {
    const selectedStack = (stack || "nextjs").toLowerCase();
    const url = `https://www.castov.com/api/rules/${selectedStack}`;

    try {
      const response = await fetch(url);
      const text = await response.text();
      
      if (options.write) {
        fs.writeFileSync(".cursorrules", text, "utf8");
        console.log(`✅ Saved ${selectedStack} rules to .cursorrules successfully!`);
      } else {
        console.log(text);
      }
    } catch {
      console.log(`# AI Coding Guidelines for ${selectedStack}`);
      console.log("- Write modular, clean, and type-safe code.");
      console.log("- Avoid any type, enforce strict error handling.");
      console.log(`- Web builder: https://www.castov.com/ai/cursorrules-generator`);
    }
  });

// Handle direct piping without explicit subcommand: e.g. "echo error | npx castov"
if (!process.stdin.isTTY && process.argv.length <= 2) {
  let buffer = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    buffer += chunk;
  });
  process.stdin.on("end", () => {
    if (buffer.trim()) {
      diagnoseError(buffer);
    } else {
      program.help();
    }
  });
} else {
  program.parse(process.argv);
}
