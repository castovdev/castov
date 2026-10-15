import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { webPageJsonLd, faqJsonLd } from '@/lib/seo';
import { JsonLd } from '@/components/json-ld';
import { Breadcrumb } from '@/components/breadcrumb';
import { FaqSection } from '@/components/faq-section';
import Link from 'next/link';
import { HTTP_STATUS_CODES } from '@/lib/http-statuses';
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
  return {
    title: `HTTP Status Code ${code}: ${status.title.replace(code + ' ', '')} - Developer Guide | Castov`,
    description: `Learn exactly what HTTP Status ${code} (${status.title}) means, why it happens, and how to fix it in your application.`,
    alternates: {
      canonical: `https://castov.com/http-status/${code}`,
    },
  };
}

export default async function HttpStatusPage({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const status = HTTP_STATUS_CODES[code];
  if (!status) notFound();

  const path = `/http-status/${code}`;
  const statusName = status.title.replace(`${code} `, '');

  const faqs = [
    { q: `What does HTTP Status ${code} mean?`, a: status.description },
    { q: `Why am I getting a ${code} status code?`, a: status.why },
    { q: `How do I fix a ${code} ${statusName} error?`, a: status.fix },
  ];

  return (
    <div className="layout-content max-w-5xl py-8 sm:py-12">
      <JsonLd
        data={[
          webPageJsonLd({ name: `HTTP ${code} Status Code Guide`, description: status.description, path }),
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
      <div className="grid lg:grid-cols-[1fr_300px] gap-12 items-start">
        <div className="prose-tf max-w-none">
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
          <FaqSection items={faqs} />
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Explore more HTTP Status Codes</h2>
            <div className="flex flex-wrap gap-3">
              {Object.keys(HTTP_STATUS_CODES).map((c) => (
                <Link
                  key={c}
                  href={`/http-status/${c}`}
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
          </section>
        </div>
        <aside className="sticky top-24 flex flex-col gap-6">
          <div className="bg-card border border-line rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-fg mb-2">Did you know?</h3>
            <p className="text-sm text-muted">
              HTTP status codes are divided into 5 categories: 1xx (Informational), 2xx (Success), 3xx (Redirection), 4xx (Client Error), and 5xx (Server Error).
            </p>
          </div>
          <AdSensePlaceholder />
        </aside>
      </div>
    </div>
  );
}
