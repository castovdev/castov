import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";
import * as vscode from "vscode";
import { FileChangeSnapshot } from "../types/replay";

export class SessionRecorder extends EventEmitter {
  private static instance: SessionRecorder;
  private snapshots: FileChangeSnapshot[] = [];
  private filePreviousContents: Map<string, string> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  public static getInstance(): SessionRecorder {
    if (!SessionRecorder.instance) {
      SessionRecorder.instance = new SessionRecorder();
    }
    return SessionRecorder.instance;
  }

  private constructor() {
    super();
  }

  public getSnapshots(): FileChangeSnapshot[] {
    return this.snapshots;
  }

  public getSnapshot(stepNumber: number): FileChangeSnapshot | undefined {
    return this.snapshots.find((s) => s.stepNumber === stepNumber);
  }

  public clearSession(): void {
    this.snapshots = [];
    this.filePreviousContents.clear();
    this.emit("cleared");
  }

  public trackFileOpen(filePath: string, content: string): void {
    if (!this.filePreviousContents.has(filePath)) {
      this.filePreviousContents.set(filePath, content);
    }
  }

  public handleDocumentChange(document: vscode.TextDocument): void {
    const filePath = document.fileName;
    if (filePath.includes("node_modules") || filePath.includes(".git")) return;

    const previous = this.filePreviousContents.get(filePath);
    const current = document.getText();

    if (previous === undefined) {
      this.filePreviousContents.set(filePath, current);
      return;
    }

    if (previous === current) return;

    // Debounce capture by 1200ms of inactivity
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.recordChange(filePath, previous, current);
      this.filePreviousContents.set(filePath, current);
      this.debounceTimers.delete(filePath);
    }, 1200);

    this.debounceTimers.set(filePath, timer);
  }

  public recordChange(
    filePath: string,
    before: string,
    after: string,
    customDesc?: string
  ): FileChangeSnapshot {
    const stepNumber = this.snapshots.length + 1;
    const { added, removed } = this.calculateDiffStats(before, after);

    const snapshot: FileChangeSnapshot = {
      id: `step-${stepNumber}-${Date.now()}`,
      stepNumber,
      timestamp: new Date().toLocaleTimeString(),
      filePath,
      fileName: path.basename(filePath),
      linesAdded: added,
      linesRemoved: removed,
      beforeContent: before,
      afterContent: after,
      description: customDesc || `Step ${stepNumber}: Modified ${path.basename(filePath)} (+${added}, -${removed})`,
    };

    this.snapshots.push(snapshot);
    this.emit("snapshotAdded", snapshot);
    return snapshot;
  }

  public async rewindToStep(stepNumber: number): Promise<boolean> {
    const targetSnapshot = this.snapshots.find((s) => s.stepNumber === stepNumber);
    if (!targetSnapshot) return false;

    try {
      // Revert the file on disk to its "beforeContent" state of this step (or after if chosen)
      fs.writeFileSync(targetSnapshot.filePath, targetSnapshot.beforeContent, "utf8");
      this.filePreviousContents.set(targetSnapshot.filePath, targetSnapshot.beforeContent);
      this.emit("rewound", targetSnapshot);
      return true;
    } catch {
      return false;
    }
  }

  private calculateDiffStats(
    before: string,
    after: string
  ): { added: number; removed: number } {
    const linesBefore = before.split("\n");
    const linesAfter = after.split("\n");

    const added = Math.max(0, linesAfter.length - linesBefore.length);
    const removed = Math.max(0, linesBefore.length - linesAfter.length);

    // Approximate modified lines
    let diffs = 0;
    const minLen = Math.min(linesBefore.length, linesAfter.length);
    for (let i = 0; i < minLen; i++) {
      if (linesBefore[i] !== linesAfter[i]) diffs++;
    }

    return {
      added: added + diffs,
      removed: removed + diffs,
    };
  }
}
