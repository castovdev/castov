export interface TimezoneNode {
  code: string;
  name: string;
  iana: string;
  city: string;
  country: string;
  standardOffset: string;
}

export interface TimezonePair {
  slug: string;
  from: TimezoneNode;
  to: TimezoneNode;
  title: string;
  description: string;
  popularSearches: string[];
}

export const TIMEZONE_NODES: Record<string, TimezoneNode> = {
  utc: { code: "UTC", name: "Coordinated Universal Time", iana: "UTC", city: "UTC / Greenwich", country: "Global", standardOffset: "+00:00" },
  gmt: { code: "GMT", name: "Greenwich Mean Time", iana: "Europe/London", city: "London", country: "United Kingdom", standardOffset: "+00:00" },
  est: { code: "EST", name: "Eastern Time (US & Canada)", iana: "America/New_York", city: "New York", country: "United States", standardOffset: "-05:00" },
  cst: { code: "CST", name: "Central Time (US & Canada)", iana: "America/Chicago", city: "Chicago", country: "United States", standardOffset: "-06:00" },
  mst: { code: "MST", name: "Mountain Time (US & Canada)", iana: "America/Denver", city: "Denver", country: "United States", standardOffset: "-07:00" },
  pst: { code: "PST", name: "Pacific Time (US & Canada)", iana: "America/Los_Angeles", city: "Los Angeles / San Francisco", country: "United States", standardOffset: "-08:00" },
  cet: { code: "CET", name: "Central European Time", iana: "Europe/Paris", city: "Paris / Berlin", country: "Europe", standardOffset: "+01:00" },
  eet: { code: "EET", name: "Eastern European Time", iana: "Europe/Athens", city: "Athens / Cairo", country: "Europe / MENA", standardOffset: "+02:00" },
  ist: { code: "IST", name: "India Standard Time", iana: "Asia/Kolkata", city: "Mumbai / Bengaluru", country: "India", standardOffset: "+05:30" },
  gst: { code: "GST", name: "Gulf Standard Time", iana: "Asia/Dubai", city: "Dubai", country: "UAE", standardOffset: "+04:00" },
  sgt: { code: "SGT", name: "Singapore Time", iana: "Asia/Singapore", city: "Singapore", country: "Singapore", standardOffset: "+08:00" },
  jst: { code: "JST", name: "Japan Standard Time", iana: "Asia/Tokyo", city: "Tokyo", country: "Japan", standardOffset: "+09:00" },
  kst: { code: "KST", name: "Korea Standard Time", iana: "Asia/Seoul", city: "Seoul", country: "South Korea", standardOffset: "+09:00" },
  aest: { code: "AEST", name: "Australian Eastern Time", iana: "Australia/Sydney", city: "Sydney", country: "Australia", standardOffset: "+10:00" },
  brt: { code: "BRT", name: "Brasília Time", iana: "America/Sao_Paulo", city: "São Paulo", country: "Brazil", standardOffset: "-03:00" },
};

const PAIR_KEYS: [string, string][] = [
  ["est", "utc"],
  ["utc", "est"],
  ["pst", "est"],
  ["est", "pst"],
  ["pst", "utc"],
  ["utc", "pst"],
  ["est", "gmt"],
  ["gmt", "est"],
  ["pst", "gmt"],
  ["gmt", "pst"],
  ["cst", "est"],
  ["est", "cst"],
  ["cst", "utc"],
  ["utc", "cst"],
  ["pst", "cst"],
  ["cst", "pst"],
  ["mst", "est"],
  ["est", "mst"],
  ["pst", "mst"],
  ["est", "cet"],
  ["cet", "est"],
  ["utc", "cet"],
  ["cet", "utc"],
  ["gmt", "cet"],
  ["cet", "gmt"],
  ["est", "ist"],
  ["ist", "est"],
  ["pst", "ist"],
  ["ist", "pst"],
  ["utc", "ist"],
  ["ist", "utc"],
  ["gmt", "ist"],
  ["ist", "gmt"],
  ["cet", "ist"],
  ["ist", "cet"],
  ["est", "jst"],
  ["jst", "est"],
  ["pst", "jst"],
  ["jst", "pst"],
  ["utc", "jst"],
  ["jst", "utc"],
  ["est", "sgt"],
  ["sgt", "est"],
  ["pst", "sgt"],
  ["utc", "sgt"],
  ["est", "gst"],
  ["gst", "est"],
  ["gmt", "gst"],
  ["gst", "gmt"],
  ["cet", "gst"],
  ["est", "aest"],
  ["aest", "est"],
  ["pst", "aest"],
  ["aest", "pst"],
  ["utc", "aest"],
  ["gmt", "aest"],
  ["est", "brt"],
  ["brt", "est"],
  ["utc", "brt"],
  ["cet", "eet"],
];

export const TIMEZONE_PAIRS: TimezonePair[] = PAIR_KEYS.map(([fromKey, toKey]) => {
  const from = TIMEZONE_NODES[fromKey];
  const to = TIMEZONE_NODES[toKey];
  const slug = `${fromKey}-to-${toKey}`;

  return {
    slug,
    from,
    to,
    title: `${from.code} to ${to.code} Converter – ${from.city} to ${to.city} Time`,
    description: `Convert ${from.code} (${from.name}, ${from.city}) to ${to.code} (${to.name}, ${to.city}) instantly. View live clocks, 24-hour comparison table, best meeting overlap hours, and developer code snippets.`,
    popularSearches: [
      `9am ${from.code} to ${to.code}`,
      `10am ${from.code} in ${to.code}`,
      `2pm ${from.code} to ${to.code}`,
      `5pm ${from.code} to ${to.code}`,
      `${from.city} to ${to.city} time difference`,
    ],
  };
});

export function getTimezonePairBySlug(slug: string): TimezonePair | undefined {
  return TIMEZONE_PAIRS.find((p) => p.slug === slug.toLowerCase());
}
