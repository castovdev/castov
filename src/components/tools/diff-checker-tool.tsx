"use client";

import { useMemo } from "react";
import { useUrlState } from "@/hooks/use-url-state";

function computeLineDiff(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  if (oldLines.length * newLines.length > 10000000) {
     return [{ type: 'unchanged', value: "Diff too large to compute in browser." }];
  }

  const dp: number[][] = Array(oldLines.length + 1).fill(0).map(() => Array(newLines.length + 1).fill(0));
  
  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const temp: { type: 'added' | 'removed' | 'unchanged', value: string }[] = [];
  let i = oldLines.length;
  let j = newLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      temp.push({ type: 'unchanged', value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ type: 'added', value: newLines[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      temp.push({ type: 'removed', value: oldLines[i - 1] });
      i--;
    }
  }
  
  return temp.reverse();
}

export function DiffCheckerTool() {
  const [text1, setText1, share1] = useUrlState("text1", "function hello() {\n  console.log('world');\n}");
  const [text2, setText2, share2] = useUrlState("text2", "function hello() {\n  console.log('world!');\n}");

  const diff = useMemo(() => computeLineDiff(text1, text2), [text1, text2]);

  const handleShare = () => {
    share1();
    setTimeout(() => {
      share2();
    }, 50);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Diff Checker</h2>
          <p className="text-muted text-sm mt-1">Compare text or code line by line to see what changed.</p>
        </div>
        <button 
          onClick={handleShare}
          className="px-4 py-2 bg-primary text-primary-fg text-sm font-medium rounded hover:bg-primary/90 transition-colors"
        >
          Copy Share Link
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">Original Text</h3>
          </div>
          <textarea
            aria-label="Original text"
            className="w-full h-[300px] p-4 bg-card text-card-fg border border-line rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">Modified Text</h3>
          </div>
          <textarea
            aria-label="Modified text"
            className="w-full h-[300px] p-4 bg-card text-card-fg border border-line rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="space-y-2 mt-8">
        <h3 className="font-medium text-foreground">Diff Result</h3>
        <div className="w-full overflow-x-auto bg-card border border-line rounded-lg p-4 font-mono text-sm leading-6">
          {diff.map((line, idx) => {
            let bgColor = "transparent";
            let textColor = "inherit";
            let prefix = "  ";
            
            if (line.type === "added") {
              bgColor = "rgba(34, 197, 94, 0.15)";
              textColor = "#22c55e";
              prefix = "+ ";
            } else if (line.type === "removed") {
              bgColor = "rgba(239, 68, 68, 0.15)";
              textColor = "#ef4444";
              prefix = "- ";
            }
            
            return (
              <div 
                key={idx} 
                style={{ backgroundColor: bgColor, color: textColor }}
                className="whitespace-pre-wrap px-2 rounded-sm"
              >
                <span className="select-none opacity-50 mr-4">{prefix}</span>
                {line.value || " "}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
