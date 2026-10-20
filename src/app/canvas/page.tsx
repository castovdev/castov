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
          <p className="text-xs text-muted">Zapier for raw developer data (Local-First • Multi-peer CRDTs via public WebRTC signaling)</p>
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
