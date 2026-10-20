import { Metadata } from "next";
import DevCanvas from "@/components/canvas/DevCanvas";

import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Visual Developer Workflows Canvas",
    description: "Chain together developer tools visually to create automated data pipelines and workflows with zero server-side processing.",
    path: "/canvas"
  }),
  robots: {
    index: false,
    follow: false
  }
};

export default function CanvasPage() {
  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-bg">
      <div className="border-b border-line px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-xl font-bold text-fg">Agentic Workflows</h1>
          <p className="text-xs text-muted">Zapier for raw developer data (Local-First • Peer-to-peer CRDT collaboration coordinated through public WebRTC signaling)</p>
          <p className="text-[11px] text-muted/80 mt-0.5">Public signaling services help browsers discover and connect to peers; Castov does not store workflow graphs, node content, or payload data.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm">Save Workflow</button>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <DevCanvas />
      </div>
    </div>
  );
}
