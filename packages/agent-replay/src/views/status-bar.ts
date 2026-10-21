import * as vscode from "vscode";
import { SessionRecorder } from "../recorder/session-recorder";

export class ReplayStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private recorder: SessionRecorder;

  constructor() {
    this.recorder = SessionRecorder.getInstance();
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      91
    );
    this.statusBarItem.command = "agentReplay.openDashboard";

    this.recorder.on("snapshotAdded", () => this.update());
    this.recorder.on("cleared", () => this.update());
    this.recorder.on("rewound", () => this.update());

    this.update();
    this.statusBarItem.show();
  }

  public update(): void {
    const snapshots = this.recorder.getSnapshots();
    if (snapshots.length === 0) {
      this.statusBarItem.text = "$(history) Replay: 0";
      this.statusBarItem.tooltip = "Agent Session Replay: No edit steps recorded.";
      this.statusBarItem.color = undefined;
    } else {
      const latest = snapshots[snapshots.length - 1];
      this.statusBarItem.text = `$(history) Replay: Step ${snapshots.length}`;
      this.statusBarItem.tooltip = `Agent Session Replay: ${snapshots.length} edit steps recorded.\nLatest: ${latest.fileName} (+${latest.linesAdded}, -${latest.linesRemoved})\nClick to open diff scrubber and rewind`;
      this.statusBarItem.color = "#c084fc";
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
