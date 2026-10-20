/**
 * Castov Cron Utilities
 * Parses and describes standard 5-part cron expressions into human-readable text
 * and computes upcoming execution times.
 */

const MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

export interface CronDescription {
  expression: string;
  summary: string;
  details: {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
  };
  nextRuns: string[];
}

function describeField(field: string, unit: string, names?: string[]): string {
  if (field === "*") return `every ${unit}`;
  if (field.startsWith("*/")) {
    const step = field.slice(2);
    return `every ${step} ${unit}s`;
  }
  if (field.includes(",")) {
    const parts = field.split(",").map((p) => {
      const num = parseInt(p, 10);
      return names && names[num] ? names[num] : p;
    });
    return `at ${unit}s ${parts.join(", ")}`;
  }
  if (field.includes("-")) {
    const [start, end] = field.split("-").map((p) => {
      const num = parseInt(p, 10);
      return names && names[num] ? names[num] : p;
    });
    return `from ${start} through ${end}`;
  }
  const val = parseInt(field, 10);
  if (names && names[val]) return names[val];
  return `at ${unit} ${field}`;
}

export function parseCron(expr: string): CronDescription | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const [min, hour, dom, mon, dow] = parts;

  // Basic validation of characters
  const validChars = /^[\d\*\/\,\-]+$/;
  if (!parts.every((p) => validChars.test(p))) return null;

  let summary = "";

  // Common quick patterns
  if (expr === "* * * * *") {
    summary = "Every minute";
  } else if (min.startsWith("*/") && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    summary = `Every ${min.slice(2)} minutes`;
  } else if (min === "0" && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    summary = "Every hour, at minute 0";
  } else if (min === "0" && hour.startsWith("*/") && dom === "*" && mon === "*" && dow === "*") {
    summary = `Every ${hour.slice(2)} hours, on the hour`;
  } else if (dom === "*" && mon === "*" && dow === "*") {
    const h = hour.padStart(2, "0");
    const m = min.padStart(2, "0");
    summary = `Every day at ${h}:${m}`;
  } else if (dom === "*" && mon === "*" && dow !== "*") {
    const h = hour.padStart(2, "0");
    const m = min.padStart(2, "0");
    const dayName = describeField(dow, "day", DAYS);
    summary = `At ${h}:${m}, ${dayName}`;
  } else {
    summary = `At ${hour}:${min}, ${describeField(dom, "day of month")}, ${describeField(mon, "month", MONTHS)}, ${describeField(dow, "day of week", DAYS)}`;
  }

  // Calculate next 3 runs (simple heuristic for next hours)
  const nextRuns: string[] = [];
  try {
    const now = new Date();
    let current = new Date(now.getTime() + 60000); // start from next minute
    current.setSeconds(0, 0);

    let attempts = 0;
    while (nextRuns.length < 3 && attempts < 10080) { // max 7 days in minutes
      attempts++;
      const m = current.getMinutes();
      const h = current.getHours();
      const d = current.getDate();
      const mo = current.getMonth() + 1;
      const dw = current.getDay();

      const matchMin = min === "*" || (min.startsWith("*/") && m % parseInt(min.slice(2), 10) === 0) || min.split(",").includes(m.toString());
      const matchHour = hour === "*" || (hour.startsWith("*/") && h % parseInt(hour.slice(2), 10) === 0) || hour.split(",").includes(h.toString());
      const matchDom = dom === "*" || dom.split(",").includes(d.toString());
      const matchMon = mon === "*" || mon.split(",").includes(mo.toString());
      const matchDow = dow === "*" || dow.split(",").includes(dw.toString()) || (dow.includes("7") && dw === 0);

      if (matchMin && matchHour && matchDom && matchMon && matchDow) {
        nextRuns.push(current.toISOString().replace(".000Z", " UTC"));
      }
      current = new Date(current.getTime() + 60000);
    }
  } catch {
    // fallback if date calc encounters bounds
  }

  return {
    expression: expr,
    summary,
    details: {
      minute: describeField(min, "minute"),
      hour: describeField(hour, "hour"),
      dayOfMonth: describeField(dom, "day"),
      month: describeField(mon, "month", MONTHS),
      dayOfWeek: describeField(dow, "day", DAYS),
    },
    nextRuns,
  };
}
