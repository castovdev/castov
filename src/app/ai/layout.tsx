import { AiSidebar } from "@/components/ai-sidebar";
import { WorkspaceProvider } from "@/context/workspace-context";
import { KeyManagerProvider } from "@/context/key-manager-context";
import { KeyVaultModal } from "@/components/key-vault-modal";

export default function AiLayout({ children }: { children: React.ReactNode }) {
  return (
    <KeyManagerProvider>
      <WorkspaceProvider>
        <div className="flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 py-8 pr-6 border-r border-line/30">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <AiSidebar />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 py-8 lg:pl-10">
            <div
              role="status"
              className="mb-6 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning font-medium"
            >
              <span className="inline-block px-2 py-0.5 rounded text-xs uppercase font-bold bg-warning/20 border border-warning/30">
                Preview
              </span>
              <span>Preview: UI and configuration prototype. Live AI execution is not available yet.</span>
            </div>
            {children}
          </div>
        </div>
        <KeyVaultModal />
      </WorkspaceProvider>
    </KeyManagerProvider>
  );
}
