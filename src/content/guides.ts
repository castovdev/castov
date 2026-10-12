export type GuideSlug =
  | "local-llms-webgpu-guide"
  | "understanding-mcp-protocol"
  | "zero-server-ai-privacy"
  | "cursorrules-optimization"
  | "advanced-prompt-engineering"
  | "what-is-unix-time"
  | "seconds-vs-milliseconds-timestamps"
  | "iso-8601-date-format-guide"
  | "time-zones-and-dst-for-developers"
  | "year-2038-problem"
  | "utc-vs-gmt"
  | "cron-expressions-explained"
  | "understanding-regex-ast"
  | "mastering-docker-compose"
  | "linux-file-permissions-chmod-guide"
  | "jwt-security-best-practices"
  | "unix-timestamp-in-code"
  | "mastering-text-diff-algorithms";

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  code?: string;
}

export interface Guide {
  slug: GuideSlug;
  /** Short name used in lists and breadcrumbs. */
  name: string;
  seoTitle: string;
  metaDescription: string;
  summary: string;
  sections: GuideSection[];
  /** Tool slugs to link at the end of the guide. */
  tools: string[];
  readingMinutes: number;
}

export const GUIDES: Guide[] = [

  {
    slug: "local-llms-webgpu-guide",
    name: "Running Local LLMs with WebGPU",
    seoTitle: "A Developer's Guide to Local LLMs via WebGPU | Castov",
    metaDescription: "Learn how to run massive AI models directly in your browser using WebGPU, WebAssembly (WASM), and the zero-server architecture.",
    summary: "Running Large Language Models locally is the next frontier of AI. By leveraging WebGPU, developers can run models like Llama 3 entirely in the browser, eliminating server costs and ensuring absolute data privacy.",
    readingMinutes: 6,
    tools: ["p2p-ghost-tunnel"],
    sections: [
      {
        heading: "The Rise of WebGPU in AI",
        paragraphs: [
          "Historically, running AI models required expensive cloud GPUs. With the introduction of WebGPU—a modern web API that provides low-level access to the device's graphics card—browsers can now execute highly parallel compute workloads natively.",
          "This changes everything. Instead of sending sensitive data to a server API, the user's browser downloads a quantized model (using formats like GGUF) and runs the inference locally."
        ]
      },
      {
        heading: "Memory Management & Quantization",
        paragraphs: [
          "A standard 7B parameter model requires around 14GB of RAM in 16-bit precision. To fit this into consumer devices, we use Quantization (reducing the precision of weights to 4-bit or even 1.58-bit). This drastically reduces the memory footprint, allowing powerful models to run seamlessly on a 4GB RAM laptop."
        ]
      }
    ]
  },
  {
    slug: "understanding-mcp-protocol",
    name: "Understanding MCP Protocol",
    seoTitle: "What is the Model Context Protocol (MCP)? | Castov",
    metaDescription: "A deep dive into the Model Context Protocol (MCP), explaining how it standardizes context injection for AI editors like Cursor and Claude Desktop.",
    summary: "The Model Context Protocol (MCP) is an open standard that allows developers to securely expose local resources, databases, and APIs to AI assistants. Learn how it turns isolated LLMs into context-aware agents.",
    readingMinutes: 5,
    tools: ["mcp-config-builder"],
    sections: [
      {
        heading: "What is MCP?",
        paragraphs: [
          "The Model Context Protocol (MCP) is to AI what USB-C is to hardware. It acts as a universal adapter that allows AI models to read from your local databases, search your GitHub repos, or query your Slack workspace securely without needing custom plugins for every app."
        ]
      },
      {
        heading: "How MCP Works Under the Hood",
        paragraphs: [
          "MCP uses a client-server architecture over standard transport layers (like stdio or SSE). The AI Editor (like Cursor or Claude) acts as the Client. You run a lightweight MCP Server locally that securely reads a specific database and streams the context back to the AI using a standardized JSON-RPC format."
        ]
      }
    ]
  },
  {
    slug: "cursorrules-optimization",
    name: "Optimizing .cursorrules",
    seoTitle: "How to Write the Perfect .cursorrules File | Castov",
    metaDescription: "Maximize your AI coding efficiency by crafting the ultimate .cursorrules file for context-aware code generation in the Cursor IDE.",
    summary: "AI code editors like Cursor are only as smart as the context they are given. A well-crafted .cursorrules file instructs the AI on your exact tech stack, architecture rules, and formatting preferences.",
    readingMinutes: 4,
    tools: ["cursorrules-generator"],
    sections: [
      {
        heading: "The Importance of Project Context",
        paragraphs: [
          "When you ask an AI to 'create a login component', it has thousands of ways to do it. Should it use React or Vue? Tailwind or CSS Modules? By placing a .cursorrules file in the root of your project, you constrain the AI's creativity to match your exact architectural guidelines."
        ]
      },
      {
        heading: "Anatomy of a Great Rule File",
        paragraphs: [
          "A perfect .cursorrules file includes three main sections: 1. The Stack (Next.js 15, App Router, TypeScript). 2. The UI Patterns (Tailwind, Lucide Icons, Shadcn UI). 3. The Anti-Patterns (NEVER use 'any', always use Server Actions over API routes)."
        ]
      }
    ]
  },
  {
    slug: "zero-server-ai-privacy",
    name: "The Zero-Server AI Era",
    seoTitle: "Zero-Server AI: The Ultimate Approach to Data Privacy | Castov",
    metaDescription: "Explore why zero-server architecture is the definitive solution for developer AI privacy, ensuring proprietary code never leaves your local machine.",
    summary: "Developers and teams are cautious about pasting proprietary code into external models. Zero-Server AI solves this by bringing the model directly to the user's device, ensuring that sensitive data is processed 100% locally.",
    readingMinutes: 5,
    tools: ["secret-scanner"],
    sections: [
      {
        heading: "The Developer AI Privacy Dilemma",
        paragraphs: [
          "While APIs like OpenAI are incredibly powerful, they require you to send your data over the internet. For healthcare, finance, and deep tech companies, sending proprietary algorithms or PII to a third-party server is a massive security violation."
        ]
      },
      {
        heading: "Client-Side Processing",
        paragraphs: [
          "Zero-Server architecture shifts the compute paradigm. Instead of sending data to the server, we send the logic (the app) to the client. The browser downloads the necessary WASM modules and AI models, disconnects from the backend, and processes everything locally. It's the ultimate firewall."
        ]
      }
    ]
  },
  {
    slug: "advanced-prompt-engineering",
    name: "Advanced Prompt Patterns",
    seoTitle: "Advanced Prompt Engineering Patterns for Developers | Castov",
    metaDescription: "Move beyond simple prompts. Learn advanced engineering patterns like Chain-of-Thought, Few-Shot prompting, and React (Reasoning and Acting) loops.",
    summary: "Prompt engineering has evolved into a rigid software discipline. Master the architectural patterns of prompting to yield deterministic, high-quality code from unpredictable LLMs.",
    readingMinutes: 7,
    tools: ["vercel-ai-sdk-code-generator"],
    sections: [
      {
        heading: "Chain of Thought (CoT)",
        paragraphs: [
          "LLMs often fail at complex logic if asked to provide the final answer immediately. By adding the phrase 'Think step by step' or explicitly creating a <thinking> block, the model is forced to allocate computation to the reasoning process before writing the code, drastically reducing hallucinations."
        ]
      },
      {
        heading: "Few-Shot Formatting",
        paragraphs: [
          "If you need JSON output, don't just describe the JSON. Provide 3 exact examples of the input-output pairs. LLMs are pattern-matching engines; few-shot examples anchor their probability distribution, ensuring the output matches your schema perfectly."
        ]
      }
    ]
  },


  {
    slug: "understanding-regex-ast",
    name: "Understanding Regex AST",
    seoTitle: "Regex AST (Abstract Syntax Tree) Explained | Castov",
    metaDescription: "Learn how Regular Expressions are parsed into Abstract Syntax Trees (AST) under the hood and how visualizers can help you write better patterns.",
    summary: "Regular Expressions are notoriously hard to read. By breaking them down into an Abstract Syntax Tree (AST), developers can easily debug, understand, and optimize complex patterns.",
    readingMinutes: 4,
    tools: ["regex-explainer"],
    sections: [
      {
        heading: "What is an Abstract Syntax Tree?",
        paragraphs: [
          "An Abstract Syntax Tree (AST) is a tree representation of the abstract syntactic structure of source code written in a programming language. In the context of Regular Expressions, an AST breaks down a dense string of characters like ^[a-z]+$ into logical, nested nodes.",
          "Instead of trying to parse the string visually, an AST separates the pattern into Anchors, Quantifiers, Character Classes, and Groups."
        ]
      },
      {
        heading: "Why Visualize Regex?",
        paragraphs: [
          "When you write a regex for an email validator, it might look like a random jumble of symbols. A visualizer maps each symbol to its English equivalent, ensuring that your pattern actually does what you intended without catastrophic backtracking."
        ]
      }
    ]
  },
  {
    slug: "mastering-docker-compose",
    name: "Mastering Docker Compose",
    seoTitle: "Mastering Docker Compose Architecture | Castov",
    metaDescription: "A deep dive into visualizing and structuring complex microservices architectures using Docker Compose.",
    summary: "Docker Compose allows developers to define and run multi-container Docker applications. Understanding the network topology and service dependencies is critical for modern infrastructure.",
    readingMinutes: 5,
    tools: ["docker-visualizer"],
    sections: [
      {
        heading: "The Power of Infrastructure as Code",
        paragraphs: [
          "Docker Compose uses a YAML file to configure your application’s services, networks, and volumes. With a single command, you create and start all the services from your configuration.",
          "However, as applications grow, the docker-compose.yml file can become hundreds of lines long. Visualizing this file as a node graph helps teams instantly understand service dependencies (e.g., frontend depends on backend, backend depends on redis and postgres)."
        ]
      }
    ]
  },

  {
    slug: "what-is-unix-time",
    name: "What Is Unix Time?",
    seoTitle: "What Is Unix Time? Epoch Time Explained | Castov",
    metaDescription:
      "Learn what Unix time is, how it counts seconds since 1 January 1970 UTC, how it treats leap seconds and negative values, and where you will meet it.",
    summary: "A plain-language explanation of Unix time, the epoch and why programs count time this way.",
    readingMinutes: 4,
    sections: [
      {
        heading: "The short definition",
        paragraphs: [
          "Unix time is the number of seconds that have passed since 00:00:00 UTC on 1 January 1970. That starting moment is called the Unix epoch. The number 0 means the epoch itself, 86400 means exactly one day later, and 1790000000 means about 56 years and 9 months after it.",
          "Because the count is a single integer that does not change with location, it is easy to store, sort and compare. Two servers on opposite sides of the world that read the same Unix timestamp are talking about the same instant, even if their clocks show different hours.",
        ],
      },
      {
        heading: "Why 1 January 1970?",
        paragraphs: [
          "The starting point was a practical choice by the early Unix developers, not a historical event. Early versions counted time in sixtieths of a second, which overflowed within a few years, so later versions switched to whole seconds and settled on 1970 as the reference. The convention spread to C, POSIX, Linux, macOS, databases and most web technologies, and it is still the default today.",
        ],
      },
      {
        heading: "Leap seconds and time zones",
        paragraphs: [
          "Unix time treats every day as exactly 86,400 seconds. Real clocks occasionally add a leap second to stay aligned with the Earth's rotation; systems handle it by repeating a second or by smearing it over several hours. For everyday work you can ignore this, but it means Unix time is not a perfect count of physical seconds.",
          "A Unix timestamp has no time zone. A time zone only enters the picture when you turn the number into a calendar date and clock reading. The same timestamp is 14:13 in London and 09:13 in New York on the same day, and it is still the same timestamp.",
        ],
      },
      {
        heading: "Dates before 1970 and very large values",
        paragraphs: [
          "Moments before the epoch are negative numbers: -86400 is 31 December 1969 00:00:00 UTC. Systems that store the value in a signed 32-bit integer can represent dates only from 1901 to 2038, which is the cause of the Year 2038 problem. Modern languages use 64-bit values that cover far more than the range of the calendar.",
        ],
      },
      {
        heading: "Where you will meet it",
        paragraphs: [
          "Log files, database columns, API responses, JSON Web Tokens (the exp and iat claims), file metadata, cache headers and cron-style schedulers all use Unix timestamps. Some use seconds and some use milliseconds, which is the most common source of confusion; the guide on seconds versus milliseconds shows how to tell them apart.",
        ],
      },
    ],
    tools: ["unix-timestamp-converter", "epoch-converter", "current-unix-timestamp"],
  },
  {
    slug: "seconds-vs-milliseconds-timestamps",
    name: "Seconds vs Milliseconds Timestamps",
    seoTitle: "Seconds vs Milliseconds Timestamps: How to Tell Them Apart | Castov",
    metaDescription:
      "Tell Unix timestamps in seconds, milliseconds, microseconds and nanoseconds apart by digit count, and fix the classic bug of dates landing in 1970.",
    summary: "How to recognise the unit of a timestamp, which platforms use which, and how to convert safely.",
    readingMinutes: 4,
    sections: [
      {
        heading: "Count the digits",
        paragraphs: [
          "For dates between 2001 and 2286, the number of digits gives away the unit. Ten digits is seconds, thirteen digits is milliseconds, sixteen is microseconds and nineteen is nanoseconds. For example 1790000000 is seconds, 1790000000000 is milliseconds, 1790000000000000 is microseconds and 1790000000000000000 is nanoseconds.",
          "The Castov converters use the same idea in their Auto setting: values with twelve or more digits are read as milliseconds, everything else as seconds. That rule can be wrong only for milliseconds before March 1973 and seconds after the year 5138.",
        ],
      },
      {
        heading: "Which platforms use which",
        paragraphs: [
          "Seconds are the classic Unix unit. You get them from the C time() function, the date +%s command, PHP's time(), Go's Unix(), MySQL's UNIX_TIMESTAMP() and PostgreSQL's EXTRACT(EPOCH FROM ...). JSON Web Token claims such as exp and iat are also defined in seconds.",
          "Milliseconds are common where sub-second precision matters or where the language grew up around the browser: JavaScript's Date.now(), Java's System.currentTimeMillis() and .NET's ToUnixTimeMilliseconds(). Always check the documentation of the API you are calling, because the same field name can hold either unit.",
        ],
      },
      {
        heading: "The classic bugs",
        paragraphs: [
          "If you read a seconds value as milliseconds, the date lands a few weeks after 1 January 1970, because 1790000000 milliseconds is only about 20 days. If you read a milliseconds value as seconds, you get a date tens of thousands of years in the future, and many libraries report an invalid date. Either symptom tells you the unit is wrong.",
        ],
      },
      {
        heading: "Converting safely",
        paragraphs: [
          "Multiply seconds by 1,000 to get milliseconds, and divide milliseconds by 1,000 to get seconds. When you divide, decide whether to round down or keep the fraction. Rounding down with Math.floor is the usual choice, because it never moves a timestamp into the future.",
        ],
        code: "const seconds = Math.floor(Date.now() / 1000);\nconst milliseconds = seconds * 1000;",
      },
    ],
    tools: ["milliseconds-to-date", "unix-timestamp-converter", "epoch-converter"],
  },
  {
    slug: "iso-8601-date-format-guide",
    name: "ISO 8601 Date and Time Format",
    seoTitle: "ISO 8601 Date and Time Format: A Practical Guide | Castov",
    metaDescription:
      "A practical guide to ISO 8601 date and time strings: the T separator, Z and UTC offsets, fractional seconds and the JavaScript parsing pitfalls to avoid.",
    summary: "How ISO 8601 strings are built, what Z and offsets mean, and the parsing traps that cause off-by-hours bugs.",
    readingMinutes: 5,
    sections: [
      {
        heading: "Anatomy of an ISO 8601 string",
        paragraphs: [
          "The extended format writes the largest unit first: year, month, day, then a T, then hours, minutes and seconds, then a time zone designator. Example: 2026-09-20T12:30:00Z. Fractional seconds follow the seconds after a dot, as in 2026-09-20T12:30:00.250Z. A date can also stand alone, as in 2026-09-20.",
          "Because the largest unit comes first and every field has a fixed width, strings in the same offset sort alphabetically in time order. That makes the format excellent for filenames, logs and database keys.",
        ],
      },
      {
        heading: "Z and UTC offsets",
        paragraphs: [
          "Z means UTC (zero offset). Otherwise the string ends with a signed offset from UTC: +02:00 is two hours ahead of UTC, -05:00 is five hours behind. So 2026-09-20T14:30:00+02:00 and 2026-09-20T12:30:00Z describe the same instant and have the same Unix timestamp.",
          "An offset is not a time zone. It records the difference at that one moment, and says nothing about daylight saving changes later. If you need to schedule something in the future, store the IANA zone name too.",
        ],
      },
      {
        heading: "ISO 8601 vs RFC 3339",
        paragraphs: [
          "RFC 3339 is a stricter profile of ISO 8601 used by many internet protocols and APIs. It requires a full date and time with an offset or Z, and it allows a space instead of the T. Most JSON APIs that say they use ISO 8601 actually mean this profile.",
        ],
      },
      {
        heading: "Pitfalls when parsing",
        paragraphs: [
          "Strings without an offset are ambiguous. In JavaScript, new Date('2026-09-20') is parsed as midnight UTC, but new Date('2026-09-20T00:00:00') is parsed as midnight in the local time zone. The same source text can produce two different instants depending on whether a time is included.",
          "The safest habit is to always include Z or an explicit offset when you write dates, and to reject or explicitly document how you treat strings that lack one.",
        ],
        code: "new Date('2026-09-20').toISOString();          // 2026-09-20T00:00:00.000Z\nnew Date('2026-09-20T00:00:00').toISOString(); // depends on the local time zone",
      },
    ],
    tools: ["iso-8601-to-unix", "unix-to-iso-8601", "timezone-converter"],
  },
  {
    slug: "time-zones-and-dst-for-developers",
    name: "Time Zones and DST for Developers",
    seoTitle: "Time Zones and Daylight Saving Time: Pitfalls for Developers | Castov",
    metaDescription:
      "Practical rules for handling time zones and daylight saving time in software: store UTC, use IANA names, and avoid the gaps, overlaps and 23-hour days.",
    summary: "The handful of rules that prevent most time zone bugs, with the daylight saving edge cases explained.",
    readingMinutes: 5,
    sections: [
      {
        heading: "Store UTC, display local",
        paragraphs: [
          "Store moments in time as UTC timestamps or ISO 8601 strings that end in Z, and convert to a time zone only when you show them to a person. This keeps comparisons and sorting simple and avoids ambiguity when servers, browsers and users are in different places.",
        ],
      },
      {
        heading: "Use IANA zone names, not offsets or abbreviations",
        paragraphs: [
          "A region name such as Europe/Paris or America/New_York identifies a place and includes its full history of rule changes. An offset like +01:00 only describes one moment, and an abbreviation like IST can mean India, Ireland or Israel. When you need to know what the local time will be next month, you need the zone name.",
        ],
      },
      {
        heading: "Daylight saving edge cases",
        paragraphs: [
          "When clocks spring forward, a whole hour of local time does not exist. On 8 March 2026 in New York, 02:30 never happens. When clocks fall back, an hour happens twice: 01:30 on 1 November 2026 occurs once in daylight time and once in standard time. Code that assumes every local time maps to exactly one instant will misbehave on those two days.",
          "It also means days are not always 24 hours long. Adding 24 hours to a local date-time is not the same as adding one calendar day. Use a date library or Intl-based conversions for calendar arithmetic, and use plain timestamps for durations.",
        ],
      },
      {
        heading: "Recurring events and rule changes",
        paragraphs: [
          "For a recurring meeting at 09:00 local time, store the local time and the IANA zone, not a fixed UTC time, so it stays at 09:00 when daylight saving starts. Governments also change their rules, sometimes with little notice, and the IANA time zone database is updated several times a year. Keep your runtime, browser and operating system updated so the rules stay current.",
        ],
      },
    ],
    tools: ["timezone-converter", "date-to-timestamp", "timestamp-difference"],
  },
  {
    slug: "year-2038-problem",
    name: "The Year 2038 Problem",
    seoTitle: "The Year 2038 Problem Explained (Y2038) | Castov",
    metaDescription:
      "The Year 2038 problem explained: why signed 32-bit Unix timestamps overflow on 19 January 2038 at 03:14:07 UTC, who is affected and how to fix it.",
    summary: "Why 32-bit Unix timestamps run out in 2038, what breaks, and how to check your own systems.",
    readingMinutes: 3,
    sections: [
      {
        heading: "What happens in 2038",
        paragraphs: [
          "Many older systems store Unix time in a signed 32-bit integer. The largest value such an integer can hold is 2,147,483,647, which is 03:14:07 UTC on 19 January 2038. One second later the value wraps around to -2,147,483,648, which older software reads as 20:45:52 UTC on 13 December 1901.",
          "You can check both moments by entering 2147483647 and -2147483648 in the epoch converter.",
        ],
      },
      {
        heading: "What is affected",
        paragraphs: [
          "Software compiled with a 32-bit time_t, embedded devices and firmware that will still be running in 2038, file formats with 32-bit time fields, and some database column types are the main risks. For example, MySQL's TIMESTAMP column type is documented as ending at 2038-01-19 03:14:07 UTC, while DATETIME covers a much longer range.",
          "Most modern 64-bit operating systems and current language runtimes already use 64-bit time values, which cover hundreds of billions of years. The risk is concentrated in long-lived devices, old binaries and data formats.",
        ],
      },
      {
        heading: "What to do about it",
        paragraphs: [
          "Store timestamps in 64-bit integers or in date-time column types with a wide range. Audit any place where a timestamp is cast to a 32-bit integer, serialised into a binary format, or accepted from a device. Test your systems with dates after 2038 and with the boundary values above, and plan upgrades for hardware that cannot be updated.",
        ],
      },
    ],
    tools: ["epoch-converter", "unix-timestamp-converter", "timestamp-to-date"],
  },
  {
    slug: "utc-vs-gmt",
    name: "UTC vs GMT: What Is the Difference?",
    seoTitle: "UTC vs GMT: What Is the Difference? | Castov",
    metaDescription:
      "UTC and GMT keep the same clock time in practice, but they are defined differently. Learn the technical distinction and why software should use UTC.",
    summary: "Why UTC and GMT usually show the same time, how they differ technically, and which one to use in software.",
    readingMinutes: 3,
    sections: [
      {
        heading: "The short answer",
        paragraphs: [
          "For almost every practical purpose, UTC and GMT are the same time. If a clock says it is showing GMT, it will show the same hour and minute as a clock showing UTC. The difference between them is technical, not something you would notice on a wall clock.",
        ],
      },
      {
        heading: "What each one actually is",
        paragraphs: [
          "GMT (Greenwich Mean Time) is a time zone, originally defined by the average time the sun crosses the meridian at Greenwich, London. UTC (Coordinated Universal Time) is a time standard, maintained by atomic clocks and coordinated internationally. UTC does not observe daylight saving time, and neither does GMT as a zone, which is part of why they line up so closely.",
          "The small technical gap between them (fractions of a second, managed historically through leap seconds) is irrelevant for calendars, schedules or software timestamps.",
        ],
      },
      {
        heading: "Which one to use in software",
        paragraphs: [
          "Use UTC. It is the modern standard, it is what Unix time, ISO 8601 and virtually every programming language's time zone database use as the reference point, and it is unambiguous: there is no country or region called \u201CUTC\u201D that could add its own daylight saving rule to it. GMT, by contrast, is also the name of an actual time zone used by the UK in winter, which can cause confusion when a UK server's local zone is labelled GMT.",
        ],
      },
      {
        heading: "One practical trap",
        paragraphs: [
          "Because the UK's time zone is called GMT in winter and BST (British Summer Time) in summer, code that hard-codes \u201CGMT\u201D as an offset can be off by an hour for half the year. Use the IANA zone name Europe/London instead of the abbreviation GMT if you specifically mean UK local time, and use UTC when you mean the neutral reference point.",
        ],
      },
    ],
    tools: ["utc-converter", "timezone-converter", "world-clock"],
  },
  {
    slug: "cron-expressions-explained",
    name: "Cron Expressions Explained",
    seoTitle: "Cron Expressions Explained: Syntax and Examples | Castov",
    metaDescription:
      "How cron expressions work: the five fields, common patterns like */15 and 1-5, the day-of-month/day-of-week rule, and mistakes to avoid.",
    summary: "How the five fields of a standard cron expression work, with common patterns and the rule that trips people up.",
    readingMinutes: 4,
    sections: [
      {
        heading: "The five fields",
        paragraphs: [
          "A standard cron expression has five space-separated fields, in this order: minute (0-59), hour (0-23), day of the month (1-31), month (1-12) and day of the week (0-6, where both 0 and 7 mean Sunday depending on the implementation). A job that should run at 09:00 on weekdays is written as 0 9 * * 1-5.",
        ],
      },
      {
        heading: "Values, ranges, lists and steps",
        paragraphs: [
          "Each field accepts more than a single number. An asterisk (*) means every value. A range like 1-5 means every value from 1 to 5 inclusive. A comma-separated list like 1,3,5 means exactly those values. A step like */15 means every 15th value starting from the field's minimum, so */15 in the minute field matches 0, 15, 30 and 45.",
          "These can combine: 0 9-17/2 * * 1-5 means the top of the hour, every 2 hours from 9 to 17, on weekdays.",
        ],
      },
      {
        heading: "The day-of-month and day-of-week trap",
        paragraphs: [
          "If both the day-of-month and day-of-week fields are restricted (neither is *), standard cron treats them as an OR, not an AND: the job runs when either condition is true. For example 0 0 1 * 1 does not mean \u201Cthe first of the month, but only if it's a Monday\u201D; it means \u201Cevery 1st of the month, and also every Monday.\u201D To mean only the first Monday of the month, most schedulers need a different mechanism entirely, since standard cron cannot express that.",
        ],
      },
      {
        heading: "Shortcuts and variants",
        paragraphs: [
          "Many cron implementations accept shortcuts like @daily, @hourly and @weekly as aliases for common five-field expressions. Some schedulers (such as Quartz, used by many Java applications) add a sixth field for seconds and sometimes a seventh for the year; those expressions look similar but are not interchangeable with standard 5-field cron, so double-check which flavour a given system expects before pasting one in.",
        ],
      },
    ],
    tools: ["cron-generator", "current-unix-timestamp"],
  },
  {
    slug: "linux-file-permissions-chmod-guide",
    name: "Linux File Permissions & Chmod Guide",
    seoTitle: "Linux Permissions & Chmod Explained: 777 vs 755 vs 644 | Castov",
    metaDescription:
      "A complete guide to Linux file permissions, octal notation (777, 755, 644), owner/group/other access rights, and production security rules.",
    summary: "How Linux file permissions work, why octal numbers like 755 and 644 are calculated, and why chmod 777 is a dangerous anti-pattern.",
    readingMinutes: 6,
    tools: ["chmod-calculator", "cron-generator"],
    sections: [
      {
        heading: "The Permission Triad: Owner, Group, and Others",
        paragraphs: [
          "Every file and directory in Linux has three distinct classes of users who can interact with it: the Owner (the user who created it), the Group (a team of users sharing permissions), and Others (everyone else with access to the system).",
          "Each of these three classes can have up to three distinct rights: Read (r), Write (w), and Execute (x). When viewing permissions in terminal via `ls -l`, you see a 9-character string such as `-rwxr-xr--` reflecting these three groups.",
        ],
      },
      {
        heading: "The Octal Math: Read (4), Write (2), Execute (1)",
        paragraphs: [
          "Instead of writing out symbolic strings, Linux allows numeric shorthand called octal notation. Each permission is assigned a specific binary power of two:",
          "Read = 4, Write = 2, Execute = 1. Combining them gives a unique sum between 0 and 7. For example: 4 + 2 + 1 = 7 (Read, Write, and Execute). 4 + 2 = 6 (Read and Write). 4 + 1 = 5 (Read and Execute). 4 = 4 (Read only).",
          "A three-digit code like 755 simply concatenates the sum for each class: Owner gets 7 (rwx), Group gets 5 (r-x), and Others get 5 (r-x).",
        ],
      },
      {
        heading: "Why chmod 777 is a Severe Production Risk",
        paragraphs: [
          "Developers frequently run `chmod 777` when facing a 'Permission denied' error because it immediately solves the roadblock. However, 777 grants universal write access, meaning any compromised process or malicious local user can modify, replace, or execute arbitrary code inside that file.",
          "In web servers (like Nginx or Apache), public writable files can allow attackers to inject web shells or overwrite environment secrets. Never deploy files with 777 in production.",
        ],
      },
      {
        heading: "Recommended Safe Permissions",
        paragraphs: [
          "For static web assets, configuration files, and scripts, the golden rule of least privilege applies:",
          "Standard files: 644 (Owner can read/write; Group and Others can only read).",
          "Standard directories: 755 (Owner has full control; Group and Others can traverse and read contents).",
          "Private keys & credentials (.env, id_rsa): 600 or 400 (Only Owner can read/write, zero access for Group and Others).",
        ],
      },
    ],
  },
  {
    slug: "jwt-security-best-practices",
    name: "JSON Web Tokens (JWT) Security Best Practices",
    seoTitle: "JWT Security Best Practices: Claims, Expiration & Pitfalls | Castov",
    metaDescription:
      "Understand JSON Web Tokens (JWT) architecture: header, payload, signature, exp/iat claims, algorithm-none attacks, and secure token verification.",
    summary: "How JSON Web Tokens work under the hood, how to properly handle exp/iat expiration claims, and critical vulnerabilities to avoid in production.",
    readingMinutes: 5,
    tools: ["jwt-debugger", "base64-encoder-decoder"],
    sections: [
      {
        heading: "Anatomy of a JWT: Three Base64Url Segments",
        paragraphs: [
          "A JSON Web Token (RFC 7519) is a compact, URL-safe representation of claims between two parties. It consists of three parts separated by dots (`.`): Header, Payload, and Signature.",
          "The Header specifies the token type and cryptographic algorithm (e.g. HS256, RS256). The Payload contains the claims (user ID, roles, timestamps). The Signature is computed by hashing the header and payload with a secret or private key, preventing tampering.",
        ],
      },
      {
        heading: "The Crucial Standard Claims: exp, iat, and nbf",
        paragraphs: [
          "JWTs are stateless; once issued, the backend cannot easily revoke them without a blacklist or short expiry. Always enforce standard temporal claims:",
          "`exp` (Expiration Time): The Unix timestamp after which the token is strictly invalid.",
          "`iat` (Issued At): The Unix timestamp when the token was generated, useful for age calculation.",
          "`nbf` (Not Before): The Unix timestamp before which the token must not be accepted.",
        ],
      },
      {
        heading: "The Infamous 'alg: none' Vulnerability",
        paragraphs: [
          "In early JWT library implementations, the specification allowed an algorithm value of `none` for unsecured tokens. Attackers could modify the payload, set `alg: 'none'`, strip the signature, and bypass authentication completely.",
          "Modern verification libraries require explicitly whitelisting acceptable algorithms (e.g., only allowing `['HS256']` or `['RS256']`) to completely prevent downgrade attacks.",
        ],
      },
      {
        heading: "Secure Storage: HttpOnly Cookies vs LocalStorage",
        paragraphs: [
          "Storing access tokens in browser `localStorage` exposes them to any Cross-Site Scripting (XSS) vulnerability. If malicious JavaScript executes on your page, your user's tokens can be stolen immediately.",
          "For web applications, the most secure approach is storing JWT session tokens in `HttpOnly, Secure, SameSite=Lax` cookies, preventing JavaScript access entirely while safeguarding against CSRF attacks.",
        ],
      },
    ],
  },
  {
    slug: "unix-timestamp-in-code",
    name: "Unix Timestamps in Python, JavaScript, and Go",
    seoTitle: "How to Work with Unix Timestamps in Python, JavaScript, and Go | Castov",
    metaDescription:
      "Practical code recipes to get, parse, and format Unix epoch timestamps in JavaScript (Node.js), Python 3, Go, and Rust without timezone bugs.",
    summary: "How to generate and format Unix timestamps across JavaScript, Python, and Go, plus common pitfalls like milliseconds vs seconds.",
    readingMinutes: 5,
    tools: ["unix-timestamp-converter", "epoch-converter", "timestamp-to-date"],
    sections: [
      {
        heading: "The Milliseconds Trap in JavaScript",
        paragraphs: [
          "In JavaScript and Node.js, `Date.now()` and `new Date().getTime()` return timestamps in milliseconds (13 digits), whereas Unix standard counts seconds (10 digits).",
          "To get a standard 10-digit Unix timestamp in JavaScript: `const timestamp = Math.floor(Date.now() / 1000);`.",
          "Passing a 10-digit second timestamp directly to `new Date(ts)` causes JavaScript to treat it as milliseconds, resulting in a date in January 1970. Always multiply by 1000 first: `new Date(ts * 1000)`.",
        ],
      },
      {
        heading: "Python 3: time.time() vs datetime.fromtimestamp()",
        paragraphs: [
          "In Python, obtaining the current timestamp in seconds is straightforward with `time.time()`, which returns a float:",
          "`import time; ts = int(time.time())`",
          "When parsing timestamps back to datetimes, always use timezone-aware methods to prevent naive local time bugs: `from datetime import datetime, timezone; dt = datetime.fromtimestamp(ts, tz=timezone.utc)`.",
        ],
      },
      {
        heading: "Go (Golang): time.Now().Unix()",
        paragraphs: [
          "Go provides explicit, type-safe standard library helpers for Unix time:",
          "Get current seconds: `nowSeconds := time.Now().Unix()`",
          "Get current milliseconds: `nowMillis := time.Now().UnixMilli()`",
          "Convert timestamp to time.Time: `t := time.Unix(sec, nsec)`.",
        ],
      },
      {
        heading: "Safe Database Storage & 64-Bit Integers",
        paragraphs: [
          "Always store Unix timestamps in signed 64-bit integers (`BIGINT` in PostgreSQL/MySQL). Storing timestamps in 32-bit integers will overflow on January 19, 2038 (the Year 2038 Problem).",
          "64-bit integer timestamps guarantee your database will handle timestamps accurately for hundreds of billions of years.",
        ],
      },
    ],
  },
  {
    slug: "mastering-text-diff-algorithms",
    name: "Understanding Diff Algorithms and Patch Workflows",
    seoTitle: "How Diff Algorithms Work: Myers Algorithm, Unified Diffs & Patches | Castov",
    metaDescription:
      "Learn how text comparison algorithms work under the hood, how Myers algorithm computes minimal edit scripts, and how unified diffs power Git.",
    summary: "The math and mechanics of calculating text differences: Longest Common Subsequences, Myers algorithm, and unified diff syntax.",
    readingMinutes: 5,
    tools: ["diff-checker", "json-formatter"],
    sections: [
      {
        heading: "The Longest Common Subsequence (LCS) Problem",
        paragraphs: [
          "At the core of any diff tool is finding what remained unchanged between two versions of a document. This is mathematically formulated as the Longest Common Subsequence (LCS) problem.",
          "By identifying the elements that both versions share in order, the differences can be represented as a minimal sequence of insertions and deletions.",
        ],
      },
      {
        heading: "The Myers Diff Algorithm",
        paragraphs: [
          "Published by Eugene Myers in 1986, the Myers algorithm is the default engine behind `git diff` and standard Unix `diff`. It treats difference calculation as finding the shortest path on an edit graph.",
          "Myers operates in O((N+M)D) time, where N and M are line counts and D is the number of edits. For typical code files where edits are small compared to total file length, it executes almost instantaneously.",
        ],
      },
      {
        heading: "Anatomy of a Unified Diff",
        paragraphs: [
          "Unified format combines differences into a single stream with context lines. It starts with file headers (`--- original` and `+++ modified`), followed by hunk headers like `@@ -1,5 +1,6 @@`.",
          "Lines prefixed with ` ` (space) are unchanged context. Lines prefixed with `-` are deleted, and lines prefixed with `+` are inserted.",
        ],
      },
      {
        heading: "Applications Beyond Code Reviews",
        paragraphs: [
          "Diff algorithms are not limited to Git commits. Modern software uses diffing for API payload drift detection, database schema migrations, collaborative real-time editing (Operational Transformation / CRDTs), and client-side form change tracking.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
