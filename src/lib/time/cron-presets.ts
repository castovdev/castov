export interface CronPreset {
  slug: string;
  title: string;
  expression: string;
  intent: string;
  category:
    | "interval"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "business"
    | "special";
}

export const CRON_PRESETS: CronPreset[] = [
  { slug: "every-minute", title: "Every minute", expression: "* * * * *", intent: "Run a task once every minute, forever.", category: "interval" },
  { slug: "every-5-minutes", title: "Every 5 minutes", expression: "*/5 * * * *", intent: "Poll a queue or refresh a counter every 5 minutes.", category: "interval" },
  { slug: "every-15-minutes", title: "Every 15 minutes", expression: "*/15 * * * *", intent: "Classic interval for health checks and monitoring.", category: "interval" },
  { slug: "every-hour", title: "Every hour on the hour", expression: "0 * * * *", intent: "Kick off a background job at the start of each hour.", category: "interval" },
  { slug: "daily-midnight", title: "Daily at midnight", expression: "0 0 * * *", intent: "Run nightly backups or cleanups at 00:00 local time.", category: "daily" },
  { slug: "daily-9am", title: "Daily at 09:00", expression: "0 9 * * *", intent: "Send a morning digest or sync with a remote API.", category: "daily" },
  { slug: "weekday-9am", title: "Weekdays at 09:00", expression: "0 9 * * 1-5", intent: "Business-hours start: Monday to Friday at 09:00.", category: "business" },
  { slug: "weekday-6pm", title: "Weekdays at 18:00", expression: "0 18 * * 1-5", intent: "End-of-day reports, Monday through Friday.", category: "business" },
  { slug: "sunday-morning", title: "Sunday 03:00", expression: "0 3 * * 0", intent: "Quiet weekly maintenance on Sunday at 3 AM.", category: "weekly" },
  { slug: "monthly-1st", title: "1st of the month", expression: "0 0 1 * *", intent: "Generate monthly invoices at midnight on day 1.", category: "monthly" },
  { slug: "monthly-15th", title: "15th of the month", expression: "0 12 15 * *", intent: "Mid-month payroll at noon on the 15th.", category: "monthly" },
  { slug: "yearly-jan1", title: "1 January at midnight", expression: "0 0 1 1 *", intent: "Once per year: 1 January at 00:00.", category: "yearly" },
];

export function getPresetBySlug(slug: string): CronPreset | undefined {
  return CRON_PRESETS.find((p) => p.slug === slug);
}
