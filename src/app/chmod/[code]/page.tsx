import { buildMetadata, faqJsonLd, webPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { FaqSection } from "@/components/faq-section";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";
import { ShareButton } from "@/components/share-button";
import { ADS } from "@/lib/site";
import { AdSensePlaceholder } from "@/components/adsense-placeholder";

function getPermissions(digit: string) {
  const val = parseInt(digit, 10);
  if (isNaN(val) || val < 0 || val > 7) return null;
  const read = (val & 4) !== 0;
  const write = (val & 2) !== 0;
  const execute = (val & 1) !== 0;
  const perms = [];
  if (read) perms.push("Read");
  if (write) perms.push("Write");
  if (execute) perms.push("Execute");
  if (perms.length === 0) return "No permissions";
  return perms.join(", ");
}

type Params = { code: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  const codes: Params[] = [];
  for (let a = 0; a <= 7; a++) {
    for (let b = 0; b <= 7; b++) {
      for (let c = 0; c <= 7; c++) codes.push({ code: `${a}${b}${c}` });
    }
  }
  return codes;
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return buildMetadata({
    title: `Chmod ${code} Permissions Explained`,
    description: `Understand the exact Unix permissions for chmod ${code}. See Owner, Group, and Public access levels for files and directories.`,
    path: `/chmod/${code}`,
  });
}

export default async function ChmodPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[0-7]{3}$/.test(code)) {
    return notFound();
  }

  const owner = getPermissions(code[0]);
  const group = getPermissions(code[1]);
  const publicPerms = getPermissions(code[2]);
  const path = `/chmod/${code}`;

  const prose = `The chmod code ${code} sets the following permissions: The Owner has ${owner} permissions. The Group has ${group} permissions. The Public (Others) has ${publicPerms} permissions.`;

  const faqItems = [
    { q: `What are the permissions for chmod ${code}?`, a: prose },
    { q: `How do you set chmod ${code}?`, a: `You can set these permissions by running the command: chmod ${code} filename` },
    { q: `Is chmod ${code} secure?`, a: code === "777" ? "No, 777 is extremely insecure as it grants read, write, and execute permissions to everyone." : "It depends on the exact digits, but generally you should follow the principle of least privilege." }
  ];

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <JsonLd data={[
        webPageJsonLd({ name: `Chmod ${code}`, description: prose, path }),
        faqJsonLd(faqItems)
      ]} />
      
      <Breadcrumb
        path={path}
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Unix Permissions", href: "/tools" },
          { name: code }
        ]}
      />

      <div className="mt-8 mb-12">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
            LINUX FILE PERMISSIONS
          </span>
          <ShareButton title={`Chmod ${code} Permissions`} />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-fg mb-6">
          Chmod <span className="text-primary font-mono">{code}</span>
        </h1>
        <p className="text-xl text-muted leading-relaxed max-w-3xl">
          {prose}
        </p>
      </div>

      <div className={`grid ${ADS.client ? "lg:grid-cols-[1fr_300px]" : ""} gap-12 items-start`}>
        <div className="prose-tf max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-card border border-line rounded-2xl shadow-sm text-center">
              <h2 className="font-semibold text-lg text-muted mb-2 uppercase tracking-wider">Owner</h2>
              <p className="text-2xl font-bold text-fg">{owner}</p>
            </div>
            <div className="p-6 bg-card border border-line rounded-2xl shadow-sm text-center">
              <h2 className="font-semibold text-lg text-muted mb-2 uppercase tracking-wider">Group</h2>
              <p className="text-2xl font-bold text-fg">{group}</p>
            </div>
            <div className="p-6 bg-card border border-line rounded-2xl shadow-sm text-center">
              <h2 className="font-semibold text-lg text-muted mb-2 uppercase tracking-wider">Public</h2>
              <p className="text-2xl font-bold text-fg">{publicPerms}</p>
            </div>
          </div>

          <FaqSection items={faqItems} />
        </div>

        {ADS.client ? (
          <aside className="sticky top-24 flex flex-col gap-6">
            <AdSensePlaceholder />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
