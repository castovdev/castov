#!/usr/bin/env node

const { program } = require("commander");

program
  .name("castov")
  .description("Castov CLI - Your Local-First Developer Toolkit")
  .version("1.0.0");

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

program.parse(process.argv);
