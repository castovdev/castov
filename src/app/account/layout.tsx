import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Account & Dashboard",
  description: "Manage your Castov developer profile, pinned tools, saved configs, and Zero-Knowledge security vaults.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg text-fg">{children}</div>;
}
