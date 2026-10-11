import type { FaqItem } from "@/lib/seo";

export const HOME_TITLE = "Castov – Free Time & Timestamp Tools";
export const HOME_DESCRIPTION =
  "Free Unix timestamp converter, epoch converter, ISO 8601 and time zone tools. Fast, private and no sign-up: the converters run in your browser.";

export const WHY_ITEMS = [
  { title: "Free", text: "Every tool is free to use, with no usage limits and no paid tier." },
  { title: "Fast", text: "Small pages and almost no JavaScript, so results appear the moment you press Convert." },
  { title: "Private", text: "The converters run in your browser, so what you type stays on your device. The few tools that use our servers, such as Env Vault, say so on their page." },
  { title: "No account", text: "No sign-up, no login and no email address needed. Open a tool and use it." },
  { title: "Browser-based", text: "Conversions use your browser's built-in date and time zone support, so they work with a slow connection." },
] as const;

export const DEV_SNIPPETS = [
  { label: "JavaScript: timestamp to ISO 8601", code: "new Date(1790000000 * 1000).toISOString()" },
  { label: "Python: timestamp to UTC datetime", code: "from datetime import datetime, timezone\ndatetime.fromtimestamp(1790000000, tz=timezone.utc)" },
  { label: "Bash (GNU date): timestamp to date", code: "date -u -d @1790000000" },
  { label: "PostgreSQL: timestamp to date", code: "SELECT to_timestamp(1790000000);" },
] as const;

export const HOME_FAQ: FaqItem[] = [
  {
    q: "Is Castov really free?",
    a: "Yes. All tools are free, with no account and no usage limits. The site may show ads in the future to cover running costs.",
  },
  {
    q: "Is my data sent to a server?",
    a: "Time, date and converter tools do not upload your input to Castov servers. Some preferences, such as theme, custom time zones and selected models, are stored locally on your device. Some features use the network by design: Env Vault uploads an encrypted copy, and P2P tools use public signaling servers.",
  },
  {
    q: "What is a Unix timestamp?",
    a: "A Unix timestamp is the number of seconds since 1 January 1970 at 00:00:00 UTC. It identifies one moment in time regardless of time zone, which is why programs and APIs use it.",
  },
  {
    q: "Should I use seconds or milliseconds?",
    a: "Use whichever your system produces. A 10-digit value is in seconds and a 13-digit value is in milliseconds. The converters can detect the unit for you.",
  },
  {
    q: "Which time zones are supported?",
    a: "All IANA time zones supported by your browser, such as America/New_York, Europe/Paris, Africa/Algiers and Asia/Tokyo, with daylight saving time rules applied for the date you choose.",
  },
];
