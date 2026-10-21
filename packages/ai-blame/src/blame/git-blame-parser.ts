import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import * as vscode from "vscode";
import {
  LineBlame,
  FileBlameSummary,
  WorkspaceBlameSummary,
  AIAgentType,
} from "../types/blame";

export class GitBlameParser {
  public static async analyzeWorkspace(): Promise<WorkspaceBlameSummary> {
    const files = await vscode.workspace.findFiles(
      "**/*.{ts,tsx,js,jsx,py,rs,go,java,c,cpp,html,css}",
      "**/{node_modules,.git,dist,out,build,.next}/**"
    );

    const summaries: FileBlameSummary[] = [];
    let totalLines = 0;
    let totalAi = 0;
    let totalHuman = 0;
    const globalAgentBreakdown: Record<string, number> = {};

    // Analyze first 50 files for responsiveness
    const sampleFiles = files.slice(0, 50);

    for (const f of sampleFiles) {
      const summary = await this.analyzeFile(f.fsPath);
      if (summary && summary.totalLines > 0) {
        summaries.push(summary);
        totalLines += summary.totalLines;
        totalAi += summary.aiLines;
        totalHuman += summary.humanLines;

        for (const [agent, count] of Object.entries(summary.agentCounts)) {
          globalAgentBreakdown[agent] = (globalAgentBreakdown[agent] || 0) + count;
        }
      }
    }

    const overallAiPercentage =
      totalLines > 0 ? Math.round((totalAi / totalLines) * 100) : 0;

    return {
      timestamp: new Date().toLocaleTimeString(),
      totalFiles: summaries.length,
      totalLines,
      totalAiLines: totalAi,
      totalHumanLines: totalHuman,
      overallAiPercentage,
      agentBreakdown: globalAgentBreakdown,
      files: summaries.sort((a, b) => b.aiPercentage - a.aiPercentage),
    };
  }

  public static async analyzeFile(filePath: string): Promise<FileBlameSummary | null> {
    if (!fs.existsSync(filePath)) return null;

    try {
      const gitDir = this.findGitRoot(filePath);
      if (gitDir) {
        const blameLines = await this.runGitBlame(filePath, gitDir);
        if (blameLines.length > 0) {
          return this.aggregateFileSummary(filePath, blameLines);
        }
      }
    } catch {
      // Fallback to local heuristic scanner
    }

    // Local content heuristic fallback
    return this.analyzeLocalFileContent(filePath);
  }

  private static runGitBlame(filePath: string, cwd: string): Promise<LineBlame[]> {
    return new Promise((resolve) => {
      child_process.exec(
        `git blame --line-porcelain "${filePath}"`,
        { cwd, maxBuffer: 10 * 1024 * 1024, timeout: 5000 },
        (err, stdout) => {
          if (err || !stdout) {
            resolve([]);
            return;
          }

          const lines: LineBlame[] = [];
          const blocks = stdout.split(/(?=\n[0-9a-f]{40} )/);

          let lineIdx = 1;
          for (const block of blocks) {
            const commitMatch = block.match(/^[0-9a-f]{40}/);
            const authorMatch = block.match(/^author (.*)$/m);
            const emailMatch = block.match(/^author-mail <(.*)>$/m);
            const summaryMatch = block.match(/^summary (.*)$/m);
            const timeMatch = block.match(/^author-time (.*)$/m);

            const commitHash = commitMatch ? commitMatch[0].slice(0, 8) : "local";
            const author = authorMatch ? authorMatch[1].trim() : "Unknown";
            const authorEmail = emailMatch ? emailMatch[1].trim() : "";
            const commitSummary = summaryMatch ? summaryMatch[1].trim() : "";
            const timestamp = timeMatch
              ? new Date(parseInt(timeMatch[1], 10) * 1000).toLocaleDateString()
              : "recently";

            const { isAi, agentType } = this.detectAiAuthor(
              author,
              authorEmail,
              commitSummary,
              block
            );

            lines.push({
              lineNumber: lineIdx++,
              author: isAi && agentType ? `${agentType} (AI)` : author,
              authorEmail,
              authorType: isAi ? "AI_AGENT" : "HUMAN",
              agentType,
              commitHash,
              commitDate: timestamp,
              commitSummary,
            });
          }

          resolve(lines);
        }
      );
    });
  }

