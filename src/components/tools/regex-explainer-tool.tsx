"use client";

import { useState, useMemo } from "react";
import { RegExpParser } from "regexpp";
import type { AST } from "regexpp";
import { AlertCircleIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react";

const PRESETS = [
  { name: "Email Address", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", testString: "hello@castov.com" },
  { name: "URL", pattern: "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$", testString: "https://castov.com/tools" },
  { name: "IP Address (v4)", pattern: "^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$", testString: "192.168.1.1" },
  { name: "URL Slug", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", testString: "my-awesome-post-123" },
  { name: "Phone (US)", pattern: "^\\+?1?\\s*\\(?-?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$", testString: "+1 (555) 123-4567" },
  { name: "Date (YYYY-MM-DD)", pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$", testString: "2026-10-05" },
];

function describeNode(node: AST.Node): { title: string; desc: string } {
  switch (node.type) {
    case "Alternative":
      return { title: "Alternative", desc: "A sequence of elements to match." };
    case "Pattern":
      return { title: "Regex Pattern", desc: "The root pattern." };
    case "Character":
      return { title: "Character", desc: `Matches the literal character "${String.fromCodePoint(node.value)}".` };
    case "CharacterSet":
      if (node.kind === "any") return { title: "Any Character", desc: "Matches any single character except line breaks (.)." };
      if (node.kind === "digit") return { title: "Digit", desc: "Matches any decimal digit." };
      if (node.kind === "space") return { title: "Whitespace", desc: "Matches any whitespace character." };
      if (node.kind === "word") return { title: "Word Character", desc: "Matches any word character (alphanumeric & underscore)." };
      return { title: "Character Set", desc: "Matches a set of characters." };
    case "CharacterClass":
      return { title: "Character Class", desc: `Matches ${node.negate ? "none" : "any"} of the enclosed characters.` };
    case "CharacterClassRange":
      return { title: "Character Range", desc: `Matches a character in the range between the start and end characters.` };
    case "Assertion":
      if (node.kind === "start") return { title: "Start Anchor", desc: "Matches the start of the string or line." };
      if (node.kind === "end") return { title: "End Anchor", desc: "Matches the end of the string or line." };
      if (node.kind === "word") return { title: "Word Boundary", desc: "Matches a word boundary position." };
      if (node.kind === "lookahead") return { title: "Lookahead", desc: `Matches if the pattern ${node.negate ? "does not follow" : "follows"} this position.` };
      if (node.kind === "lookbehind") return { title: "Lookbehind", desc: `Matches if the pattern ${node.negate ? "does not precede" : "precedes"} this position.` };
      return { title: "Assertion", desc: "A zero-width assertion." };
    case "Quantifier":
      let qty = "";
      if (node.min === 0 && node.max === Infinity) qty = "zero or more times (*)";
      else if (node.min === 1 && node.max === Infinity) qty = "one or more times (+)";
      else if (node.min === 0 && node.max === 1) qty = "zero or one time (?)";
      else if (node.min === node.max) qty = `exactly ${node.min} times`;
      else if (node.max === Infinity) qty = `${node.min} or more times`;
      else qty = `between ${node.min} and ${node.max} times`;
      return { title: "Quantifier", desc: `Matches the preceding element ${qty}${node.greedy ? "" : ", lazily"}.` };
    case "CapturingGroup":
      return { title: `Capturing Group ${node.name ? `(?<${node.name}>)` : ""}`, desc: "Groups multiple tokens and captures the match." };
    case "Group":
      return { title: "Non-Capturing Group", desc: "Groups tokens together without capturing the match." };
    case "Backreference":
      return { title: "Backreference", desc: "Matches the same text as previously matched by a capturing group." };
    default:
      return { title: node.type, desc: "" };
  }
}

function ASTNodeView({ node, regex, depth = 0 }: { node: AST.Node; regex: string; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { title, desc } = describeNode(node);

  // Get raw text from original regex using node.start and node.end
  const rawText = regex.substring(node.start, node.end);

  let children: AST.Node[] = [];
  if (node.type === "Pattern") children = node.alternatives;
  else if (node.type === "Alternative") children = node.elements;
  else if (node.type === "Quantifier") children = [node.element];
  else if (node.type === "CapturingGroup" || node.type === "Group") children = node.alternatives;
  else if (node.type === "Assertion" && (node.kind === "lookahead" || node.kind === "lookbehind")) children = node.alternatives;
  else if (node.type === "CharacterClass") children = node.elements;
  else if (node.type === "CharacterClassRange") children = [node.min, node.max];

  const hasChildren = children.length > 0;

  return (
    <div className={`flex flex-col ${depth > 0 ? "ml-4 border-l border-line pl-4 mt-2" : ""}`}>
      <div
        className={`flex flex-col bg-card border border-line rounded-xl p-3 ${hasChildren ? "cursor-pointer hover:border-primary/30 hover:shadow-sm" : ""} transition-all`}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren && (
              <span className="text-muted">
                {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
              </span>
            )}
            <span className="font-bold text-sm text-fg whitespace-nowrap">{title}</span>
            {rawText && (
              <span className="text-xs font-mono bg-field border border-line px-1.5 py-0.5 rounded text-primary truncate max-w-[200px]">
                {rawText}
              </span>
            )}
          </div>
        </div>
        {desc && <p className={`text-xs text-muted mt-1.5 ${hasChildren ? "ml-[22px]" : ""}`}>{desc}</p>}
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col gap-2 mt-2">
          {children.map((child, i) => (
            <ASTNodeView key={`${child.type}-${child.start}-${i}`} node={child} regex={regex} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface RegexMatch {
  text: string;
  index: number;
  groups: string[];
}

interface MatchExecutionResult {
  matches: RegexMatch[];
  error: string | null;
  timeMs: number;
}

function executeRegexMatch(pattern: string, flags: string, testString: string): MatchExecutionResult {
  if (!pattern) return { matches: [], error: null, timeMs: 0 };
  try {
    const start = performance.now();
    const re = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];
    let m: RegExpExecArray | null;
    let safeCount = 0;

    if (!re.global) {
      m = re.exec(testString);
      if (m) matches.push({ text: m[0], index: m.index, groups: m.slice(1) });
    } else {
      while ((m = re.exec(testString)) !== null && safeCount < 1000) {
        if (m[0].length === 0) re.lastIndex++; // Prevent infinite loops
        matches.push({ text: m[0], index: m.index, groups: m.slice(1) });
        safeCount++;
      }
    }

    const timeMs = performance.now() - start;
    return { matches, error: null, timeMs };
  } catch (err: any) {
    return { matches: [], error: err.message, timeMs: 0 };
  }
}

export function RegexExplainerTool() {
  const [pattern, setPattern] = useState(PRESETS[0].pattern);
  const [flags, setFlags] = useState("gm");
  const [testString, setTestString] = useState(PRESETS[0].testString);

  // Parse Regex to AST
  const astResult = useMemo(() => {
    try {
      const parser = new RegExpParser();
      const ast = parser.parsePattern(pattern);
      return { ast, error: null };
    } catch (err: any) {
      return { ast: null, error: err.message };
    }
  }, [pattern]);

  // Execute Match
  const matchResult = useMemo(
    () => executeRegexMatch(pattern, flags, testString),
    [pattern, flags, testString]
  );

  // Highlight matches in test string
  const renderHighlightedText = () => {
    if (matchResult.error || !pattern) return testString;
    if (matchResult.matches.length === 0) return testString;

    let lastIndex = 0;
    const elements: React.ReactNode[] = [];

    matchResult.matches.forEach((match, i) => {
      // Add text before match
      if (match.index > lastIndex) {
        elements.push(<span key={`text-${i}`}>{testString.substring(lastIndex, match.index)}</span>);
      }
      // Add match
      elements.push(
        <mark key={`match-${i}`} className="bg-primary/20 text-primary font-bold rounded px-0.5 border border-primary/30 shadow-sm">
          {match.text}
        </mark>
      );
      lastIndex = match.index + match.text.length;
    });

    // Add remaining text
    if (lastIndex < testString.length) {
      elements.push(<span key={`text-end`}>{testString.substring(lastIndex)}</span>);
    }

    return elements;
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(preset => (
          <button
            key={preset.name}
            onClick={() => {
              setPattern(preset.pattern);
              setTestString(preset.testString);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-card border border-line rounded-lg text-muted hover:text-primary hover:border-primary/30 transition-colors shadow-sm"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left Column: Editor & Tester */}
        <div className="flex flex-col gap-6">
          {/* Regex Input */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="font-bold text-fg flex items-center gap-2">
              <span className="text-primary font-mono text-xl">/</span>
              Regular Expression
            </h2>

            <div className="flex gap-2">
              <div className="flex-1 bg-field border border-line rounded-xl flex items-center px-4 shadow-sm focus-within:border-primary/50 transition-colors">
                <span className="text-muted font-mono text-lg select-none">/</span>
                <input
                  type="text"
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none px-2 py-3 font-mono text-fg"
                  placeholder="Enter regex pattern..."
                />
                <span className="text-muted font-mono text-lg select-none">/</span>
              </div>
              <input
                type="text"
                value={flags}
                onChange={e => setFlags(e.target.value)}
                className="w-16 bg-field border border-line rounded-xl px-3 py-3 font-mono text-fg focus:outline-none focus:border-primary/50 shadow-sm text-center"
                placeholder="gm"
                title="Regex Flags (e.g. g, m, i)"
              />
            </div>

            {astResult.error && (
              <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 p-3 rounded-lg border border-danger/20">
                <AlertCircleIcon size={16} />
                <span className="font-mono">{astResult.error}</span>
              </div>
            )}
            {matchResult.error && !astResult.error && (
              <div className="flex items-center gap-2 text-danger text-sm bg-danger/10 p-3 rounded-lg border border-danger/20">
                <AlertCircleIcon size={16} />
                <span className="font-mono">{matchResult.error}</span>
              </div>
            )}
          </div>

          {/* Test String */}
          <div className="bg-card border border-line rounded-2xl p-6 shadow-sm flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-fg">Test String</h2>
              <div className="text-xs text-muted font-mono">
                {matchResult.matches.length} matches • {matchResult.timeMs.toFixed(2)}ms
              </div>
            </div>

            <div className="relative flex-1 min-h-[200px]">
              {/* Highlight Overlay */}
              <div
                className="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap break-words pointer-events-none text-transparent leading-relaxed"
                aria-hidden="true"
              >
                {renderHighlightedText()}
              </div>
              {/* Actual Textarea */}
              <textarea
                value={testString}
                onChange={e => setTestString(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent border border-line rounded-xl p-4 font-mono text-sm text-fg focus:outline-none focus:border-primary/50 resize-none leading-relaxed transition-colors shadow-sm"
                spellCheck={false}
                placeholder="Enter test text here..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: AST Visualizer */}
        <div className="bg-card border border-line rounded-2xl p-6 shadow-sm flex flex-col h-[calc(100vh-12rem)] max-h-[800px] sticky top-24">
          <h2 className="font-bold text-fg mb-4">AST Explanation</h2>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {astResult.ast ? (
              <ASTNodeView node={astResult.ast} regex={pattern} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted text-sm italic">
                Valid regex required to generate AST.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
