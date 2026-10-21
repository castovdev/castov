import * as vscode from "vscode";

export class RtlCommentHoverProvider implements vscode.HoverProvider {
  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(position.line);
    const text = line.text;

    // Check if line is a comment and contains Arabic or Hebrew
    const isComment = /^\s*(?:\/\/|#|\/\*|\*)/.test(text);
    const hasRtl = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF]/.test(text);

    if (!isComment || !hasRtl) return null;

    // Clean comment marker
    const cleanComment = text.replace(/^\s*(?:\/\/|#|\/\*|\*)\s*/, "").trim();

    // Isolate English words/identifiers inside the Arabic comment to prevent BiDi text jumping
    const formattedHtml = cleanComment.replace(/([A-Za-z0-9_.\-/:]{2,})/g, '<bdi style="direction:ltr; font-family:monospace; background:rgba(255,255,255,0.1); padding:1px 4px; border-radius:3px;">$1</bdi>');

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown(`### 📖 Castov RTL Comment Reader\n\n`);
    md.appendMarkdown(
      `<div dir="rtl" style="font-family:'Segoe UI', Tahoma, sans-serif; font-size:14px; line-height:1.7; padding:8px; border-right:3px solid #3b82f6; background:rgba(59,130,246,0.06); border-radius:4px;">\n` +
      `${formattedHtml}\n` +
      `</div>\n\n`
    );
    md.appendMarkdown(`*Rendered with bidirectional phrase isolation to keep code identifiers intact.*`);

    return new vscode.Hover(md, line.range);
  }
}
