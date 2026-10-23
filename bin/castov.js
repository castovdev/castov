#!/usr/bin/env node

/**
 * Castov Master CLI Entrypoint (v1.4.0)
 * Delegates to the production-grade Castov CLI package in packages/castov-cli.
 */

const path = require("node:path");
const fs = require("node:fs");

const modernCli = path.join(__dirname, "..", "packages", "castov-cli", "dist", "cli.js");

if (fs.existsSync(modernCli)) {
  const fileUrl = new URL("file://" + modernCli.replace(/\\/g, "/"));
  import(fileUrl).catch((err) => {
    console.error("Failed to run Castov CLI:", err);
    process.exit(1);
  });
} else {
  // If not built yet, run build first
  console.log("Castov CLI build missing. Building packages/castov-cli...");
  try {
    const { execSync } = require("node:child_process");
    execSync("npm run build", { cwd: path.join(__dirname, "..", "packages", "castov-cli"), stdio: "inherit" });
    const fileUrl = new URL("file://" + modernCli.replace(/\\/g, "/"));
    import(fileUrl);
  } catch (err) {
    console.error("Could not initialize Castov CLI:", err);
    process.exit(1);
  }
}
