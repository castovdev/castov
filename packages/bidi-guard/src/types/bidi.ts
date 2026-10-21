export type ThreatCategory =
  | "trojan_source"
  | "invisible_char"
  | "homoglyph"
  | "rtl_comment";

export interface UnicodeThreat {
  id: string;
  category: ThreatCategory;
  charName: string;
  codePoint: string;
  severity: "critical" | "high" | "medium" | "info";
  filePath: string;
  line: number;
  col: number;
  description: string;
  snippet: string;
  quickFix?: "remove" | "replace_ascii";
}

export interface WorkspaceScanSummary {
  totalFilesScanned: number;
  threats: UnicodeThreat[];
  trojanSourceCount: number;
  invisibleCount: number;
  homoglyphCount: number;
  rtlCommentsCount: number;
}
