"use client";

import { useEffect, useState } from "react";
import { useUrlState } from "@/hooks/use-url-state";
import { CodeEditor } from "@/components/ui/code-editor";

function generateTsInterfaces(jsonString: string): string {
  try {
    const obj = JSON.parse(jsonString);
    let output = "";
    
    const parseObject = (name: string, obj: any): string => {
      if (typeof obj !== "object" || obj === null) {
        return "export type " + name + " = " + typeof obj + ";\n";
      }
      
      let ts = "export interface " + name + " {\n";
      for (const [key, value] of Object.entries(obj)) {
        if (value === null) {
          ts += "  " + key + ": any;\n";
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            const first = value[0];
            if (typeof first === "object" && first !== null) {
               const typeName = key.charAt(0).toUpperCase() + key.slice(1) + "Item";
               output += parseObject(typeName, first) + "\n";
               ts += "  " + key + ": " + typeName + "[];\n";
            } else {
               ts += "  " + key + ": " + typeof first + "[];\n";
            }
          } else {
            ts += "  " + key + ": any[];\n";
          }
        } else if (typeof value === "object") {
          const typeName = key.charAt(0).toUpperCase() + key.slice(1);
          output += parseObject(typeName, value) + "\n";
          ts += "  " + key + ": " + typeName + ";\n";
        } else {
          ts += "  " + key + ": " + typeof value + ";\n";
        }
      }
      ts += "}\n";
      return ts;
    };
    
    return parseObject("Root", obj) + "\n" + output;
  } catch (e) {
    return "// Error parsing JSON\n// " + (e as Error).message;
  }
}

export function JsonToTsTool() {
  const [json, setJson, shareJson] = useUrlState("json", "{\n  \"name\": \"John\",\n  \"age\": 30\n}");
  const [ts, setTs] = useState("");

  useEffect(() => {
    setTs(generateTsInterfaces(json));
  }, [json]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">JSON to TypeScript</h2>
          <p className="text-muted text-sm mt-1">Convert JSON structures into TypeScript interfaces automatically.</p>
        </div>
        <button 
          onClick={shareJson}
          className="px-4 py-2 bg-primary text-primary-fg text-sm font-medium rounded hover:bg-primary/90 transition-colors"
        >
          Copy Share Link
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">JSON Input</h3>
          </div>
          <CodeEditor 
            value={json} 
            onChange={(val) => setJson(val || "")} 
            language="json" 
            height="500px"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-foreground">TypeScript Output</h3>
          </div>
          <CodeEditor 
            value={ts} 
            language="typescript" 
            readOnly 
            height="500px"
          />
        </div>
      </div>
    </div>
  );
}