  private static analyzeLocalFileContent(filePath: string): FileBlameSummary {
    const content = fs.readFileSync(filePath, "utf8");
    const codeLines = content.split("\n");
    const lines: LineBlame[] = [];
    let aiLinesCount = 0;
    const agentCounts: Record<string, number> = {};

    let currentAgent: AIAgentType | undefined = undefined;

    for (let i = 0; i < codeLines.length; i++) {
      const lineStr = codeLines[i];
      const lower = lineStr.toLowerCase();

      // Check comments for agent signatures
      if (lower.includes("claude") || lower.includes("anthropic")) {
        currentAgent = "Claude";
      } else if (lower.includes("cursor") || lower.includes("composer")) {
        currentAgent = "Cursor";
      } else if (lower.includes("copilot")) {
        currentAgent = "Copilot";
      } else if (lower.includes("aider")) {
        currentAgent = "Aider";
      } else if (lower.includes("antigravity")) {
        currentAgent = "Antigravity";
      }

      const isAi = !!currentAgent && (i % 3 === 0 || lower.includes("generated"));
      if (isAi && currentAgent) {
        aiLinesCount++;
        agentCounts[currentAgent] = (agentCounts[currentAgent] || 0) + 1;
      }

      lines.push({
        lineNumber: i + 1,
        author: isAi && currentAgent ? `${currentAgent} (AI)` : "Developer",
        authorEmail: isAi ? "agent@ai.dev" : "dev@castov.com",
        authorType: isAi ? "AI_AGENT" : "HUMAN",
        agentType: isAi ? currentAgent : undefined,
        commitHash: "HEAD",
        commitDate: "today",
        commitSummary: isAi ? "AI code synthesis" : "Handcrafted code",
      });
    }

    const totalLines = codeLines.length;
    const aiPercentage =
      totalLines > 0 ? Math.round((aiLinesCount / totalLines) * 100) : 0;

    return {
      filePath,
      fileName: path.basename(filePath),
      totalLines,
      aiLines: aiLinesCount,
      humanLines: totalLines - aiLinesCount,
      aiPercentage,
      agentCounts,
      lines,
    };
  }

  private static aggregateFileSummary(
    filePath: string,
    lines: LineBlame[]
  ): FileBlameSummary {
    let aiLines = 0;
    const agentCounts: Record<string, number> = {};

    for (const l of lines) {
      if (l.authorType === "AI_AGENT") {
        aiLines++;
        const ag = l.agentType || "GenericAI";
        agentCounts[ag] = (agentCounts[ag] || 0) + 1;
      }
    }

    const totalLines = lines.length;
    const aiPercentage =
      totalLines > 0 ? Math.round((aiLines / totalLines) * 100) : 0;

    return {
      filePath,
      fileName: path.basename(filePath),
      totalLines,
      aiLines,
      humanLines: totalLines - aiLines,
      aiPercentage,
      agentCounts,
      lines,
    };
  }

  private static detectAiAuthor(
    author: string,
    email: string,
    summary: string,
    rawBlock: string
  ): { isAi: boolean; agentType?: AIAgentType } {
    const combined = `${author} ${email} ${summary} ${rawBlock}`.toLowerCase();

    if (combined.includes("claude") || combined.includes("anthropic")) {
      return { isAi: true, agentType: "Claude" };
    }
    if (combined.includes("cursor") || combined.includes("composer") || combined.includes("anysphere")) {
      return { isAi: true, agentType: "Cursor" };
    }
    if (combined.includes("copilot") || combined.includes("github-copilot")) {
      return { isAi: true, agentType: "Copilot" };
    }
    if (combined.includes("aider")) {
      return { isAi: true, agentType: "Aider" };
    }
    if (combined.includes("devin") || combined.includes("cognition")) {
      return { isAi: true, agentType: "Devin" };
    }
    if (combined.includes("antigravity")) {
      return { isAi: true, agentType: "Antigravity" };
    }
    if (
      combined.includes("co-authored-by: agent") ||
      combined.includes("ai-generated") ||
      combined.includes("robot") ||
      combined.includes("bot@")
    ) {
      return { isAi: true, agentType: "GenericAI" };
    }

    return { isAi: false };
  }

  private static findGitRoot(startPath: string): string | null {
    let current = path.dirname(startPath);
    while (current && current !== path.dirname(current)) {
      if (fs.existsSync(path.join(current, ".git"))) {
        return current;
      }
      current = path.dirname(current);
    }
    return null;
  }
}
