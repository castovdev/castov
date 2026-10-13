"use client";

import { useState } from "react";
import { Database, GitCommit, GitBranch, GitMerge, Clock, FileJson, CheckCircle } from "lucide-react";

interface Commit {
  id: string;
  parentId: string | null;
  message: string;
  data: string; // JSON string
  timestamp: number;
}

export function ChronoStateDbTool() {
  const [commits, setCommits] = useState<Commit[]>([
    { id: "genesis", parentId: null, message: "Initial DB Setup", data: '{"users": []}', timestamp: Date.now() }
  ]);
  const [head, setHead] = useState<string>("genesis");
  const [branch, setBranch] = useState<string>("main");
  const [currentData, setCurrentData] = useState('{"users": []}');
  const [commitMsg, setCommitMsg] = useState("");

  const headCommit = commits.find(c => c.id === head);

  const generateId = () => Math.random().toString(36).substring(2, 8);

  const handleCommit = () => {
    try {
      JSON.parse(currentData); // Validate JSON
      if (!commitMsg) return alert("Commit message required.");
      const newId = generateId();
      const newCommit: Commit = {
        id: newId,
        parentId: head,
        message: commitMsg,
        data: currentData,
        timestamp: Date.now()
      };
      setCommits([...commits, newCommit]);
      setHead(newId);
      setCommitMsg("");
    } catch (e) {
      alert("Invalid JSON data. Cannot commit broken state.");
    }
  };

  const timeTravel = (commitId: string) => {
    const c = commits.find(x => x.id === commitId);
    if (c) {
      setHead(c.id);
      setCurrentData(c.data);
    }
  };

  return (
    <div className="space-y-6 text-white max-w-6xl mx-auto">
      <div className="bg-[#020205] border border-[#10B981]/20 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="flex items-center gap-4 mb-8">
          <Database className="w-10 h-10 text-[#10B981]" />
          <div>
            <h2 className="text-3xl font-black uppercase tracking-widest text-[#10B981] flex items-center gap-2">
              Chrono-State DB
            </h2>
            <p className="text-muted font-mono text-xs mt-1">Local-First Git-Versioned NoSQL Database Simulator</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Database State */}
          <div className="space-y-4">
            <h3 className="font-bold text-[#00f0FF] uppercase tracking-widest flex items-center gap-2 mb-2"><FileJson className="w-4 h-4"/> Live Data Editor</h3>
            <textarea 
              aria-label="Live JSON Data Editor"
              value={currentData}
              onChange={e => setCurrentData(e.target.value)}
              className="w-full h-64 bg-black/50 border border-[#00f0FF]/30 rounded-xl p-4 font-mono text-[#00f0FF] outline-none focus:border-[#00f0FF] shadow-inner resize-none"
            />
            
            <div className="flex gap-2">
              <input 
                type="text" aria-label="Commit Message" value={commitMsg} onChange={e => setCommitMsg(e.target.value)}
                placeholder="COMMIT MESSAGE (e.g., Added user Alice)"
                className="flex-1 bg-black border border-white/20 rounded-lg px-4 font-mono text-sm outline-none"
              />
              <button 
                onClick={handleCommit}
                className="px-6 py-2 bg-[#10B981] text-black font-bold uppercase tracking-widest rounded-lg hover:shadow-[0_0_15px_#10B981] transition-all"
              >
                Commit State
              </button>
            </div>
          </div>

          {/* Time Travel Tree */}
          <div className="bg-black/80 border border-white/10 rounded-xl p-6 h-[400px] overflow-auto shadow-inner relative">
            <div className="absolute top-4 right-4 text-xs font-mono text-muted uppercase border border-white/10 px-2 py-1 rounded">
              HEAD: <span className="text-white font-bold">{head}</span>
            </div>
            <h3 className="font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6"><Clock className="w-4 h-4"/> Merkle Timeline</h3>
            
            <div className="space-y-0 relative pl-4 border-l-2 border-white/20">
              {commits.map((c, i) => (
                <div key={c.id} className="relative mb-6">
                  <div className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 ${head === c.id ? "bg-[#10B981] border-[#10B981] shadow-[0_0_10px_#10B981]" : "bg-black border-white/40"}`} />
                  <div className="pl-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#a855f7] bg-[#a855f7]/10 px-1 rounded">{c.id}</span>
                      <span className="text-sm font-bold">{c.message}</span>
                      {head === c.id && <span className="text-[10px] bg-[#10B981]/20 text-[#10B981] px-2 py-0.5 rounded uppercase font-bold border border-[#10B981]/50"><CheckCircle className="w-3 h-3 inline mr-1"/> ACTIVE</span>}
                    </div>
                    <button 
                      onClick={() => timeTravel(c.id)}
                      disabled={head === c.id}
                      className="mt-2 text-xs font-mono text-[#00f0FF] hover:underline disabled:opacity-30 disabled:no-underline"
                    >
                      {head === c.id ? "CURRENT STATE" : "TIME TRAVEL HERE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
