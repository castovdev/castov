import {
  ts as parseTs,
  detect as detectId,
  cron as explainCron,
  tz as convertTz,
  chmod as parseChmod,
  jwtInspect,
  diff as calcDiff,
  duration as formatDuration,
  color as parseColor,
  uuid,
  uuidv7,
  nanoid,
  base64Encode,
  base64Decode,
  hash,
} from "castov-sdk";

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "castov_ts",
    description: "Auto-detects Unix timestamp in seconds or milliseconds and converts to UTC, ISO 8601, and local representation.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "Unix timestamp in seconds or milliseconds (e.g. '1700000000' or 1700000000000)",
        },
      },
      required: ["value"],
    },
  },
  {
    name: "castov_detect",
    description: "Identifies ID or timestamp format (MongoDB ObjectId, Twitter/Discord Snowflake, UUIDv7, ULID, Unix timestamp) and extracts its embedded creation time.",
    inputSchema: {
      type: "object",
      properties: {
        value: {
          type: "string",
          description: "The raw ID or timestamp string to inspect",
        },
      },
      required: ["value"],
    },
  },
  {
    name: "castov_cron",
    description: "Explains standard 5-part cron expressions in plain English and calculates the next 5 execution timestamps.",
    inputSchema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Cron expression (e.g. '0 9 * * 1-5' or '@hourly')",
        },
        timezone: {
          type: "string",
          description: "Optional IANA time zone (e.g. 'America/New_York', 'UTC'). Defaults to system local time zone.",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "castov_tz",
    description: "Converts date and time between IANA time zones with automatic Daylight Saving Time (DST) gap and overlap detection.",
    inputSchema: {
      type: "object",
      properties: {
        dateTime: {
          type: "string",
          description: "Date time string in format 'YYYY-MM-DD HH:mm:ss' or ISO 8601",
        },
        from: {
          type: "string",
          description: "Source IANA time zone (e.g. 'America/New_York')",
        },
        to: {
          type: "string",
          description: "Target IANA time zone (e.g. 'Europe/Paris')",
        },
      },
      required: ["dateTime", "from", "to"],
    },
  },
  {
    name: "castov_chmod",
    description: "Calculates and explains Linux chmod permissions between octal (e.g. '755') and symbolic (e.g. 'rwxr-xr-x') notation with security audits.",
    inputSchema: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "Chmod octal digits (e.g. '755') or symbolic string ('rwxr-xr-x')",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "castov_diff",
    description: "Calculates the exact time difference between two dates or timestamps with human-readable breakdown (days, hours, minutes, seconds).",
    inputSchema: {
      type: "object",
      properties: {
        date1: {
          type: "string",
          description: "Start date (ISO 8601 string or Unix timestamp)",
        },
        date2: {
          type: "string",
          description: "End date (ISO 8601 string or Unix timestamp)",
        },
      },
      required: ["date1", "date2"],
    },
  },
  {
    name: "castov_duration",
    description: "Converts milliseconds into a concise human-readable duration string (e.g. 3661000 -> '1h 1m 1s').",
    inputSchema: {
      type: "object",
      properties: {
        ms: {
          type: "number",
          description: "Duration in milliseconds",
        },
      },
      required: ["ms"],
    },
  },
  {
    name: "castov_color",
    description: "Parses Hex or RGB color, converts to Hex, RGB, HSL, and computes WCAG contrast ratios against black and white.",
    inputSchema: {
      type: "object",
      properties: {
        color: {
          type: "string",
          description: "Color string (e.g. '#2563eb' or 'rgb(37, 99, 235)')",
        },
      },
      required: ["color"],
    },
  },
  {
    name: "castov_jwt",
    description: "Inspects JSON Web Token (JWT) header, payload, expiration date, and relative expiry status locally without external servers.",
    inputSchema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "Raw JWT string",
        },
      },
      required: ["token"],
    },
  },
];

export async function handleMcpToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "castov_ts": {
        const val = String(args.value ?? "");
        const res = parseTs(val);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_detect": {
        const val = String(args.value ?? "");
        const res = detectId(val);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_cron": {
        const expr = String(args.expression ?? "");
        const tz = args.timezone ? String(args.timezone) : undefined;
        const res = explainCron(expr, tz);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_tz": {
        const dt = String(args.dateTime ?? "");
        const from = String(args.from ?? "");
        const to = String(args.to ?? "");
        const res = convertTz(dt, from, to);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_chmod": {
        const code = String(args.code ?? "");
        const res = parseChmod(code);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_diff": {
        const d1 = String(args.date1 ?? "");
        const d2 = String(args.date2 ?? "");
        const res = calcDiff(d1, d2);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_duration": {
        const ms = Number(args.ms ?? 0);
        const res = formatDuration(ms);
        return {
          content: [{ type: "text", text: JSON.stringify({ milliseconds: ms, formatted: res }, null, 2) }],
        };
      }

      case "castov_color": {
        const col = String(args.color ?? "");
        const res = parseColor(col);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      case "castov_jwt": {
        const token = String(args.token ?? "");
        const res = jwtInspect(token);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
        };
      }

      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
        };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: "text", text: `Error executing ${name}: ${message}` }],
    };
  }
}

/**
 * Runs the standard JSON-RPC 2.0 MCP server over stdio.
 * Compatible with Cursor, Windsurf, Claude Desktop, Cline, and any MCP client.
 */
export function startMcpServer(version: string): void {
  // Line-by-line reading from process.stdin
  let buffer = "";

  process.stdin.setEncoding("utf-8");

  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      try {
        const request = JSON.parse(line) as {
          jsonrpc?: string;
          id?: string | number;
          method: string;
          params?: Record<string, unknown>;
        };

        const response = await handleMcpRequest(request, version);
        if (response) {
          process.stdout.write(JSON.stringify(response) + "\n");
        }
      } catch (err) {
        // If malformed json
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          }) + "\n"
        );
      }
    }
  });
}

async function handleMcpRequest(
  req: { jsonrpc?: string; id?: string | number; method: string; params?: Record<string, unknown> },
  version: string
): Promise<Record<string, unknown> | null> {
  const id = req.id ?? null;

  switch (req.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "castov",
            version,
          },
          capabilities: {
            tools: {},
          },
        },
      };

    case "notifications/initialized":
      return null;

    case "ping":
      return {
        jsonrpc: "2.0",
        id,
        result: {},
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          tools: MCP_TOOLS,
        },
      };

    case "tools/call": {
      const toolName = String(req.params?.name ?? "");
      const toolArgs = (req.params?.arguments as Record<string, unknown>) ?? {};
      const callResult = await handleMcpToolCall(toolName, toolArgs);

      return {
        jsonrpc: "2.0",
        id,
        result: callResult,
      };
    }

    default:
      if (req.id !== undefined && req.id !== null) {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Method not found: ${req.method}`,
          },
        };
      }
      return null;
  }
}
