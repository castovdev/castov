"use client";

import { useState, useMemo } from "react";
import { CopyIcon, CheckIcon, LayersIcon } from "lucide-react";

const EMBEDDING_MODELS = [
  { id: "openai-small", name: "OpenAI text-embedding-3-small", limit: 8191 },
  { id: "openai-ada", name: "OpenAI text-embedding-ada-002", limit: 8191 },
  { id: "cohere-eng", name: "Cohere embed-english-v3.0", limit: 512 },
  { id: "nomic-embed", name: "Nomic nomic-embed-text", limit: 8192 },
  { id: "bge-large", name: "BGE bge-large-en-v1.5", limit: 512 },
];

export function RagChunkSizeCalculator() {
  const [docTokens, setDocTokens] = useState<number>(50000);
  const [modelId, setModelId] = useState<string>("openai-small");
  const [chunkSize, setChunkSize] = useState<number>(1000);
  const [overlapTokens, setOverlapTokens] = useState<number>(200);
  const [copied, setCopied] = useState(false);

  const selectedModel = EMBEDDING_MODELS.find(m => m.id === modelId)!;

  const calculations = useMemo(() => {
    // Basic validation
    let actualChunkSize = Math.min(chunkSize, selectedModel.limit);
    let actualOverlap = Math.min(overlapTokens, actualChunkSize - 1);
    
    if (actualChunkSize <= actualOverlap) actualChunkSize = actualOverlap + 1;

    const stride = actualChunkSize - actualOverlap;
    const estimatedChunks = Math.ceil((docTokens - actualOverlap) / stride);
    const finalChunks = Math.max(1, estimatedChunks);
    
    // Estimate Vector DB storage (very rough heuristic: 1536 dims floats = ~6KB per chunk)
    // small: 1536 dims, bge: 1024, cohere: 1024. Just approximate 6KB per vector + metadata.
    const storageKB = finalChunks * 6;
    const storageMB = storageKB / 1024;

    return {
      actualChunkSize,
      actualOverlap,
      stride,
      finalChunks,
      storageMB
    };
  }, [docTokens, selectedModel, chunkSize, overlapTokens]);

  const handleCopy = () => {
    const text = `RAG Chunking Strategy\n` +
      `- Document Tokens: ${docTokens.toLocaleString()}\n` +
      `- Model: ${selectedModel.name} (Max ${selectedModel.limit})\n` +
      `- Target Chunk Size: ${calculations.actualChunkSize}\n` +
      `- Overlap: ${calculations.actualOverlap}\n` +
      `- Total Chunks: ${calculations.finalChunks.toLocaleString()}\n` +
      `- Est. Storage: ${calculations.storageMB < 1 ? '< 1' : calculations.storageMB.toFixed(2)} MB`;
      
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start w-full">
      {/* Controls */}
      <div className="lg:col-span-5 card p-6 bg-card/60 shadow-sm border-line/40 space-y-6">
        <div>
          <label className="field-label block text-sm font-bold text-fg mb-2">Estimated Document Tokens</label>
          <input 
            type="number" min="100" step="1000"
            className="input w-full bg-field border-line focus:border-accent"
            value={docTokens}
            onChange={(e) => setDocTokens(parseInt(e.target.value) || 1000)}
          />
          <p className="text-xs text-muted mt-1">Approx. 750 words = 1000 tokens.</p>
        </div>

        <div>
          <label className="field-label block text-sm font-bold text-fg mb-2">Embedding Model</label>
          <select 
            className="input w-full bg-field border-line focus:border-accent text-sm"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
          >
            {EMBEDDING_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name} (Max: {m.limit})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label block text-sm font-bold text-fg mb-2">Chunk Size (Tokens)</label>
            <input 
              type="number" min="50" step="50"
              className={`input w-full bg-field ${chunkSize > selectedModel.limit ? "border-danger focus:border-danger text-danger" : "border-line focus:border-accent"}`}
              value={chunkSize}
              onChange={(e) => setChunkSize(parseInt(e.target.value) || 500)}
            />
          </div>
          <div>
            <label className="field-label block text-sm font-bold text-fg mb-2">Overlap (Tokens)</label>
            <input 
              type="number" min="0" step="50"
              className="input w-full bg-field border-line focus:border-accent"
              value={overlapTokens}
              onChange={(e) => setOverlapTokens(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        {chunkSize > selectedModel.limit && (
          <p className="text-xs text-danger font-semibold">
            Warning: Chunk size exceeds the embedding model's context limit ({selectedModel.limit}). It will be truncated.
          </p>
        )}
        
        {overlapTokens >= chunkSize && (
          <p className="text-xs text-warning font-semibold">
            Warning: Overlap is greater than or equal to chunk size. This creates an infinite loop. Adjusted to chunk size - 1.
          </p>
        )}
      </div>

      {/* Results */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6 bg-card/60 border-line/40 shadow-sm flex flex-col items-center justify-center text-center">
            <LayersIcon className="w-8 h-8 text-accent mb-3 opacity-80" />
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Total Database Chunks</h3>
            <div className="text-4xl font-black text-fg tracking-tight">
              {calculations.finalChunks.toLocaleString()}
            </div>
          </div>
          <div className="card p-6 bg-card/60 border-line/40 shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">Est. Vector Storage</h3>
            <div className="text-3xl font-bold text-fg tracking-tight mb-2">
              {calculations.storageMB < 1 ? "< 1.00" : calculations.storageMB.toFixed(2)} <span className="text-lg text-muted">MB</span>
            </div>
            <p className="text-xs text-muted mt-1">Based on ~1536 float embeddings</p>
          </div>
        </div>

        <div className="card p-6 bg-hover/30 border-line/30">
          <h3 className="text-sm font-bold text-fg mb-6">Chunk Visualization Strategy</h3>
          
          <div className="relative h-20 bg-card rounded-lg border border-line/50 overflow-hidden px-4 py-2 flex items-center mb-4">
            <div className="absolute top-0 bottom-0 left-4 w-32 bg-accent/20 border-l-2 border-r-2 border-accent/60 opacity-80 rounded-sm"></div>
            <div className="absolute top-0 bottom-0 left-24 w-32 bg-accent/30 border-l-2 border-r-2 border-accent opacity-80 rounded-sm"></div>
            <div className="absolute top-0 bottom-0 left-44 w-32 bg-accent/20 border-l-2 border-r-2 border-accent/60 opacity-80 rounded-sm"></div>
            
            <span className="absolute bottom-1 left-26 text-[10px] font-bold text-accent">OVERLAP</span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-line/40 pb-2">
              <span className="text-muted">Effective Chunk Size applied:</span>
              <span className="font-mono font-medium text-fg">{calculations.actualChunkSize} tokens</span>
            </div>
            <div className="flex justify-between items-center border-b border-line/40 pb-2">
              <span className="text-muted">Effective Overlap applied:</span>
              <span className="font-mono font-medium text-fg">{calculations.actualOverlap} tokens</span>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span className="text-muted">Stride (Tokens advanced per chunk):</span>
              <span className="font-mono font-medium text-fg">{calculations.stride} tokens</span>
            </div>
          </div>
        </div>

        <button onClick={handleCopy} className="btn btn-secondary w-full h-12 flex justify-center items-center gap-2 mt-2">
          {copied ? <CheckIcon className="w-4 h-4 text-success" /> : <CopyIcon className="w-4 h-4" />}
          {copied ? "Copied Report!" : "Copy Strategy Report"}
        </button>
      </div>
    </div>
  );
}
