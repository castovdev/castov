import * as vscode from "vscode";
import { LogAnalysisReport } from "../types/log-story";

export class LogStoryStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      90
    );
    this.statusBarItem.command = "logStory.openDashboard";
    this.statusBarItem.text = "$(book) Log Story";
    this.statusBarItem.tooltip = "Click to open Log Story Analyzer";
    this.statusBarItem.show();
  }

  public updateReport(report: LogAnalysisReport): void {
    if (report.rootCause) {
      this.statusBarItem.text = `$(flame) Root Cause: ${report.rootCause.service}`;
      this.statusBarItem.tooltip = `Root Cause Detected in ${report.rootCause.service}: ${report.rootCause.message}\nClick to view full call graph story`;
      this.statusBarItem.color = "#f43f5e";
    } else if (report.errorCount > 0) {
      this.statusBarItem.text = `$(warning) Logs: ${report.errorCount} Errors`;
      this.statusBarItem.tooltip = `${report.errorCount} errors detected across ${report.totalTraces} traces.`;
      this.statusBarItem.color = "#f59e0b";
    } else {
      this.statusBarItem.text = `$(check) Logs: Clean (${report.totalRawLines})`;
      this.statusBarItem.tooltip = `All ${report.totalRawLines} log lines parsed clean. Zero unhandled errors.`;
      this.statusBarItem.color = "#10b981";
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
  }
}
