import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowRight, Calendar, Hash, FileCode2 } from "lucide-react";
import { absoluteUrl } from "@/lib/site";
import { AdSlot } from "@/components/ad-slot";

interface Props {
  params: { timestamp: string };
}

export function parseTimestampParam(input: string): { ts: number; date: Date } | null {
  const trimmed = input.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const ts = parseInt(trimmed, 10);
  if (!Number.isFinite(ts)) return null;
  const isMs = trimmed.length > 10;
  const date = new Date(isMs ? ts : ts * 1000);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  if (year < -1000 || year > 3000) return null;
  return { ts, date };
}

// Generate dynamic metadata for Google SEO
export async function generateMetadata({ params }: { params: Promise<Props['params']> }): Promise<Metadata> {
  const resolvedParams = await params;
  const parsed = parseTimestampParam(resolvedParams.timestamp);
  
  if (!parsed) {
    return {
      title: "Unix Timestamp - Castov",
      description: "Convert Unix Epoch timestamp to human-readable date.",
      alternates: {
        canonical: absoluteUrl(`/unix/${resolvedParams.timestamp}`),
      },
    };
  }

  const { date } = parsed;
  const formatted = date.toUTCString();
  const iso = date.toISOString();

  return {
    title: `Unix Timestamp ${resolvedParams.timestamp} to Date | Castov`,
    description: `Convert Unix Epoch timestamp ${resolvedParams.timestamp} to human-readable date. The timestamp ${resolvedParams.timestamp} translates to ${formatted} (ISO: ${iso}).`,
    alternates: {
      canonical: absoluteUrl(`/unix/${resolvedParams.timestamp}`),
    },
  };
}

