import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buildMetadata, faqJsonLd, howToJsonLd, techArticleJsonLd, webPageJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { Breadcrumb } from '@/components/breadcrumb';
import { FaqSection } from '@/components/faq-section';
import { HTTP_STATUS_CODES } from '@/lib/http-statuses';
import { getStatusComparisons, getStatusSnippets, isMockableStatus } from '@/lib/http-status-guides';
import { HttpStatusLab } from '@/components/http-status-lab';
import { AdSensePlaceholder } from '@/components/adsense-placeholder';

type Params = { code: string };
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return Object.keys(HTTP_STATUS_CODES).map((code) => ({ code }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { code } = await params;
  const status = HTTP_STATUS_CODES[code];
  if (!status) return {};
  const name = status.title.replace(`${code} `, '');
  return buildMetadata({
    title: `HTTP ${code} ${name}: Meaning, Causes & Fix (+ Live Mock) | Castov`,
    description: `What HTTP ${code} ${name} means, why it happens, and how to fix it. Test live with a free ${code} mock endpoint.`,
    path: `/http-status/${code}`,
  });
}

export default async function HttpStatusPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const status = HTTP_STATUS_CODES[code];
  if (!status) notFound();

  const path = `/http-status/${code}`;
  const statusName = status.title.replace(`${code} `, '');
  const snippets = getStatusSnippets(code);
  const comparisons = getStatusComparisons(code);
  const mockable = isMockableStatus(code);

  const faqs = [
    { q: `What does HTTP Status ${code} mean?`, a: status.description },
    { q: `Why am I getting a ${code} status code?`, a: status.why },
    { q: `How do I fix a ${code} ${statusName} error?`, a: status.fix },
    ...comparisons.map((c) => {
      const otherName = HTTP_STATUS_CODES[c.other].title.replace(`${c.other} `, '');
      return { q: `What is the difference between ${code} ${statusName} and ${c.other} ${otherName}?`, a: c.summary };
    }),
    ...(mockable
      ? [{
          q: `How can I test how my app handles a ${code} response?`,
          a: `Send a request to https://castov.com/api/mock/${code} — it returns a real ${code} ${statusName} response with CORS enabled. Add ?delay=2000 to simulate a slow server.`,
        }]
      : []),
  ];

  const siblings = Object.keys(HTTP_STATUS_CODES).filter((c) => c[0] === code[0]);

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <JsonLd
        data={[
          webPageJsonLd({ name: `HTTP ${code} ${statusName}`, description: status.description, path }),
          techArticleJsonLd({
            headline: `HTTP ${code} ${statusName}: meaning, causes and fixes`,
            description: status.description,
            path,
            proficiencyLevel: 'Beginner',
            dependencies: 'HTTP/1.1, HTTP/2',
          }),
          howToJsonLd({
            name: `How to fix HTTP ${code} ${statusName}`,
            description: status.why,
            toolName: 'curl / Castov HTTP mock endpoint',
            steps: [
              { name: 'Understand the status', text: status.description },
              { name: 'Identify the cause', text: status.why },
              { name: 'Apply the fix', text: status.fix },
              ...(mockable
                ? [{ name: 'Verify your client handling', text: `Reproduce the response with: curl -i https://castov.com/api/mock/${code}` }]
                : []),
            ],
          }),
          faqJsonLd(faqs),
        ]}
      />
      <Breadcrumb
        path={path}
        crumbs={[
          { name: 'Home', href: '/' },
          { name: 'HTTP Status Codes', href: '/http-status' },
          { name: `${code} ${statusName}` },
        ]}
      />
      <div className="mt-8 mb-12">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-sm font-mono font-bold text-accent">
            HTTP/{status.type} ({status.category})
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-fg mb-6">
          <span className="text-muted">{code}</span> {statusName}
        </h1>
        <p className="text-xl text-muted leading-relaxed max-w-3xl">{status.description}</p>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-12 items-start">
        <div className="min-w-0 max-w-none">
          <section className="bg-card border border-line rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">❓</span> Why does this happen?
            </h2>
            <p className="text-lg text-fg leading-relaxed">{status.why}</p>
          </section>
          <section className="bg-success/5 border border-success/20 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-success">
              <span className="text-success">✅</span> How to fix it
            </h2>
            <p className="text-lg text-fg leading-relaxed">{status.fix}</p>
          </section>

          <div className="mb-8">
            <HttpStatusLab code={code} snippets={snippets} mockable={mockable} />
          </div>

          {comparisons.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{code} vs similar status codes</h2>
              <div className="grid gap-3">
                {comparisons.map((c) => (
                  <Link
                    key={c.other}
                    href={`/http-status/${c.other}`}
                    className="card p-4 hover:border-accent transition-colors"
                  >
                    <div className="font-mono font-bold text-fg mb-1">
                      {code} vs {HTTP_STATUS_CODES[c.other].title}
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{c.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <FaqSection items={faqs} />

          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Other {status.type} status codes</h2>
            <div className="flex flex-wrap gap-3">
              {siblings.map((c) => (
                <Link
                  key={c}
                  href={`/http-status/${c}`}
                  aria-current={c === code ? 'page' : undefined}
                  className={`px-4 py-2 rounded-lg border font-mono font-bold transition-colors ${
                    c === code
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card border-line hover:border-primary/50 text-fg'
                  }`}
                >
                  {c}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted">
              Browse the full <Link href="/http-status" className="text-accent underline">HTTP status codes directory</Link> or
              troubleshoot terminal errors in the <Link href="/error-fixes" className="text-accent underline">Error Fix Encyclopedia</Link>.
            </p>
          </section>
        </div>
        <aside className="lg:sticky lg:top-24 flex flex-col gap-6">
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-fg mb-2">Did you know?</h3>
            <p className="text-sm text-muted">
              HTTP status codes are divided into 5 classes: 1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), and 5xx (Server Error).
            </p>
          </div>
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-fg mb-2">Check a port from your terminal</h3>
            <p className="text-sm text-muted mb-3">Find what is listening behind a 502/504 in one command:</p>
            <code className="block rounded-md bg-[#0b0f17] px-3 py-2 font-mono text-xs text-slate-200">npx castov port 3000</code>
          </div>
          <AdSensePlaceholder />
        </aside>
      </div>
    </div>
  );
}
