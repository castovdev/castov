import * as vscode from "vscode";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { parseCron } from "./utils/cron";
import { parseChmod } from "./utils/chmod";
import { parseCidr } from "./utils/cidr";
import {
  computeHash,
  generateSecret,
  generateUuidV7,
  HashAlgorithm,
  SecretFormat,
} from "./utils/crypto-tools";

function parseTimestamp(raw: string): { date: Date; unit: "seconds" | "milliseconds" } | null {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return null;

  // 10 digits = seconds (~1970 to ~2286)
  if (Math.abs(num) < 1e11) {
    return { date: new Date(num * 1000), unit: "seconds" };
  }
  // 13 digits = milliseconds
  if (Math.abs(num) < 1e14) {
    return { date: new Date(num), unit: "milliseconds" };
  }
  return null;
}

export function activate(context: vscode.ExtensionContext) {
  let outputChannel: vscode.OutputChannel | undefined;

  const getOutputChannel = () => {
    if (!outputChannel) {
      outputChannel = vscode.window.createOutputChannel("Castov Utilities");
    }
    return outputChannel;
  };

  // 1. Insert UUID v4
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.insertUuidV4", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const uuid = crypto.randomUUID();
      editor.edit((edit) => {
        for (const selection of editor.selections) {
          edit.replace(selection, uuid);
        }
      });
    })
  );

  // 2. Insert UUID v7
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.insertUuidV7", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      editor.edit((edit) => {
        for (const selection of editor.selections) {
          edit.replace(selection, generateUuidV7());
        }
      });
    })
  );

  // 3. Insert Unix Timestamp
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.insertUnixTimestamp", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const pick = await vscode.window.showQuickPick(
        [
          { label: "Seconds (10 digits)", description: "Standard Unix timestamp", value: "sec" },
          { label: "Milliseconds (13 digits)", description: "JavaScript / Epoch milliseconds", value: "ms" },
        ],
        { placeHolder: "Select timestamp format" }
      );

      if (!pick) return;
      const ts = pick.value === "sec" ? Math.floor(Date.now() / 1000).toString() : Date.now().toString();

      editor.edit((edit) => {
        for (const selection of editor.selections) {
          edit.replace(selection, ts);
        }
      });
    })
  );

  // 4. Convert Selected Timestamp to Human Date
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.convertTimestamp", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const text = editor.document.getText(selection).trim();
      const parsed = parseTimestamp(text);

      if (!parsed) {
        vscode.window.showErrorMessage(`Castov: "${text}" is not a valid Unix timestamp.`);
        return;
      }

      const iso = parsed.date.toISOString();
      const local = parsed.date.toLocaleString();

      const action = await vscode.window.showInformationMessage(
        `Castov [${parsed.unit}]: ${iso}\nLocal: ${local}`,
        "Replace in Editor",
        "Copy ISO Date",
        "Open in Castov"
      );

      if (action === "Replace in Editor") {
        editor.edit((edit) => edit.replace(selection, iso));
      } else if (action === "Copy ISO Date") {
        await vscode.env.clipboard.writeText(iso);
        vscode.window.showInformationMessage("Copied ISO date to clipboard!");
      } else if (action === "Open in Castov") {
        vscode.env.openExternal(vscode.Uri.parse(`https://castov.com/unix-timestamp-converter#ts=${text}`));
      }
    })
  );

  // 5. Decode Selected JWT
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.decodeJwt", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const text = editor.document.getText(editor.selection).trim();
      const parts = text.split(".");

      if (parts.length < 2) {
        vscode.window.showErrorMessage("Castov: Selected text does not appear to be a valid JWT.");
        return;
      }

      try {
        const decodePart = (b64url: string) => {
          let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
          while (b64.length % 4) b64 += "=";
          return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
        };

        const header = decodePart(parts[0]);
        const payload = decodePart(parts[1]);

        let statusText = "Active";
        if (payload.exp && typeof payload.exp === "number") {
          const expMs = payload.exp * 1000;
          if (Date.now() > expMs) {
            statusText = `Expired at ${new Date(expMs).toISOString()}`;
          } else {
            statusText = `Valid until ${new Date(expMs).toISOString()}`;
          }
        }

        const channel = getOutputChannel();
        channel.clear();
        channel.appendLine("=== Castov JWT Inspection ===");
        channel.appendLine(`Status: ${statusText}\n`);
        channel.appendLine("--- Header ---");
        channel.appendLine(JSON.stringify(header, null, 2));
        channel.appendLine("\n--- Payload ---");
        channel.appendLine(JSON.stringify(payload, null, 2));
        channel.show();

        vscode.window.showInformationMessage(`Castov JWT: ${statusText}`, "View Output Channel");
      } catch (err: any) {
        vscode.window.showErrorMessage(`Castov: Failed to decode JWT: ${err.message}`);
      }
    })
  );

  // 6. Base64 Encode Selection
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.base64Encode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      editor.edit((edit) => {
        for (const selection of editor.selections) {
          const text = editor.document.getText(selection);
          edit.replace(selection, Buffer.from(text, "utf8").toString("base64"));
        }
      });
    })
  );

  // 7. Base64 Decode Selection
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.base64Decode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      editor.edit((edit) => {
        for (const selection of editor.selections) {
          const text = editor.document.getText(selection).trim();
          try {
            edit.replace(selection, Buffer.from(text, "base64").toString("utf8"));
          } catch {
            vscode.window.showErrorMessage("Castov: Invalid Base64 string.");
          }
        }
      });
    })
  );

  // 8. Hash Selection (SHA-256, SHA-512, MD5, SHA-1)
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.hashSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) {
        vscode.window.showInformationMessage("Castov: Please select text to hash.");
        return;
      }

      const pick = await vscode.window.showQuickPick(
        [
          { label: "SHA-256", description: "Secure 256-bit hash (Standard)", value: "sha256" as HashAlgorithm },
          { label: "SHA-512", description: "High-security 512-bit hash", value: "sha512" as HashAlgorithm },
          { label: "MD5", description: "128-bit checksum (Legacy / Checksum)", value: "md5" as HashAlgorithm },
          { label: "SHA-1", description: "160-bit hash (Git / Legacy)", value: "sha1" as HashAlgorithm },
        ],
        { placeHolder: "Select hash algorithm" }
      );

      if (!pick) return;
      const hash = computeHash(text, pick.value);

      const action = await vscode.window.showInformationMessage(
        `Castov ${pick.label}: ${hash}`,
        "Replace Selection",
        "Copy to Clipboard"
      );

      if (action === "Replace Selection") {
        editor.edit((edit) => edit.replace(selection, hash));
      } else if (action === "Copy to Clipboard") {
        await vscode.env.clipboard.writeText(hash);
        vscode.window.showInformationMessage(`Copied ${pick.label} hash to clipboard!`);
      }
    })
  );

  // 9. Generate Secure Secret / API Key
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.generateSecret", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const pick = await vscode.window.showQuickPick(
        [
          { label: "Hex 32 bytes (64 chars)", description: "Standard JWT secret, Encryption key, API key", value: "hex32" as SecretFormat },
          { label: "Hex 16 bytes (32 chars)", description: "Medium-length secret key", value: "hex16" as SecretFormat },
          { label: "Base64 32 bytes (44 chars)", description: "High-entropy Base64 token", value: "base64" as SecretFormat },
          { label: "Alphanumeric 32 chars", description: "Password, Database password, Session token", value: "alpha32" as SecretFormat },
          { label: "Alphanumeric 64 chars", description: "Long high-entropy alphanumeric key", value: "alpha64" as SecretFormat },
        ],
        { placeHolder: "Select secret format" }
      );

      if (!pick) return;
      const secret = generateSecret(pick.value);

      editor.edit((edit) => {
        for (const selection of editor.selections) {
          edit.replace(selection, secret);
        }
      });
      vscode.window.showInformationMessage(`Castov: Inserted cryptographically secure secret (${pick.label}).`);
    })
  );

  // 10. URL Encode Selection
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.urlEncode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      editor.edit((edit) => {
        for (const selection of editor.selections) {
          const text = editor.document.getText(selection);
          edit.replace(selection, encodeURIComponent(text));
        }
      });
    })
  );

  // 11. URL Decode Selection
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.urlDecode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      editor.edit((edit) => {
        for (const selection of editor.selections) {
          const text = editor.document.getText(selection);
          try {
            edit.replace(selection, decodeURIComponent(text));
          } catch {
            vscode.window.showErrorMessage("Castov: Invalid URL encoded string.");
          }
        }
      });
    })
  );

  // 12. Open Castov Web
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.openCastov", () => {
      vscode.env.openExternal(vscode.Uri.parse("https://castov.com"));
    })
  );

  // 13. Setup Castov MCP Server
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.setupMcpServer", async () => {
      const pick = await vscode.window.showQuickPick(
        [
          {
            label: "Cursor IDE (.cursor/mcp.json)",
            description: "Write Castov MCP config into workspace .cursor/mcp.json",
            value: "cursor"
          },
          {
            label: "VS Code Copilot (.vscode/mcp.json)",
            description: "Write Castov MCP config into workspace .vscode/mcp.json",
            value: "vscode"
          },
          {
            label: "Copy MCP JSON to Clipboard",
            description: "For Claude Desktop, Windsurf, or manual setup",
            value: "clipboard"
          }
        ],
        { placeHolder: "Select where to configure the Castov MCP Server (10 local tools)" }
      );

      if (!pick) return;

      const standardConfig = {
        mcpServers: {
          castov: {
            command: "npx",
            args: ["-y", "castov@latest", "mcp"]
          }
        }
      };

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (pick.value === "clipboard" || !workspaceFolders || workspaceFolders.length === 0) {
        await vscode.env.clipboard.writeText(JSON.stringify(standardConfig, null, 2));
        const action = await vscode.window.showInformationMessage(
          "Castov MCP Server config copied to clipboard!",
          "View MCP Documentation"
        );
        if (action === "View MCP Documentation") {
          vscode.env.openExternal(vscode.Uri.parse("https://castov.com/mcp"));
        }
        return;
      }

      const rootDir = workspaceFolders[0].uri.fsPath;
      const targetSubdir = pick.value === "cursor" ? ".cursor" : ".vscode";
      const targetDir = path.join(rootDir, targetSubdir);
      const targetFile = path.join(targetDir, "mcp.json");

      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        let configObj: Record<string, any> = {};
        if (fs.existsSync(targetFile)) {
          try {
            configObj = JSON.parse(fs.readFileSync(targetFile, "utf8"));
          } catch {
            configObj = {};
          }
        }

        if (pick.value === "vscode") {
          configObj.servers = configObj.servers || {};
          configObj.servers.castov = {
            type: "stdio",
            command: "npx",
            args: ["-y", "castov@latest", "mcp"]
          };
        } else {
          configObj.mcpServers = configObj.mcpServers || {};
          configObj.mcpServers.castov = {
            command: "npx",
            args: ["-y", "castov@latest", "mcp"]
          };
        }

        fs.writeFileSync(targetFile, JSON.stringify(configObj, null, 2) + "\n", "utf8");
        const doc = await vscode.workspace.openTextDocument(targetFile);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Castov MCP Server (10 tools) configured in ${targetSubdir}/mcp.json!`);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Castov: Failed to write MCP configuration: ${err.message}`);
      }
    })
  );

  // ---------------------------------------------------------
  // SMART HOVER PROVIDERS
  // ---------------------------------------------------------

  // A. Unix Timestamp Hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: "file" }, {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /\b\d{10,13}\b/);
        if (!range) return;

        const word = document.getText(range);
        const parsed = parseTimestamp(word);
        if (!parsed) return;

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`### ⏱️ Castov Unix Timestamp\n\n`);
        md.appendMarkdown(`- **UTC**: \`${parsed.date.toISOString()}\`\n`);
        md.appendMarkdown(`- **Local**: \`${parsed.date.toLocaleString()}\`\n`);
        md.appendMarkdown(`- **Unit**: \`${parsed.unit}\`\n\n`);
        md.appendMarkdown(`[Inspect on Castov.com](https://castov.com/unix-timestamp-converter#ts=${word})`);

        return new vscode.Hover(md, range);
      },
    })
  );

  // B. Cron Expression Hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: "file" }, {
      provideHover(document, position) {
        const line = document.lineAt(position.line).text;
        // Search for 5-segment cron patterns
        const cronRegex = /(?:^|\s|["'`])((?:[\*\d\/,-]+)\s+(?:[\*\d\/,-]+)\s+(?:[\*\d\/,-]+)\s+(?:[\*\d\/,-]+)\s+(?:[\*\d\/,-]+))(?:\s|["'`]|$)/g;
        let match;
        while ((match = cronRegex.exec(line)) !== null) {
          const startIdx = match.index + (match[0].indexOf(match[1]));
          const endIdx = startIdx + match[1].length;
          if (position.character >= startIdx && position.character <= endIdx) {
            const parsed = parseCron(match[1]);
            if (!parsed) continue;

            const range = new vscode.Range(position.line, startIdx, position.line, endIdx);
            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.appendMarkdown(`### ⏲️ Castov Cron Schedule\n\n`);
            md.appendMarkdown(`**Schedule:** \`${parsed.summary}\`\n\n`);
            md.appendMarkdown(`- **Minute**: ${parsed.details.minute}\n`);
            md.appendMarkdown(`- **Hour**: ${parsed.details.hour}\n`);
            md.appendMarkdown(`- **Day of Month**: ${parsed.details.dayOfMonth}\n`);
            md.appendMarkdown(`- **Month**: ${parsed.details.month}\n`);
            md.appendMarkdown(`- **Day of Week**: ${parsed.details.dayOfWeek}\n\n`);

            if (parsed.nextRuns.length > 0) {
              md.appendMarkdown(`**Upcoming Executions:**\n`);
              for (const run of parsed.nextRuns) {
                md.appendMarkdown(`- \`${run}\`\n`);
              }
              md.appendMarkdown(`\n`);
            }

            md.appendMarkdown(`[Explore Cron Tools on Castov.com](https://castov.com/cron)`);
            return new vscode.Hover(md, range);
          }
        }
      },
    })
  );

  // C. Chmod Permissions Hover (Context-Aware)
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: "file" }, {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /\b0?[0-7]{3}\b/);
        if (!range) return;

        const word = document.getText(range);
        const lineText = document.lineAt(position.line).text.toLowerCase();
        const docLang = document.languageId;
        const fileName = path.basename(document.fileName).toLowerCase();

        // Context check: only trigger if in relevant file or preceded by chmod/mode/permissions
        const isScriptOrConfig =
          docLang === "shellscript" ||
          docLang === "dockerfile" ||
          docLang === "yaml" ||
          fileName.includes("dockerfile") ||
          fileName.endsWith(".sh") ||
          fileName.endsWith(".bash");

        const hasKeyword =
          lineText.includes("chmod") ||
          lineText.includes("mode") ||
          lineText.includes("permission");

        if (!isScriptOrConfig && !hasKeyword) {
          return;
        }

        const parsed = parseChmod(word);
        if (!parsed) return;

        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`### 🛡️ Castov Chmod Permissions (\`${parsed.octal}\`)\n\n`);
        md.appendMarkdown(`**Symbolic:** \`${parsed.symbolic}\`\n\n`);
        md.appendMarkdown(`| Entity | Permissions | Details |\n`);
        md.appendMarkdown(`| :--- | :---: | :--- |\n`);
        md.appendMarkdown(`| **Owner (User)** | \`${parsed.owner.read ? "r" : "-"}${parsed.owner.write ? "w" : "-"}${parsed.owner.execute ? "x" : "-"}\` | ${parsed.owner.summary} |\n`);
        md.appendMarkdown(`| **Group** | \`${parsed.group.read ? "r" : "-"}${parsed.group.write ? "w" : "-"}${parsed.group.execute ? "x" : "-"}\` | ${parsed.group.summary} |\n`);
        md.appendMarkdown(`| **Others (Public)** | \`${parsed.others.read ? "r" : "-"}${parsed.others.write ? "w" : "-"}${parsed.others.execute ? "x" : "-"}\` | ${parsed.others.summary} |\n\n`);
        md.appendMarkdown(`[Inspect Chmod on Castov.com](https://castov.com/chmod/${parsed.octal})`);

        return new vscode.Hover(md, range);
      },
    })
  );

  // D. CIDR Subnet Calculator Hover
  context.subscriptions.push(
    vscode.languages.registerHoverProvider({ scheme: "file" }, {
      provideHover(document, position) {
        const line = document.lineAt(position.line).text;
        const cidrRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\/(?:[0-2]?[0-9]|3[0-2])\b/g;
        let match;
        while ((match = cidrRegex.exec(line)) !== null) {
          const startIdx = match.index;
          const endIdx = startIdx + match[0].length;
          if (position.character >= startIdx && position.character <= endIdx) {
            const parsed = parseCidr(match[0]);
            if (!parsed) continue;

            const range = new vscode.Range(position.line, startIdx, position.line, endIdx);
            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.appendMarkdown(`### 🌐 Castov CIDR Subnet (\`${parsed.cidr}\`)\n\n`);
            md.appendMarkdown(`- **Type**: \`${parsed.ipType}\`\n`);
            md.appendMarkdown(`- **Netmask**: \`${parsed.netmask}\`\n`);
            md.appendMarkdown(`- **Network Address**: \`${parsed.networkAddress}\`\n`);
            md.appendMarkdown(`- **Broadcast Address**: \`${parsed.broadcastAddress}\`\n`);
            md.appendMarkdown(`- **Usable Host Range**: \`${parsed.firstUsableIp}\` – \`${parsed.lastUsableIp}\`\n`);
            md.appendMarkdown(`- **Usable Hosts**: \`${parsed.usableHosts.toLocaleString()}\` of \`${parsed.totalHosts.toLocaleString()}\` total\n\n`);
            md.appendMarkdown(`[Explore CIDR on Castov.com](https://castov.com/cidr)`);

            return new vscode.Hover(md, range);
          }
        }
      },
    })
  );
}

export function deactivate() {}
