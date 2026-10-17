import type { Metadata } from "next";
import { buildMetadata, faqJsonLd, webApplicationJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumb } from "@/components/breadcrumb";
import { FaqSection } from "@/components/faq-section";
import { ShareButton } from "@/components/share-button";
import { ADS } from "@/lib/site";
import { AdSensePlaceholder } from "@/components/adsense-placeholder";
import { ChmodCalculatorClient } from "./chmod-calculator-client";
import { Terminal, BookOpen, Lock } from "lucide-react";

export const metadata: Metadata = buildMetadata({
  title: "Chmod Calculator & Linux Permissions Generator | Castov",
  description:
    "Interactive chmod calculator for Linux and Unix permissions. Convert between octal (755, 644, 777) and symbolic (rwxr-xr-x) notations, generate chmod commands, and inspect access levels.",
  path: "/chmod",
});

const FAQ_ITEMS = [
  {
    q: "What does chmod mean?",
    a: "chmod stands for 'change mode'. It is a command in Unix and Unix-like operating systems (such as Linux and macOS) used to change the access permissions of files and directories.",
  },
  {
    q: "How do octal permissions work in chmod?",
    a: "Chmod octal permissions are represented by a 3-digit number. The first digit represents Owner permissions, the second represents Group permissions, and the third represents Public (Others). Each digit is the sum of: 4 (Read), 2 (Write), and 1 (Execute). For example, 7 = 4 + 2 + 1 (rwx), and 5 = 4 + 1 (r-x).",
  },
  {
    q: "Why is chmod 777 considered dangerous?",
    a: "Chmod 777 grants Read, Write, and Execute permissions to everyone on the system (Owner, Group, and Others). Any malicious user or compromised process can modify, delete, or execute arbitrary code in that file or directory. Production systems should avoid 777.",
  },
  {
    q: "What are the most common chmod permissions?",
    a: "The most common permissions are: 755 for executable binaries and web directories, 644 for general files (HTML, CSS, images, configs), 600 for private credentials (like SSH private keys ~/.ssh/id_rsa), and 700 for private personal directories.",
  },
];

export default function ChmodHubPage() {
  const path = "/chmod";
  const jsonLdData = [
    webApplicationJsonLd({
      name: "Chmod Calculator & Linux Permissions Generator",
      description:
        "Interactive chmod calculator for Linux and Unix permissions. Convert between octal and symbolic notations.",
      path,
    }),
    faqJsonLd(FAQ_ITEMS),
    breadcrumbJsonLd(
      [
        { name: "Home", href: "/" },
        { name: "Tools", href: "/tools" },
        { name: "Chmod Calculator" },
      ],
      path
    ),
  ];

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12 space-y-12">
      <JsonLd data={jsonLdData} />

      <Breadcrumb
        path={path}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Tools", href: "/tools" },
          { name: "Chmod Calculator" },
        ]}
      />

      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
            <Terminal className="w-3.5 h-3.5" /> UNIX &amp; LINUX DEVTOOLS
          </span>
          <ShareButton title="Chmod Permissions Calculator" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-fg">
          Chmod Permissions Calculator
        </h1>
        <p className="text-lg text-muted max-w-3xl leading-relaxed">
          Easily calculate and convert Linux / Unix file permissions between octal digits (<code className="text-accent font-semibold">755</code>, <code className="text-accent font-semibold">644</code>, <code className="text-accent font-semibold">777</code>) and symbolic notation (<code className="text-accent font-semibold">rwxr-xr-x</code>).
        </p>
      </header>

      {/* Interactive Tool Interface */}
      <section aria-label="Interactive Chmod Calculator" className="card p-6 sm:p-8 border-line/80 shadow-md">
        <ChmodCalculatorClient />
      </section>

      {/* Guide & Explanations */}
      <div className={`grid ${ADS.client ? "lg:grid-cols-[1fr_300px]" : ""} gap-12 items-start`}>
        <div className="prose-tf max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-fg mb-4 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-accent" /> Understanding Linux Permissions
            </h2>
            <p className="text-muted leading-relaxed">
              In Unix-like systems, every file and directory has access rights divided into three scopes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted mt-3">
              <li><strong className="text-fg">Owner (u):</strong> The user account that created or owns the file.</li>
              <li><strong className="text-fg">Group (g):</strong> Users who belong to the group associated with the file.</li>
              <li><strong className="text-fg">Others / Public (o):</strong> All other users on the system.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-fg mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-500" /> Permission Values &amp; Math
            </h2>
            <div className="overflow-x-auto not-prose">
              <table className="w-full border-collapse text-sm bg-card border border-line rounded-xl overflow-hidden">
                <thead className="bg-field border-b border-line">
                  <tr>
                    <th className="p-3 text-left font-semibold text-fg">Permission</th>
                    <th className="p-3 text-left font-semibold text-fg">Symbol</th>
                    <th className="p-3 text-left font-semibold text-fg">Octal Value</th>
                    <th className="p-3 text-left font-semibold text-fg">Binary</th>
                    <th className="p-3 text-left font-semibold text-fg">Effect on File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="p-3 font-semibold text-fg">Read</td>
                    <td className="p-3 font-mono text-accent">r</td>
                    <td className="p-3 font-mono font-bold text-fg">4</td>
                    <td className="p-3 font-mono text-muted">100</td>
                    <td className="p-3 text-muted">View or read file contents</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-fg">Write</td>
                    <td className="p-3 font-mono text-accent">w</td>
                    <td className="p-3 font-mono font-bold text-fg">2</td>
                    <td className="p-3 font-mono text-muted">010</td>
                    <td className="p-3 text-muted">Modify, edit, or delete file</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-fg">Execute</td>
                    <td className="p-3 font-mono text-accent">x</td>
                    <td className="p-3 font-mono font-bold text-fg">1</td>
                    <td className="p-3 font-mono text-muted">001</td>
                    <td className="p-3 text-muted">Run file as a program or script</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQs */}
          <section className="pt-6 border-t border-line">
            <h2 className="text-2xl font-bold text-fg mb-6">Frequently Asked Questions</h2>
            <FaqSection items={FAQ_ITEMS} />
          </section>
        </div>

        {ADS.client && (
          <aside className="sticky top-24 flex flex-col gap-6">
            <AdSensePlaceholder />
          </aside>
        )}
      </div>
    </div>
  );
}