// Helper Functions for Dynamic Context Engine
function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getExactRelativeDiff(date: Date) {
  const now = new Date();
  const diff = Math.abs(now.getTime() - date.getTime());
  
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
  const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
  
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  
  if (parts.length === 0) return "less than a day";
  return parts.join(", ").replace(/,([^,]*)$/, " and$1");
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

export default async function UnixTimestampPseoPage({ params }: { params: Promise<Props['params']> }) {
  const resolvedParams = await params;
  const tsString = resolvedParams.timestamp;
  const parsed = parseTimestampParam(tsString);
  
  if (!parsed) {
    return notFound();
  }

  const { date } = parsed;
  const isMs = tsString.length > 10;
  
  const utcString = date.toUTCString();
  const isoString = date.toISOString();
  const localString = date.toString();
  
  // Dynamic Context Engine Calculations
  const isFuture = date.getTime() > Date.now();
  const diffStr = getExactRelativeDiff(date);
  const year = date.getUTCFullYear();
  const isLeap = isLeapYear(year);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  const weekNum = getWeekNumber(date);

  // FAQ Generation
  const faqs = [
    {
      q: `What historical or future date does the timestamp ${tsString} represent?`,
      a: `The Unix epoch timestamp ${tsString} precisely represents ${utcString}, which follows the ISO 8601 standard format of ${isoString}.`
    },
    {
      q: `Is ${tsString} measured in seconds or milliseconds?`,
      a: `It is measured in ${isMs ? 'milliseconds' : 'seconds'}. We can determine this programmatically because it contains exactly ${tsString.length} digits. In software engineering, standard 10-digit Unix timestamps represent seconds, whereas 13-digit timestamps represent milliseconds since the epoch.`
    },
    {
      q: `How do I parse ${tsString} programmatically in JavaScript or Python?`,
      a: `In JavaScript, you can parse it using: new Date(${isMs ? tsString : tsString + " * 1000"}). In Python, you would use: datetime.datetime.fromtimestamp(${isMs ? tsString + " / 1000" : tsString}).`
    }
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };

  return (
    <div className="bg-bg min-h-screen text-fg pb-20">
      {/* Dynamic Schema Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="container max-w-4xl mx-auto px-4 pt-16">
        
        {/* Breadcrumb */}
        <nav className="flex text-sm text-muted mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="hover:text-fg transition-colors">Home</Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2">/</span>
                <Link href="/unix-timestamp-converter" className="hover:text-fg transition-colors">Unix Converter</Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <span className="mx-2">/</span>
                <span className="text-fg font-medium">{tsString}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
          Timestamp <span className="text-primary">{tsString}</span>
        </h1>
        <p className="text-xl text-muted mb-10 leading-relaxed">
          Detailed engineering analysis and programmatic conversion for the Unix epoch timestamp <code className="bg-field px-2 py-1 rounded text-fg">{tsString}</code>.
        </p>

        <AdSlot placement="content-middle" />

        {/* Dynamic Context Engine Prose */}
        <div className="my-10 bg-card border border-line p-8 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="text-accent" /> Temporal Analysis
          </h2>
          <div className="space-y-4 text-muted text-lg leading-relaxed">
            <p>
              This timestamp represents a specific moment in <strong>{isFuture ? 'the future' : 'the past'}</strong>, exactly <strong>{diffStr}</strong> {isFuture ? 'from now' : 'ago'}.
            </p>
            <p>
              It falls on a <strong>{weekday}</strong> in <strong>Q{quarter}</strong> of the year {year} (specifically, Week {weekNum} of the year).
            </p>
            <p>
              {isLeap 
                ? `Interestingly, ${year} is a <strong>Leap Year</strong>, meaning February has 29 days. This astronomical adjustment shifts the day of the week for all subsequent dates in that year to synchronize our calendar with the solar year.` 
                : `${year} is a standard 365-day year, following the standard Gregorian calendar progression.`}
            </p>
            <p>
              Because this payload consists of exactly <strong>{tsString.length} digits</strong>, our engines automatically detect it as a <strong>{isMs ? 'millisecond' : 'second'}</strong> precision timestamp.
            </p>
          </div>
        </div>

        {/* Data Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div className="card p-6 border border-line bg-card shadow-sm rounded-2xl hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-3 mb-4 text-primary">
              <Calendar size={24} />
              <h2 className="text-xl font-bold text-fg">UTC Date & Time</h2>
            </div>
            <p className="text-xl sm:text-2xl font-mono text-fg break-words mb-2">{utcString}</p>
            <p className="text-sm text-muted">Universal Time Coordinated (GMT)</p>
          </div>

          <div className="card p-6 border border-line bg-card shadow-sm rounded-2xl hover:border-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-4 text-accent">
              <Hash size={24} />
              <h2 className="text-xl font-bold text-fg">ISO 8601 Format</h2>
            </div>
            <p className="text-xl sm:text-2xl font-mono text-fg break-words mb-2">{isoString}</p>
            <p className="text-sm text-muted">Standard internet time profile</p>
          </div>

          <div className="card p-6 border border-line bg-card shadow-sm rounded-2xl md:col-span-2">
            <div className="flex items-center gap-3 mb-4 text-success">
              <Clock size={24} />
              <h2 className="text-xl font-bold text-fg">Local & Relative Time</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-fg mb-1">Your Local Timezone:</p>
                <p className="font-mono text-muted text-sm break-words">{localString}</p>
              </div>
              <div>
                <p className="font-semibold text-fg mb-1">Relative to Now:</p>
                <p className="font-mono text-muted text-sm">{isFuture ? `In ${diffStr}` : `${diffStr} ago`}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Code Snippets */}
        <div className="mt-12 bg-[#1e1e1e] border border-line p-8 rounded-3xl overflow-hidden shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
            <FileCode2 className="text-[#3b82f6]" /> Developer Implementation
          </h2>
          
          <div className="space-y-6">
            <div>
              <p className="text-gray-400 mb-2 text-sm font-semibold">JavaScript / TypeScript (Node.js & Browser)</p>
              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-sm text-gray-300 font-mono border border-white/10">
                <code>{`const timestamp = ${tsString};
const date = new Date(${isMs ? 'timestamp' : 'timestamp * 1000'});
console.log(date.toISOString()); // ${isoString}`}</code>
              </pre>
            </div>
            
            <div>
              <p className="text-gray-400 mb-2 text-sm font-semibold">Python (datetime)</p>
              <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto text-sm text-gray-300 font-mono border border-white/10">
                <code>{`import datetime
timestamp = ${tsString}
dt = datetime.datetime.fromtimestamp(${isMs ? 'timestamp / 1000.0' : 'timestamp'}, tz=datetime.timezone.utc)
print(dt.isoformat()) # ${isoString}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Dynamic FAQ Section */}
        <div className="mt-16 mb-12">
          <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-field border border-line p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-2 text-fg">{faq.q}</h3>
                <p className="text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center pb-12">
          <Link href="/unix-timestamp-converter" className="inline-flex items-center justify-center gap-2 bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent-hover transition-colors shadow-lg">
            Convert another timestamp <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}
