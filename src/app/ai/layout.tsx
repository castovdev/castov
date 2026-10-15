import { AiSidebar } from "@/components/ai-sidebar";
import { AiMobileDrawer } from "@/components/ai-mobile-drawer";
import { WorkspaceProvider } from "@/context/workspace-context";
import { KeyManagerProvider } from "@/context/key-manager-context";
import { KeyVaultModal } from "@/components/key-vault-modal";
import { ShieldCheck } from "lucide-react";

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
            <AiMobileDrawer />

            <div
              role="status"
              className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-card p-4 text-xs sm:text-sm text-muted shadow-2xs"
            >
              <div className="flex items-start sm:items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  100% Client-Side Privacy
                </span>
                <span className="text-fg font-medium leading-relaxed">
                  All prompt templates, token calculators, and model configs run completely in your browser. Zero server telemetry or API key leakage.
                </span>
              </div>
            </div>
            {children}
          </div>
        </div>
        <KeyVaultModal />
      </WorkspaceProvider>
    </KeyManagerProvider>
  );
}
