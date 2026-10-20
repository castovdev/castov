import * as vscode from "vscode";
import { McpServerConfig, McpTool } from "../types/mcp";
import { StdioMcpClient } from "../client/stdio-client";

export class McpTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: "server" | "tool",
    public readonly serverConfig?: McpServerConfig,
    public readonly tool?: McpTool
  ) {
    super(label, collapsibleState);

    if (itemType === "server") {
      this.contextValue = "mcpServer";
      this.iconPath = new vscode.ThemeIcon("server-process");
      this.description = serverConfig?.command;
      this.tooltip = `Config: ${serverConfig?.configSource}\nCommand: ${serverConfig?.command} ${serverConfig?.args.join(" ")}`;
    } else {
      this.contextValue = "mcpTool";
      this.iconPath = new vscode.ThemeIcon("tools");
      this.description = tool?.description ? tool.description.slice(0, 40) + "..." : "";
      this.tooltip = `${tool?.name}: ${tool?.description || "No description"}`;
      this.command = {
        command: "mcpInspector.testTool",
        title: "Test Tool",
        arguments: [serverConfig, tool],
      };
    }
  }
}

export class McpServersTreeDataProvider implements vscode.TreeDataProvider<McpTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<McpTreeItem | undefined | void> = new vscode.EventEmitter<McpTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<McpTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  private servers: McpServerConfig[] = [];
  private serverToolsMap = new Map<string, McpTool[]>();

  constructor(initialServers: McpServerConfig[]) {
    this.servers = initialServers;
  }

  public refresh(servers: McpServerConfig[]): void {
    this.servers = servers;
    this.serverToolsMap.clear();
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: McpTreeItem): vscode.TreeItem {
    return element;
  }

  public async getChildren(element?: McpTreeItem): Promise<McpTreeItem[]> {
    if (!element) {
      if (this.servers.length === 0) {
        return [];
      }
      return this.servers.map(
        (s) => new McpTreeItem(s.name, vscode.TreeItemCollapsibleState.Collapsed, "server", s)
      );
    }

    if (element.itemType === "server" && element.serverConfig) {
      const server = element.serverConfig;
      if (this.serverToolsMap.has(server.name)) {
        const tools = this.serverToolsMap.get(server.name)!;
        return tools.map(
          (t) => new McpTreeItem(t.name, vscode.TreeItemCollapsibleState.None, "tool", server, t)
        );
      }

      try {
        const client = new StdioMcpClient(server);
        await client.connect();
        const tools = await client.listTools();
        client.disconnect();
        this.serverToolsMap.set(server.name, tools);
        return tools.map(
          (t) => new McpTreeItem(t.name, vscode.TreeItemCollapsibleState.None, "tool", server, t)
        );
      } catch (err: any) {
        return [
          new McpTreeItem(
            `Error: ${err.message}`,
            vscode.TreeItemCollapsibleState.None,
            "tool",
            server
          ),
        ];
      }
    }

    return [];
  }
}
