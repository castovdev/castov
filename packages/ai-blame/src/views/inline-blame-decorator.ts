import * as vscode from "vscode";
import { GitBlameParser } from "../blame/git-blame-parser";
import { FileBlameSummary } from "../types/blame";

export class InlineBlameDecorator implements vscode.Disposable {
  private decorationType: vscode.TextEditorDecorationType;
  private currentSummary: FileBlameSummary | null = null;
  private currentFilePath: string | null = null;
  private enabled = true;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: "0 0 0 3em",
        color: new vscode.ThemeColor("editorCodeLens.foreground"),
      },
    });

    vscode.window.onDidChangeActiveTextEditor(() => this.updateActiveEditor());
    vscode.window.onDidChangeTextEditorSelection(() => this.updateCursorBlame());

    this.updateActiveEditor();
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.clear();
    } else {
      this.updateCursorBlame();
    }
    return this.enabled;
  }

  public async updateActiveEditor(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.enabled) {
      this.clear();
      return;
    }

    const filePath = editor.document.fileName;
    if (this.currentFilePath !== filePath) {
      this.currentFilePath = filePath;
      this.currentSummary = await GitBlameParser.analyzeFile(filePath);
    }

    this.updateCursorBlame();
  }

  private updateCursorBlame(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.enabled || !this.currentSummary) {
      this.clear();
      return;
    }

    const line = editor.selection.active.line;
    const blameItem = this.currentSummary.lines[line];
    if (!blameItem) {
      this.clear();
      return;
    }

    const lineEndPos = editor.document.lineAt(line).range.end;
    const isAi = blameItem.authorType === "AI_AGENT";
    const icon = isAi ? "🤖" : "👤";
    const authorStr = isAi
      ? `${blameItem.agentType || "AI Agent"}`
      : blameItem.author;

    const text = `   ${icon} ${authorStr} • ${blameItem.commitDate} • ${blameItem.commitSummary}`;

    const decoration: vscode.DecorationOptions = {
      range: new vscode.Range(lineEndPos, lineEndPos),
      renderOptions: {
        after: {
          contentText: text,
          color: isAi ? "#c084fc" : "#64748b",
        },
      },
    };

    editor.setDecorations(this.decorationType, [decoration]);
  }

  private clear(): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.setDecorations(this.decorationType, []);
    }
  }

  public dispose(): void {
    this.decorationType.dispose();
  }
}
