import * as vscode from "vscode";
import * as crypto from "crypto";

function generateUuidV7(): string {
  const now = Date.now();
  const bytes = crypto.randomBytes(16);
  // Timestamp 48 bits (big endian)
  bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(now / 0x100000000) & 0xff;
  bytes[2] = Math.floor(now / 0x1000000) & 0xff;
  bytes[3] = Math.floor(now / 0x10000) & 0xff;
  bytes[4] = Math.floor(now / 0x100) & 0xff;
  bytes[5] = now & 0xff;
  // Version 7
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  // Variant RFC 4122 (10xx)
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

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

  // 8. Open Castov Web
  context.subscriptions.push(
    vscode.commands.registerCommand("castov.openCastov", () => {
      vscode.env.openExternal(vscode.Uri.parse("https://castov.com"));
    })
  );

  // 9. Timestamp Hover Tooltip Provider
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
}

export function deactivate() {}
