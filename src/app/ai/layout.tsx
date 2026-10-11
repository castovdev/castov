import { AiSidebar } from "@/components/ai-sidebar";
import { WorkspaceProvider } from "@/context/workspace-context";
import { KeyManagerProvider } from "@/context/key-manager-context";
import { KeyVaultModal } from "@/components/key-vault-modal";
import { AI_HUB_LIVE } from "@/lib/flags";

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
            {!AI_HUB_LIVE && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-line bg-card px-4 py-3 text-sm text-muted"
              >
                <strong className="text-fg">Coming soon.</strong> The AI Hub is a preview. These tools are not live yet and
                will run on a real model using your own API key (bring your own key). Nothing on these pages
                generates results with AI today.
              </div>
            )}
            {children}
          </div>
        </div>
        <KeyVaultModal />
      </WorkspaceProvider>
    </KeyManagerProvider>
  );
}
