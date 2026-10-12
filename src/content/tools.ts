import type { FaqItem } from "@/lib/seo";
import type { GuideSlug } from "./guides";

export type ToolSlug =
  | "p2p-ghost-tunnel"
  | "steganography-env-vault"
  | "3d-json-galaxy"
  | "regex-genetic-evolution"
  | "api-time-machine"
  | "ast-conflict-telepathy"
  | "unix-timestamp-converter"
  | "epoch-converter"
  | "timestamp-to-date"
  | "date-to-timestamp"
  | "current-unix-timestamp"
  | "milliseconds-to-date"
  | "iso-8601-to-unix"
  | "unix-to-iso-8601"
  | "timezone-converter"
  | "timestamp-difference"
  | "utc-converter"
  | "date-difference"
  | "time-duration-calculator"
  | "add-time"
  | "subtract-time"
  | "unix-timestamp-validator"
  | "epoch-milliseconds"
  | "unix-timestamp-batch-converter"
  | "date-format-converter"
  | "iso-8601-converter"
  | "rfc-3339-converter"
  | "timezone-offset"
  | "world-clock"
  | "business-hours-converter"
  | "cron-generator"
  | "timezone-simulator"
  | "universal-config-sync"
  | "env-vault"
  | "secret-scanner"
  | "api-load-tester"
  | "docker-visualizer"
  | "sqlite-fiddle"
  | "fetch-mock-generator"
  | "regex-explainer"
  | "json-viewer"
  | "json-to-ts"
  | "diff-checker"
  | "nexus-grid"
  | "sonic-gap"
  | "quantum"
  | "json-formatter"
  | "base64-encoder-decoder"
  | "jwt-decoder"
  | "uuid-generator"
  | "hash-generator"
  | "code-to-image"
  | "glassmorphism-generator"
  | "github-readme-generator"
  | "app-mockup"
  | "favicon-generator"
  | "color-converter"
  | "token-visualizer"
  | "git-time-traveler"
  | "svg-animator"
  | "mock-data-studio";

export interface ContentSection {
  heading: string;
  paragraphs: string[];
}

export type ToolCategory = "Timestamp" | "Date & Duration" | "Time Zones" | "Developer" | "Labs";
export const TOOL_CATEGORIES: ToolCategory[] = ["Timestamp", "Date & Duration", "Time Zones", "Developer", "Labs"];

export interface Tool {
  slug: ToolSlug;
  category: ToolCategory;
  /** Short name for breadcrumbs, cards and menus. Also the page H1. */
  name: string;
  seoTitle: string;
  metaDescription: string;
  /** One short paragraph shown under the H1. */
  intro: string;
  /** One line shown on tool cards. */
  cardDescription: string;
  sections: ContentSection[];
  howTo: string[];
  faq: FaqItem[];
  related: ToolSlug[];
  guide?: GuideSlug;
  /** Marks the tool as a paid/Pro feature */
  isPro?: boolean;
}

export const TOOLS: Tool[] = [
  {
    slug: 'json-to-ts',
    category: 'Developer',
    name: 'JSON to TypeScript',
    seoTitle: 'JSON to TypeScript Interfaces Converter | Castov',
    metaDescription: 'Instantly convert JSON objects into clean, strictly typed TypeScript interfaces online with zero server uploads.',
    intro: 'Paste your JSON data to automatically generate production-ready TypeScript type definitions and interfaces. Custom property naming, optional keys detection, and instant shareable URLs.',
    cardDescription: 'Convert JSON strings to TypeScript interfaces.',
    howTo: [
      'Paste your raw JSON object or array into the input editor.',
      'Review the generated TypeScript interface in the output pane.',
      'Copy the generated TypeScript types or generate a shareable URL.'
    ],
    faq: [
      { q: 'Is my JSON uploaded to a server?', a: 'No, the conversion is performed entirely client-side in your browser using JavaScript.' },
      { q: 'How does it handle nested objects and arrays?', a: 'Nested objects are extracted into separate, strongly typed interface declarations with PascalCase names.' },
      { q: 'Can I convert large JSON payloads?', a: 'Yes, because parsing and type inference run locally, you can convert multi-megabyte payloads in milliseconds.' },
      { q: 'Are optional properties detected?', a: 'When arrays contain varying object structures, unified interfaces with optional fields are created.' }
    ],
    sections: [
      {
        heading: 'Type-Safe TypeScript Generation from JSON',
        paragraphs: [
          'TypeScript interfaces help catch runtime errors before code reaches production. Manually typing large API responses or configuration structures is tedious and error-prone.',
          'This tool parses any valid JSON structure and recursively constructs clean, idiomatic TypeScript interfaces that can be copied directly into your codebase.'
        ]
      }
    ],
    related: ['json-formatter', 'json-viewer', 'diff-checker', 'base64-encoder-decoder']
  },
  {
    slug: 'diff-checker',
    category: 'Developer',
    name: 'Diff Checker',
    seoTitle: 'Online Text & Code Diff Checker | Castov',
    metaDescription: 'Compare two text snippets or code files line by line. View additions, deletions, and modifications with instant local diffing.',
    intro: 'Compare two versions of code, configuration files, or prose side by side. Highlights additions, deletions, and modifications line by line without sending any data over the network.',
    cardDescription: 'Compare text or code line by line.',
    howTo: [
      'Paste the original version of your text into the left pane.',
      'Paste the modified version into the right pane.',
      'Examine the highlighted line-by-line diff with color-coded additions and removals.',
      'Copy the diff or share the comparison URL.'
    ],
    faq: [
      { q: 'Is the text sent to any remote server?', a: 'No. The diff algorithm executes entirely inside your browser sandbox.' },
      { q: 'Does this support code as well as plain text?', a: 'Yes, it works identically for code files (JavaScript, Python, JSON, YAML) and plain text documents.' },
      { q: 'How are additions and deletions displayed?', a: 'Additions are highlighted in green, deletions in red, and unchanged lines in muted neutral tones.' },
      { q: 'Can I share the comparison with a teammate?', a: 'Yes, click Share to encode the state into the URL hash without storing anything on a server.' }
    ],
    sections: [
      {
        heading: 'Fast In-Browser Text and Code Comparison',
        paragraphs: [
          'Spotting subtle changes between two versions of an API response, JSON configuration, or code snippet can be difficult with the naked eye.',
          'Our client-side diff checker uses an optimized longest common subsequence algorithm to highlight exact line additions and deletions instantly.'
        ]
      }
    ],
    related: ['json-formatter', 'json-to-ts', 'base64-encoder-decoder', 'uuid-generator'],
    guide: 'mastering-text-diff-algorithms',
  },
  {
    slug: 'json-formatter',
    category: 'Developer',
    name: 'JSON Formatter & Validator',
    seoTitle: 'JSON Formatter & Validator | Format, Minify & Validate Online',
    metaDescription: 'Free online JSON formatter and validator with custom indentation, minification, and key sorting. Format and validate JSON locally in your browser.',
    intro: 'Format, validate, minify, and inspect JSON with syntax error location. Choose 2-space, 4-space, or tab indentation, sort object keys alphabetically, and copy results instantly. Runs 100% in your browser without uploading data.',
    cardDescription: 'Format, validate, minify, and sort JSON keys in your browser.',
    howTo: [
      'Paste or type your raw JSON into the input editor.',
      'Choose your preferred indentation (2 spaces, 4 spaces, or tab) or toggle Sort Keys.',
      'Click Format & Validate to prettify your JSON, or Minify to remove all unnecessary whitespace.',
      'Copy the formatted output to your clipboard with one click.'
    ],
    faq: [
      { q: 'Does this JSON formatter upload my data to a server?', a: 'No. All parsing, validation, formatting, and key sorting happen 100% locally in your browser using standard JavaScript JSON APIs.' },
      { q: 'How does syntax error detection work?', a: 'If your JSON has a syntax mistake (like a missing comma, unescaped quote, or trailing comma), the validator pinpoints the exact line and column number of the error.' },
      { q: 'Can I sort JSON object keys alphabetically?', a: 'Yes. Enabling the Sort Keys option recursively arranges all object keys alphabetically, making diffing and standardizing configurations easy.' },
      { q: 'What indentation options are supported?', a: 'You can choose between 2 spaces (standard web convention), 4 spaces (backend convention), or raw Tab characters.' },
      { q: 'Is there a limit on how large my JSON file can be?', a: 'Because the tool runs entirely in your local browser engine without server upload limits, you can format multi-megabyte JSON payloads with native memory performance.' }
    ],
    sections: [
      {
        heading: 'Why Use a Local-First JSON Formatter?',
        paragraphs: [
          'JSON is the universal data interchange format for modern APIs, microservices, and web configuration files. However, unformatted minified JSON is nearly impossible for developers to read or debug.',
          'Many online formatters transmit your data to remote web servers, creating compliance and privacy risks when working with confidential customer data, internal tokens, or database dumps.',
          'Castov JSON Formatter & Validator executes entirely inside your browser. No network requests are made, ensuring your proprietary payloads remain strictly private.'
        ]
      },
      {
        heading: 'Syntax Validation with Precise Error Pinpointing',
        paragraphs: [
          'A single misplaced comma or unquoted key invalidates an entire JSON document. Our validator catches syntax violations and reports the exact line number, column offset, and token error message.',
          'Use the Minify feature to strip all unnecessary whitespaces and line breaks, reducing payload size for network transmission and API benchmarking.'
        ]
      }
    ],
    related: ['json-to-ts', 'json-viewer', 'diff-checker', 'base64-encoder-decoder']
  },
  {
    slug: 'base64-encoder-decoder',
    category: 'Developer',
    name: 'Base64 Encode / Decode',
    seoTitle: 'Base64 Encoder & Decoder | UTF-8 & URL-Safe Online Tool',
    metaDescription: 'Encode and decode text to and from Base64 with full UTF-8 Unicode support and URL-safe formatting. 100% client-side with zero data uploads.',
    intro: 'Encode plain text to Base64 or decode Base64 strings back to readable UTF-8 text. Supports multi-byte Unicode characters, emojis, and URL-safe formatting according to RFC 4648. All conversions execute locally in your browser.',
    cardDescription: 'Encode and decode Base64 with UTF-8 Unicode and URL-safe support.',
    howTo: [
      'Select either Encode or Decode mode depending on your desired operation.',
      'Paste your text or Base64 string into the input field.',
      'Optionally toggle URL-Safe to use RFC 4648 URL and filename safe characters (- and _).',
      'Click Copy to copy the converted result to your clipboard.'
    ],
    faq: [
      { q: 'Does this tool support emojis and international UTF-8 characters?', a: 'Yes. Unlike basic btoa/atob implementations that throw errors on multi-byte characters, our tool uses TextEncoder and TextDecoder to support full UTF-8 Unicode including emojis and Arabic.' },
      { q: 'What is URL-Safe Base64 (RFC 4648)?', a: 'Standard Base64 uses + and / which have special meanings in URLs and file systems. URL-safe Base64 substitutes + with - and / with _, making the string safe for query parameters and JWT tokens.' },
      { q: 'Is my data transmitted to any external server?', a: 'Never. All encoding and decoding runs 100% client-side in your browser using standard Web APIs.' },
      { q: 'How does padding work in Base64?', a: 'Base64 strings represent data in 6-bit chunks. When the input byte length is not a multiple of 3, = characters are appended as padding. In URL-safe mode, padding characters can be safely trimmed.' },
      { q: 'Can I swap the input and output quickly?', a: 'Yes. Click the Swap button to instantly flip the input and output values and switch between encoding and decoding modes.' }
    ],
    sections: [
      {
        heading: 'Full UTF-8 Unicode and Binary Support',
        paragraphs: [
          'Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format by translating it into a radix-64 representation. It is ubiquitous in data URIs, HTTP Basic Auth, and email MIME attachments.',
          'Legacy browser implementations using window.btoa fail on any character outside Latin-1. Castov Base64 uses the modern TextEncoder interface to ensure every Unicode symbol, emoji, and non-Latin character encodes cleanly.'
        ]
      },
      {
        heading: 'RFC 4648 URL-Safe Mode for Web Tokens and Parameters',
        paragraphs: [
          'Standard Base64 contains plus (+) and slash (/) characters that require percent-encoding when placed inside URLs. URL-Safe Base64 replaces these characters with minus (-) and underscore (_).',
          'This format is essential when working with JSON Web Tokens (JWT), OAuth2 authorization codes, and file storage identifiers.'
        ]
      }
    ],
    related: ['jwt-decoder', 'hash-generator', 'json-formatter', 'uuid-generator']
  },
  {
    slug: 'jwt-decoder',
    category: 'Developer',
    name: 'JWT Decoder',
    seoTitle: 'JWT Decoder | Decode JSON Web Tokens Online',
    metaDescription: 'Decode and inspect JSON Web Tokens (JWT) client-side. View header, payload, expiration timestamps, and claim status with zero server uploads.',
    intro: 'Decode and inspect JSON Web Tokens (JWT) instantly in your browser. Inspect header and payload claims, review human-readable expiration dates, and check token validity status. Decoded 100% locally with zero server requests.',
    cardDescription: 'Decode and inspect JSON Web Tokens (JWT) header and payload locally.',
    howTo: [
      'Paste your encoded JWT (header.payload.signature) into the token input box.',
      'Inspect the decoded Header and Payload JSON structures in the side-by-side viewer.',
      'Review token lifetime claims including iat (Issued At), nbf (Not Before), and exp (Expires At).',
      'Copy the formatted JSON payload or header with the copy button.'
    ],
    faq: [
      { q: 'Is it safe to paste JWT tokens into this decoder?', a: 'Yes. All decoding occurs 100% locally in your browser memory. However, as noted in the banner, never paste production secrets into untrusted environments.' },
      { q: 'Does this tool verify the JWT signature?', a: 'No. This tool decodes and parses the header and payload claims only. It does not verify the cryptographic signature against a public or secret key.' },
      { q: 'What does the token validity status indicator mean?', a: 'It checks the standard exp (Expiration Time) and nbf (Not Before) claims against your current device time to indicate if the token is currently active, expired, or not yet valid.' },
      { q: 'What are standard JWT claims?', a: 'Standard claims defined in RFC 7519 include iss (Issuer), sub (Subject), aud (Audience), exp (Expiration Time), nbf (Not Before), and iat (Issued At).' },
      { q: 'Why is a JWT composed of three parts separated by dots?', a: 'A standard JWT consists of Header.Payload.Signature. The Header specifies the algorithm and token type, the Payload contains the claims, and the Signature validates message integrity.' }
    ],
    sections: [
      {
        heading: 'Client-Side JWT Parsing and Token Inspection',
        paragraphs: [
          'JSON Web Tokens (RFC 7519) are the industry standard for stateless authentication and authorization between modern web applications and microservices.',
          'Debugging authorization headers and token payloads requires viewing the encoded claims without exposing sensitive user tokens to remote third-party servers. Castov decodes tokens purely in browser memory.'
        ]
      },
      {
        heading: 'Automated Timestamp and Lifetime Verification',
        paragraphs: [
          'JWT timestamps like exp, iat, and nbf are stored as raw Unix epoch seconds. Our decoder automatically converts these numeric timestamps into human-readable UTC dates and displays relative validity badges.',
          'This lets you instantly determine whether a token expired 5 minutes ago or remains valid for upcoming requests.'
        ]
      }
    ],
    related: ['base64-encoder-decoder', 'json-formatter', 'uuid-generator', 'hash-generator'],
    guide: 'jwt-security-best-practices',
  },
  {
    slug: 'uuid-generator',
    category: 'Developer',
    name: 'UUID Generator',
    seoTitle: 'UUID Generator | Online v4 & v7 Bulk UUID Generator',
    metaDescription: 'Generate cryptographically secure UUID v4 (random) and UUID v7 (timestamp-ordered) identifiers. Bulk generation up to 100 with uppercase and hyphen options.',
    intro: 'Generate RFC-compliant UUID v4 (cryptographically random) and modern UUID v7 (time-ordered) identifiers directly in your browser. Generate up to 100 UUIDs at once with uppercase and hyphen-removal options. Powered by Web Crypto.',
    cardDescription: 'Generate cryptographically secure UUID v4 and v7 identifiers in bulk.',
    howTo: [
      'Choose between UUID v4 (random) and UUID v7 (timestamp-ordered, RFC 9562).',
      'Select the desired quantity from 1 to 100 using the input or quick preset buttons.',
      'Toggle uppercase format or remove hyphens according to your database requirements.',
      'Click Copy All to copy the entire batch or copy individual IDs with a single click.'
    ],
    faq: [
      { q: 'What is the difference between UUID v4 and UUID v7?', a: 'UUID v4 is entirely random (122 random bits). UUID v7 combines a 48-bit Unix millisecond timestamp with random bits, making it sortable by time and significantly improving database B-tree indexing performance.' },
      { q: 'Are the generated UUIDs cryptographically secure?', a: 'Yes. Both versions use the browser Web Crypto API (crypto.getRandomValues and crypto.randomUUID), providing cryptographically secure pseudo-random entropy.' },
      { q: 'What is the format of a standard UUID?', a: 'A standard UUID is a 128-bit label formatted as 32 hexadecimal digits separated into five hyphen-delimited groups: 8-4-4-4-12 (total 36 characters).' },
      { q: 'Can I generate UUIDs without hyphens for compact storage?', a: 'Yes. Enable the No Hyphens checkbox to generate 32-character continuous hex strings ideal for MongoDB ObjectId replacements or compact database columns.' },
      { q: 'Can I generate up to 100 UUIDs in a single batch?', a: 'Yes. You can select presets for 1, 5, 10, 25, 50, or 100 UUIDs, and copy the whole list separated by newlines.' }
    ],
    sections: [
      {
        heading: 'Cryptographically Secure Random and Time-Ordered UUIDs',
        paragraphs: [
          'Universally Unique Identifiers (UUIDs) are standard 128-bit numbers used to identify information in distributed computing systems without central coordination.',
          'UUID v4 relies on 122 bits of cryptographic randomness, providing practically zero collision probability across trillions of generated IDs.'
        ]
      },
      {
        heading: 'Why UUID v7 is the Future for Databases',
        paragraphs: [
          'Standard UUID v4 causes index fragmentation and performance degradation in relational databases (PostgreSQL, MySQL) and search engines due to random insertion locations.',
          'RFC 9562 introduced UUID v7, which encodes a 48-bit Unix epoch millisecond timestamp at the beginning of the identifier. This enables chronological sorting, faster queries, and compact sequential storage.'
        ]
      }
    ],
    related: ['hash-generator', 'jwt-decoder', 'json-formatter', 'base64-encoder-decoder']
  },
  {
    slug: 'hash-generator',
    category: 'Developer',
    name: 'Hash Generator',
    seoTitle: 'Hash Generator | SHA-256, SHA-512, MD5 Online Checksum Tool',
    metaDescription: 'Calculate SHA-256, SHA-512, SHA-384, SHA-1, and MD5 hashes for text and files. 100% client-side cryptographic hashing via Web Crypto.',
    intro: 'Calculate cryptographic hashes and checksums for any text or file locally in your browser. Generates SHA-256, SHA-512, SHA-384, SHA-1, and MD5 digests using the native Web Crypto API. No files or strings are ever uploaded to any server.',
    cardDescription: 'Generate SHA-256, SHA-512, SHA-1, and MD5 hashes for text and files.',
    howTo: [
      'Select Text Input to hash strings, or File Upload to compute checksums for local files.',
      'Enter your text or select a file from your computer.',
      'Toggle between lowercase and uppercase hexadecimal output as required.',
      'Click Copy next to any hash algorithm (SHA-256, SHA-512, MD5) to copy the digest.'
    ],
    faq: [
      { q: 'Is it safe to compute checksums of confidential files here?', a: 'Yes. Files and text strings never leave your machine. The Web Crypto API computes all digests locally in browser memory.' },
      { q: 'Why are MD5 and SHA-1 marked as insecure for passwords?', a: 'Both MD5 and SHA-1 have known collision vulnerabilities where different inputs produce the same hash. For passwords, you should always use salted adaptive algorithms like Argon2, bcrypt, or scrypt.' },
      { q: 'Which hash algorithm is recommended for general data integrity?', a: 'SHA-256 (part of the SHA-2 family) is the industry standard for integrity verification, digital signatures, and blockchain architectures.' },
      { q: 'Can I hash binary files like images, archives, or binaries?', a: 'Yes. Switch to the File Upload tab and choose any file from your disk. The file is read via FileReader into an ArrayBuffer and hashed instantly.' },
      { q: 'Can I copy the hashes in uppercase format?', a: 'Yes. Toggle the Uppercase Hex checkbox to switch all computed hashes between lowercase and uppercase representations.' }
    ],
    sections: [
      {
        heading: 'Browser-Native Cryptographic Hashing with Web Crypto',
        paragraphs: [
          'Cryptographic hash functions transform arbitrary data into a fixed-size string of bytes. They are one-way functions designed so that even a single bit change in the input produces an entirely different hash.',
          'Castov uses the native window.crypto.subtle interface, leveraging hardware-accelerated CPU instructions for lightning-fast hash computation without external server dependencies.'
        ]
      },
      {
        heading: 'File Checksum Verification without Uploading',
        paragraphs: [
          'Verifying download integrity (such as ISO images, software binaries, or database dumps) usually requires command-line utilities like shasum or certutil.',
          'With this tool, you can drop any file into your browser to verify its SHA-256 or MD5 checksum against the provider manifest without uploading a single byte to the web.'
        ]
      }
    ],
    related: ['uuid-generator', 'base64-encoder-decoder', 'jwt-decoder', 'json-formatter']
  },


  {
    slug: "fetch-mock-generator",
    category: "Labs",
    name: "Service Worker API Mocker",
    seoTitle: "Local API Mock Server Generator | Castov",
    metaDescription: "Generate a zero-server fetch interceptor script to mock API endpoints directly in your browser.",
    intro: "Stop writing custom mock backends. Define your API JSON responses here and generate a secure injection script that mocks fetch calls instantly in your browser.",
    cardDescription: "Generate local fetch interceptor scripts to mock API endpoints.",
    faq: [{q:"Do I need a Node.js server?", a:"No, this runs a monkey-patch on window.fetch directly in your browser."}],
    related: [],
    sections: [{heading: "Local API Mocking", paragraphs: ["Intercept fetch calls without a backend."]}],
    howTo: ["Define your routes", "Copy the script", "Paste into your browser console or layout file."]
  },
  // REVOLUTIONARY SCI-FI TOOLS
  {
    slug: "p2p-ghost-tunnel", isPro: true,
    category: "Labs",
    name: "P2P Ghost Tunnel",
    seoTitle: "WebRTC P2P Ghost Tunnel | Serverless Localhost Sharing",
    metaDescription: "Share your localhost directly to another browser using Peer-to-Peer WebRTC. Zero servers, zero latency, impossible to intercept.",
    intro: "Bypass ngrok entirely. Generate a secure WebRTC tunnel to stream your localhost directly to a client's browser without any intermediary servers.",
    cardDescription: "Share localhost via direct P2P WebRTC connection.",
    faq: [
      { q: "Is the data routed through Castov servers?", a: "No. All data flows directly between peers using WebRTC data channels. We do not use any TURN/STUN servers that intercept data." },
      { q: "What happens if both devices are behind strict NATs?", a: "Direct connection might fail without a TURN server. Currently, this tool requires at least one peer to have permissive NAT traversal or use a local network." }
    ], related: [], sections: [
      { heading: "What is P2P Ghost Tunnel?", paragraphs: ["P2P Ghost Tunnel establishes a direct, encrypted WebRTC connection between your browser and another device, entirely bypassing centralized servers. It's designed for transferring logs, sensitive payloads, or securely chatting without leaving a trace.", "Because the signaling relies on a minimal exchange of ICE candidates (which can be done manually or via a temporary signaling channel), the resulting connection is strictly peer-to-peer."] }
    ], howTo: [
      "Generate an Offer from Device A and copy the SDP string.",
      "Paste the Offer into Device B to generate an Answer.",
      "Copy the Answer back to Device A to establish the connection.",
      "Once connected, start sending encrypted data or files."
    ],
  },
  {
    slug: "steganography-env-vault", isPro: true,
    category: "Labs",
    name: "Steganography Env Vault",
    seoTitle: "Steganographic Env Vault | Hide Secrets in Images",
    metaDescription: "Encrypt and hide your production .env variables inside the pixels of a PNG logo. 100% local, impossible for hackers to detect.",
    intro: "Ditch text-based secret managers. Encrypt your keys and embed the ciphertext mathematically into your company's logo pixels.",
    cardDescription: "Hide encrypted .env files inside PNG image pixels.",
    faq: [
      { q: "Does the image look different after hiding data?", a: "No. The changes are made to the least significant bits of the image's color channels, which is completely imperceptible to the human eye." },
      { q: "Can I use JPEG images?", a: "No. JPEG uses lossy compression, which will destroy the hidden data. Always use lossless formats like PNG." }
    ], related: [], sections: [
      { heading: "Steganography in Environment Variables", paragraphs: ["Steganography Env Vault allows you to take sensitive .env variables (like database URIs, API keys, and secret tokens) and hide them inside the least significant bits of an ordinary PNG image.", "This technique provides 'plausible deniability' and extreme security. An attacker who breaches your repository or local drive will only see a standard image file, completely unaware that it contains encrypted configuration data."] }
    ], howTo: [
      "Select a carrier image (PNG format recommended) from your computer.",
      "Paste your raw .env file contents into the input field.",
      "Set a strong master password (this will be used to encrypt the data before hiding it).",
      "Click 'Encode and Download' to get your new, secret-bearing image.",
      "To decode, upload the modified image and provide the same password."
    ],
  },
  {
    slug: "3d-json-galaxy",
    category: "Labs",
    name: "Holographic JSON Explorer",
    seoTitle: "3D JSON Galaxy | Holographic Architecture Explorer",
    metaDescription: "Visualize massive 50MB+ JSON structures as an interactive 3D universe using WebGL.",
    intro: "Stop scrolling through thousands of lines of JSON. Fly through your data architecture in 3D to spot anomalies and schema structures visually.",
    cardDescription: "Explore massive JSON architectures in a 3D WebGL universe.",
    faq: [
      { q: "Is my JSON uploaded to generate the 3D model?", a: "No. The parsing and 3D rendering are handled entirely by your GPU and browser using WebGL." },
      { q: "What is the performance limit?", a: "It depends on your graphics card. Modern GPUs can handle tens of thousands of nodes smoothly." }
    ], related: [], sections: [
      { heading: "Navigating JSON in 3D", paragraphs: ["The Holographic JSON Explorer parses massive JSON datasets and visualizes them using Three.js and WebGL. Instead of endless scrolling, you can literally fly through your data.", "Objects are represented as planets or nodes, and arrays form orbital rings or constellations. This spatial representation helps engineers quickly identify deep nesting, circular references, and structural anomalies."] }
    ], howTo: [
      "Upload or paste a large JSON payload into the editor.",
      "Click 'Launch Galaxy' to render the 3D visualization.",
      "Use your mouse to rotate (click and drag) and zoom (scroll wheel).",
      "Click on specific nodes to see their corresponding JSON keys and values in the side panel."
    ],
  },
  {
    slug: "regex-genetic-evolution",
    category: "Labs",
    name: "Genetic Regex Auto-Healer",
    seoTitle: "Genetic Regex Auto-Healer | AI Mutating Regex Solver",
    metaDescription: "Don't write Regex. Provide passing and failing strings, and watch our local constraint-solver mutate expressions until they match perfectly.",
    intro: "Enter what you want to match, and what you want to reject. Our browser-based algorithm evolves the perfect Regular Expression in real-time.",
    cardDescription: "Evolve perfect Regex using local genetic algorithms.",
    faq: [
      { q: "Is this guaranteed to find the best regex?", a: "Not necessarily the most human-readable one, but it will find a mathematically valid regex that satisfies your strict constraints." }
    ], related: [], sections: [
      { heading: "Genetic Algorithms for Regex", paragraphs: ["Writing the perfect Regular Expression often involves tedious trial and error. The Genetic Regex Auto-Healer automates this by applying evolutionary algorithms to 'breed' the perfect regex.", "You provide positive test cases (strings that must match) and negative test cases (strings that must not match). The engine randomly mutates an initial pattern, scores the offspring based on accuracy, and evolves them over generations until it finds a pattern that passes all tests."] }
    ], howTo: [
      "Enter a list of strings that the regex MUST match (Target Matches).",
      "Enter a list of strings that the regex MUST NOT match (Anti-Matches).",
      "Provide an optional starting regex (or let the engine start from scratch).",
      "Click 'Evolve' and watch the engine iterate through generations to find the perfect pattern."
    ],
  },
  {
    slug: "api-time-machine",
    category: "Labs",
    name: "Chrono-Debug API Replay",
    seoTitle: "Chrono-Debug API Replay | Localhost Time Machine",
    metaDescription: "Upload a HAR file and use a timeline scrubber to locally replay past API requests directly to your frontend app without a database.",
    intro: "Recreate race conditions instantly. Scrub through a timeline to replay exact historical API responses and watch your UI react as if it's in the past.",
    cardDescription: "Replay past API states using a visual timeline scrubber.",
    faq: [
      { q: "Do I need to install a desktop app for this?", a: "No, this uses Service Workers to intercept fetch requests directly within your browser session." }
    ], related: [], sections: [
      { heading: "Chrono-Debug API Replay", paragraphs: ["Testing API idempotency and timing issues is notoriously difficult. The Chrono-Debug API Replay acts as a local proxy that intercepts your HTTP requests and allows you to artificially alter their timing, latency, and order.", "By simulating network conditions from 'the past' or delaying requests into 'the future', you can uncover race conditions and state-mutation bugs in your frontend applications."] }
    ], howTo: [
      "Configure your frontend to route API calls through the local proxy endpoint provided.",
      "Record a sequence of API calls.",
      "Use the timeline interface to drag requests, altering their latency and arrival order.",
      "Replay the sequence to observe how your application handles the mutated timing."
    ],
  },
  {
    slug: "ast-conflict-telepathy",
    category: "Labs",
    name: "AST Conflict Telepathy",
    seoTitle: "AST Git Conflict Telepathy | Logic-Based Merger",
    metaDescription: "Resolve Git conflicts by parsing Abstract Syntax Trees instead of text diffs to understand developer intent automatically.",
    intro: "Stop staring at text diffs. Our tool parses the AST of both branches to semantically merge logic, preventing broken syntax automatically.",
    cardDescription: "Semantically merge Git conflicts using AST logic parsing.",
    faq: [
      { q: "What languages are supported?", a: "Currently, AST parsing is supported for JavaScript, TypeScript, and JSON." }
    ], related: [], sections: [
      { heading: "AST Conflict Telepathy", paragraphs: ["Git merge conflicts in complex JavaScript/TypeScript files are a nightmare. Standard text-based merging doesn't understand code syntax.", "AST Conflict Telepathy parses the conflicting files into Abstract Syntax Trees (AST). It then compares the actual logical intent of the code (e.g., variable renames, moved functions) and resolves conflicts syntactically rather than line-by-line."] }
    ], howTo: [
      "Paste 'Branch A' code into the left editor.",
      "Paste 'Branch B' code into the right editor.",
      "The tool generates a visual AST diff.",
      "Select logical nodes to keep or discard, and export the perfectly merged file."
    ],
  },
  {
    slug: "nexus-grid",
    category: "Labs",
    name: "NexusGrid",
    seoTitle: "Castov NexusGrid | Decentralized WebGPU Supercomputer",
    metaDescription: "Pool your idle browser GPU power to train AI models locally using WebGPU and WebRTC P2P networks.",
    intro: "A distributed browser supercomputer. Compute tensor operations and matrix multiplications directly on client GPUs.",
    cardDescription: "Decentralized WebGPU Supercomputer running local AI workloads.",
    faq: [
      { q: "Is any data sent to external servers?", a: "No. Tensor computation occurs entirely inside your browser using the local WebGPU API." },
    ],
    related: [],
    sections: [
      { heading: "WebGPU Browser Compute", paragraphs: ["NexusGrid harnesses browser WebGPU compute shaders to run matrix operations locally at native hardware speeds."] }
    ],
    howTo: [
      "Open the NexusGrid dashboard.",
      "Allocate GPU memory for matrix tensors.",
      "Execute compute kernels directly in your browser."
    ],
    isPro: true,
  },
  {
    slug: "sonic-gap",
    category: "Labs",
    name: "Sonic-Gap Bridge",
    seoTitle: "Sonic-Gap Bridge | Ultrasonic Acoustic Data Transfer",
    metaDescription: "Air-Gapped Ultrasonic Acoustic Data Transfer Protocol.",
    intro: "Transfer data between air-gapped devices using inaudible high-frequency acoustic sound waves and your device microphone.",
    cardDescription: "Air-gapped ultrasonic acoustic data transfer protocol.",
    faq: [
      { q: "Does this require internet access?", a: "No, transmission happens strictly through acoustic audio waves between the speaker of one device and microphone of another." }
    ],
    related: [],
    sections: [
      { heading: "Acoustic Air-Gap Transfer", paragraphs: ["Sonic-Gap modulates binary data into near-ultrasonic sound frequencies (18kHz-19kHz) for physical air-gapped data transfer."] }
    ],
    howTo: [
      "Set device A to Transmit mode.",
      "Set device B to Receive mode with microphone access enabled.",
      "Send payload and receive real-time decoded binary data."
    ],
    isPro: true,
  },
  {
    slug: "quantum",
    category: "Labs",
    name: "Quantum Simulator",
    seoTitle: "Quantum Web Simulator | Castov",
    metaDescription: "Browser-Native Quantum Circuit execution via Matrix Tensors.",
    intro: "Simulate multi-qubit quantum states and visualize Bloch spheres entirely in WebGL and 3D.",
    cardDescription: "Browser-native quantum circuit execution via matrix tensors.",
    faq: [
      { q: "How are quantum states computed?", a: "States are represented as complex state vectors and updated using linear algebraic matrix transformations in your browser." }
    ],
    related: [],
    sections: [
      { heading: "Interactive Quantum Simulation", paragraphs: ["Visualize quantum superposition and phase angles in real-time with interactive 3D Bloch spheres."] }
    ],
    howTo: [
      "Select quantum gate operations.",
      "Observe state vector probability shifts on the Bloch sphere.",
      "Measure qubit collapse states."
    ],
  },
  {
    slug: "json-viewer",
    category: "Developer",
    name: "Gigantic JSON Viewer",
    seoTitle: "JSON Viewer & Formatter | Castov",
    metaDescription: "Parse, view, and format gigantic JSON files safely and instantly in your browser without uploading data.",
    intro: "Open huge JSON files locally in your browser. Handles massive payloads using local-first rendering.",
    cardDescription: "Parse and view gigantic JSON files locally.",
    faq: [
      {
        q: "Is my JSON data uploaded anywhere?",
        a: "No. Castov's JSON Viewer operates 100% locally in your browser. Files are processed entirely client-side without ever leaving your device, making it safe for production configurations, secrets, and sensitive customer payloads."
      },
      {
        q: "What is the maximum file size supported?",
        a: "Because we process everything locally and use efficient DOM rendering techniques, you can safely load JSON files up to 50MB. However, very deeply nested massive files may briefly pause your browser while parsing."
      },
      {
        q: "What is the 3D Galaxy Mode?",
        a: "The 3D Galaxy Mode is an experimental WebGPU/WebGL feature that maps your nested JSON structure into an interactive 3D universe. It helps visualize deep hierarchies where objects act as planets and arrays act as orbital systems."
      }
    ],
    related: ["ast-conflict-telepathy", "env-vault"],
    sections: [
      {
        heading: "What is a JSON file?",
        paragraphs: [
          "JSON (JavaScript Object Notation) is a lightweight data-interchange format. It is easy for humans to read and write and easy for machines to parse and generate. JSON is a text format that is completely language independent but uses conventions that are familiar to programmers of the C-family of languages.",
          "JSON is built on two structures: A collection of name/value pairs (realized as an object, record, struct, dictionary, hash table, keyed list, or associative array) and an ordered list of values (realized as an array, vector, list, or sequence)."
        ]
      },
      {
        heading: "How is Castov's JSON Viewer different?",
        paragraphs: [
          "Most online JSON formatters send your data to a backend server to process it. This is a massive security risk if you are dealing with API responses, database dumps, or environment variables.",
          "Our viewer is a strictly Zero-Server application. Whether you paste text or drop a massive 50MB file, the parsing and rendering happen entirely in your CPU and GPU using modern web APIs."
        ]
      }
    ],
    howTo: [
      "Select a JSON file from your computer using the file input.",
      "Alternatively, Drag & Drop a .json file directly into the designated area.",
      "You can also click 'Paste from Clipboard' if you have raw JSON text copied.",
      "The viewer will instantly parse and colorize your data.",
      "Click on nested objects or arrays to expand and collapse them.",
      "Toggle the '3D Galaxy Mode' to visualize complex JSON trees as a WebGL interactive universe."
    ],
  },
  {
    slug: "unix-timestamp-converter",
    category: "Timestamp",
    name: "Unix Timestamp Converter",
    seoTitle: "Unix Timestamp Converter – Convert Unix Time to Date | Castov",
    metaDescription:
      "Convert a Unix timestamp in seconds or milliseconds to a readable date in UTC, local time and ISO 8601. Free, fast and runs entirely in your browser.",
    intro:
      "Convert Unix timestamps into readable dates. Paste a value in seconds or milliseconds and see it in UTC, your local time and ISO 8601.",
    cardDescription: "Turn a Unix timestamp into UTC, local time and ISO 8601.",
    sections: [
      {
        heading: "What is a Unix timestamp?",
        paragraphs: [
          "A Unix timestamp is the number of seconds that have passed since 00:00:00 UTC on 1 January 1970, a moment known as the Unix epoch. Because it is one plain number, it does not depend on time zones, calendars or daylight saving time, which makes it a reliable way for programs, databases and APIs to store and compare moments in time.",
          "Leap seconds are not counted, so every day is exactly 86,400 seconds long in Unix time. Dates before 1970 are negative numbers: -86400 is 31 December 1969.",
        ],
      },
      {
        heading: "How does Unix time work?",
        paragraphs: [
          "Most systems store the timestamp in seconds, which is 10 digits today, like 1790000000. JavaScript, Java and many web APIs use milliseconds instead, which is 13 digits, like 1790000000000. The Auto setting treats values with 12 or more digits as milliseconds and everything else as seconds. Switch to Seconds or Milliseconds when you know the unit.",
        ],
      },
    ],
    howTo: [
      "Paste or type a Unix timestamp into the field. Negative numbers and decimals such as 1790000000.5 work too.",
      "Leave Unit on Auto, or choose Seconds or Milliseconds.",
      "Select Convert. The result shows UTC, your local time and ISO 8601.",
      "Use the Copy button next to a value, or select Current Timestamp to convert the present moment.",
    ],
    faq: [
      {
        q: "What is the Unix timestamp for right now?",
        a: "Select Current Timestamp to convert it here, or open the live Current Unix Timestamp page. The value increases by one every second.",
      },
      {
        q: "How do I know if a timestamp is in seconds or milliseconds?",
        a: "Count the digits. Current timestamps have 10 digits in seconds and 13 digits in milliseconds. The Auto setting applies the same rule.",
      },
      {
        q: "Does a Unix timestamp include a time zone?",
        a: "No. A Unix timestamp refers to the same instant everywhere. The time zone only matters when you display it as a calendar date and clock time, which is why the tool shows both UTC and your local time.",
      },
      {
        q: "Which dates can the converter handle?",
        a: "Dates from the year 1 to the year 9999, in seconds or milliseconds. Values outside that range show an error message.",
      },
    ],
    related: ["epoch-converter", "timestamp-to-date", "date-to-timestamp", "milliseconds-to-date", "unix-to-iso-8601"],
    guide: "what-is-unix-time",
  },
  {
    slug: "epoch-converter",
    category: "Timestamp",
    name: "Epoch Converter",
    seoTitle: "Epoch Converter – Convert Epoch Time to Date | Castov",
    metaDescription:
      "Free epoch converter: turn epoch seconds or milliseconds into UTC, local time and ISO 8601 and see both epoch units side by side. No sign-up needed.",
    intro:
      "Enter epoch time in seconds or milliseconds and see the value in both units, plus UTC, local time and ISO 8601.",
    cardDescription: "See epoch seconds and milliseconds side by side, with UTC and local time.",
    sections: [
      {
        heading: "What is epoch time?",
        paragraphs: [
          "Epoch time, also called Unix time or POSIX time, counts the time elapsed since the epoch: 1 January 1970 at 00:00:00 UTC. The word epoch simply means the reference point a timeline starts from. Other systems use different epochs, for example Windows FILETIME starts in 1601 and Apple's NSDate reference date is 1 January 2001, so always check which epoch an API means.",
        ],
      },
      {
        heading: "Epoch seconds and epoch milliseconds",
        paragraphs: [
          "Enter either unit and this page shows both side by side. That helps when a database column stores seconds but your JavaScript code expects milliseconds. Multiply by 1,000 to go from seconds to milliseconds, and divide by 1,000 to go the other way.",
        ],
      },
    ],
    howTo: [
      "Enter an epoch value, or select Current Time to fill in the present moment.",
      "Keep Unit on Auto, or pick Seconds or Milliseconds.",
      "Select Convert to see Epoch Seconds, Epoch Milliseconds, UTC, local time and ISO 8601.",
      "Copy the value you need. Clear resets the form.",
    ],
    faq: [
      {
        q: "Is epoch time the same as Unix time?",
        a: "In everyday use, yes. Unix time, POSIX time and epoch time all mean the time elapsed since 1970-01-01T00:00:00Z. The practical difference is whether a system counts in seconds or milliseconds.",
      },
      {
        q: "What are the epochs of other systems?",
        a: "Windows FILETIME counts 100-nanosecond intervals from 1 January 1601, Apple's NSDate uses seconds from 1 January 2001, and GPS time starts on 6 January 1980. This tool only converts Unix epoch values.",
      },
      {
        q: "Why does my epoch time convert to a date in January 1970?",
        a: "That happens when a value in seconds is read as milliseconds. For example 1790000000 milliseconds is only about 20 days after the epoch. Use Auto, or choose Seconds.",
      },
      {
        q: "Can epoch time be negative?",
        a: "Yes. Negative values are moments before 1 January 1970. For example -1 is 23:59:59 UTC on 31 December 1969.",
      },
    ],
    related: ["unix-timestamp-converter", "current-unix-timestamp", "milliseconds-to-date", "timestamp-difference"],
    guide: "what-is-unix-time",
  },
  {
    slug: "timestamp-to-date",
    category: "Timestamp",
    name: "Timestamp to Date",
    seoTitle: "Timestamp to Date Converter – Convert Unix Timestamp | Castov",
    metaDescription:
      "Convert a Unix timestamp to a human-readable date with weekday, day of year and ISO week. Supports seconds and milliseconds, UTC and local time.",
    intro:
      "Turn a Unix timestamp into a date you can read, with the weekday, day of the year and ISO week number.",
    cardDescription: "Readable date, weekday, day of year and ISO week from a timestamp.",
    sections: [
      {
        heading: "Convert a Unix timestamp to a readable date",
        paragraphs: [
          "Databases, logs and API responses often show moments as a bare number such as 1709164800. This page turns that number into a date you can read: the full weekday and date in UTC and in your local time zone, plus the ISO 8601 form you can use in code.",
        ],
      },
      {
        heading: "Calendar details included",
        paragraphs: [
          "Besides the date itself, the tool shows the day of the week, the day of the year (1 to 366), the ISO 8601 week number and whether the year is a leap year. These details are calculated from the UTC date.",
        ],
      },
    ],
    howTo: [
      "Enter the Unix timestamp you want to read.",
      "Leave Unit on Auto, or choose Seconds or Milliseconds.",
      "Select Convert to date.",
      "Read the date in UTC and local time, then check the calendar details below it.",
    ],
    faq: [
      {
        q: "How do I convert a Unix timestamp to a date in JavaScript?",
        a: "Use new Date(timestampInSeconds * 1000). Multiply by 1,000 because the Date constructor expects milliseconds. Call toISOString() on the result for a UTC string.",
      },
      {
        q: "How do I convert a timestamp to a date in Python?",
        a: "datetime.fromtimestamp(ts, tz=timezone.utc) returns a timezone-aware datetime in UTC. Divide by 1,000 first if the value is in milliseconds.",
      },
      {
        q: "Why do UTC and local time show different times?",
        a: "UTC is the global reference. Local time is UTC plus your time zone's offset, including daylight saving time when it applies.",
      },
      {
        q: "What is an ISO week number?",
        a: "ISO 8601 numbers weeks starting on Monday, and week 1 is the week that contains the year's first Thursday. Because of this, days in early January can belong to week 52 or 53 of the previous year.",
      },
    ],
    related: ["unix-timestamp-converter", "milliseconds-to-date", "date-to-timestamp", "unix-to-iso-8601", "timezone-converter"],
    guide: "seconds-vs-milliseconds-timestamps",
  },
  {
    slug: "date-to-timestamp",
    category: "Timestamp",
    name: "Date to Timestamp",
    seoTitle: "Date to Unix Timestamp Converter | Castov",
    metaDescription:
      "Convert a date and time in any time zone to a Unix timestamp in seconds and milliseconds, plus ISO 8601. Daylight saving time is handled correctly.",
    intro:
      "Pick a date, a time and a time zone to get the Unix timestamp in seconds and milliseconds, plus the ISO 8601 string.",
    cardDescription: "Convert a date, time and time zone into a Unix timestamp.",
    sections: [
      {
        heading: "Convert a date and time to a Unix timestamp",
        paragraphs: [
          "Choose a calendar date, a time and a time zone, and the tool returns the matching Unix timestamp in seconds and milliseconds together with the ISO 8601 string. The time zone matters: 12:00 in Tokyo and 12:00 in New York are different moments, so they have different timestamps.",
        ],
      },
      {
        heading: "Daylight saving time",
        paragraphs: [
          "Twice a year, clocks in many regions skip an hour or repeat one. A time inside the skipped hour, such as 02:30 on the spring-forward date in New York, never happens, so the tool tells you instead of guessing. A time inside the repeated hour happens twice; the tool uses the first occurrence and says so.",
        ],
      },
    ],
    howTo: [
      "Choose the date. Use the date picker or type it as YYYY-MM-DD.",
      "Enter the time. Seconds are optional.",
      "Choose the time zone the date and time are written in: local time, UTC or any IANA zone.",
      "Select Convert to timestamp, then copy the seconds, milliseconds or ISO 8601 value.",
    ],
    faq: [
      {
        q: "Which time zone should I choose?",
        a: "Choose the zone the date and time were written in. UTC is the safest choice for logs and servers. Local time is the right choice for something you noted from your own clock.",
      },
      {
        q: "How do I get the Unix timestamp of a date in JavaScript?",
        a: "Use Math.floor(new Date('2026-09-20T12:30:00Z').getTime() / 1000). The trailing Z marks the string as UTC. Without it, JavaScript reads a date-time string in the machine's local time zone.",
      },
      {
        q: "Does the timestamp change with daylight saving time?",
        a: "No. A timestamp identifies one instant, so it never changes. Only the local clock reading of that instant changes when daylight saving time starts or ends.",
      },
      {
        q: "Why is my date rejected?",
        a: "The date must exist on the calendar (there is no 30 February, and 29 February only exists in leap years) and fall between the years 1 and 9999. A time that falls in a daylight saving gap is also rejected.",
      },
    ],
    related: ["timestamp-to-date", "iso-8601-to-unix", "timezone-converter", "unix-timestamp-converter", "current-unix-timestamp"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "current-unix-timestamp",
    category: "Timestamp",
    name: "Current Unix Timestamp",
    seoTitle: "Current Unix Timestamp – Live Epoch Time Now | Castov",
    metaDescription:
      "See the current Unix timestamp live in seconds and milliseconds, with UTC and local time. Copy the value with one click and pause the clock when needed.",
    intro:
      "The current Unix timestamp, updated every second. Copy the seconds or milliseconds value, or pause the clock to compare.",
    cardDescription: "Live Unix time in seconds and milliseconds. Copy, pause or refresh.",
    sections: [
      {
        heading: "The current Unix timestamp",
        paragraphs: [
          "The clock above shows the number of seconds and milliseconds that have passed since 1 January 1970 at 00:00:00 UTC. It reads your device's clock and refreshes every second, so if your device time is off, this value is off by the same amount.",
        ],
      },
      {
        heading: "When it is useful",
        paragraphs: [
          "Use the current timestamp to set expiry times, create test data, compare log entries or check whether a server's clock is in sync with yours. Because the milliseconds value is the same number JavaScript's Date.now() returns, it is also a quick way to sanity-check code.",
        ],
      },
    ],
    howTo: [
      "Watch the values update once per second.",
      "Select Copy Seconds or Copy Milliseconds to copy the value on screen.",
      "Select Pause to freeze the clock while you compare or paste, and Resume to continue.",
      "Select Refresh to read your device clock immediately.",
    ],
    faq: [
      {
        q: "How often does the timestamp update?",
        a: "Once per second, aligned with the start of each second on your device's clock.",
      },
      {
        q: "Does this value come from a server?",
        a: "No. It is calculated in your browser from your device's clock. Nothing is requested from a server, so it keeps working on a slow connection.",
      },
      {
        q: "Why does my server show a different timestamp?",
        a: "Clocks drift. Servers normally synchronise with NTP, while a phone or computer with automatic time turned off can be seconds or minutes out. Compare both and fix the clock that is out of sync.",
      },
      {
        q: "How many digits does a Unix timestamp have?",
        a: "Today a timestamp has 10 digits in seconds and 13 digits in milliseconds. Seconds reach 11 digits in November 2286.",
      },
    ],
    related: ["unix-timestamp-converter", "epoch-converter", "milliseconds-to-date", "timestamp-difference"],
    guide: "what-is-unix-time",
  },
  {
    slug: "milliseconds-to-date",
    category: "Timestamp",
    name: "Milliseconds to Date",
    seoTitle: "Milliseconds to Date Converter – Unix Milliseconds | Castov",
    metaDescription:
      "Convert Unix milliseconds, like values from JavaScript Date.now(), into a readable date with milliseconds in UTC, local time and ISO 8601.",
    intro:
      "Enter a Unix timestamp in milliseconds and get a readable date that keeps the millisecond fraction.",
    cardDescription: "Convert Unix milliseconds, such as Date.now() values, to a date.",
    sections: [
      {
        heading: "Milliseconds since the epoch",
        paragraphs: [
          "Many platforms count in milliseconds rather than seconds: JavaScript's Date.now(), Java's System.currentTimeMillis(), and many JSON APIs. A millisecond timestamp has 13 digits today, for example 1790000000123, and the last three digits are the fraction of a second.",
        ],
      },
      {
        heading: "Why milliseconds matter",
        paragraphs: [
          "Milliseconds let you order events that happen within the same second and measure latency. This page keeps the millisecond fraction in every result, so 1790000000123 shows .123 instead of rounding it away.",
        ],
      },
    ],
    howTo: [
      "Enter the timestamp in milliseconds.",
      "Select Convert.",
      "Read the date in UTC, your local time, ISO 8601 and a long readable format.",
      "Copy the value you need.",
    ],
    faq: [
      {
        q: "How do I convert milliseconds to a date in JavaScript?",
        a: "The Date constructor accepts milliseconds directly. For example new Date(1790000000123).toISOString() returns a UTC string that includes the milliseconds.",
      },
      {
        q: "What if my number has 10 digits?",
        a: "Ten digits means the value is in seconds. Use the Unix Timestamp Converter, which detects the unit, or multiply the number by 1,000 first.",
      },
      {
        q: "Can I enter microseconds or nanoseconds?",
        a: "Not directly. Divide microseconds by 1,000 or nanoseconds by 1,000,000 to get milliseconds first.",
      },
      {
        q: "Are the milliseconds rounded?",
        a: "Whole milliseconds are shown exactly. A fraction of a millisecond, such as 1790000000123.6, is rounded to the nearest whole millisecond.",
      },
    ],
    related: ["unix-timestamp-converter", "timestamp-to-date", "unix-to-iso-8601", "current-unix-timestamp"],
    guide: "seconds-vs-milliseconds-timestamps",
  },
  {
    slug: "iso-8601-to-unix",
    category: "Developer",
    name: "ISO 8601 to Unix",
    seoTitle: "ISO 8601 to Unix Timestamp Converter | Castov",
    metaDescription:
      "Convert an ISO 8601 date and time, such as 2026-09-20T12:30:00Z, to a Unix timestamp in seconds and milliseconds. Understands Z and UTC offsets.",
    intro:
      "Paste an ISO 8601 date and time, such as 2026-09-20T12:30:00Z, and get the Unix timestamp in seconds and milliseconds.",
    cardDescription: "Turn an ISO 8601 date-time string into a Unix timestamp.",
    sections: [
      {
        heading: "What is ISO 8601?",
        paragraphs: [
          "ISO 8601 is the international standard for writing dates and times in a form that sorts correctly and cannot be misread as month/day or day/month. A full example is 2026-09-20T12:30:00Z: year, month, day, the letter T, hours, minutes and seconds, and a time zone designator.",
        ],
      },
      {
        heading: "Time zone designators",
        paragraphs: [
          "The letter Z means UTC. An offset such as +02:00 or -05:00 says how far the local time is from UTC. If a string has no designator, the standard treats it as local time, so this tool lets you pick which zone to assume (UTC by default). A date without a time, like 2026-09-20, is read as midnight in that zone.",
        ],
      },
    ],
    howTo: [
      "Paste the ISO 8601 string, or select Use example.",
      "If the string has no Z or offset, choose the time zone to assume. UTC is the default.",
      "Select Convert to Unix.",
      "Copy the seconds or milliseconds value.",
    ],
    faq: [
      {
        q: "Which ISO 8601 formats are supported?",
        a: "The extended format with dashes and colons: YYYY-MM-DD, YYYY-MM-DDThh:mm, YYYY-MM-DDThh:mm:ss, optional fractional seconds, and an optional Z or offset written as +hh:mm, +hhmm or +hh. A space instead of the T is accepted too.",
      },
      {
        q: "What happens when the string has no time zone?",
        a: "The tool interprets the value in the zone you choose. UTC is the default because it gives the same answer for everybody.",
      },
      {
        q: "Why is 2026-02-30 rejected?",
        a: "Because it is not a real date. The tool checks the number of days in each month, including leap years.",
      },
      {
        q: "Is 2026-09-20T12:30:00Z the same as 2026-09-20T14:30:00+02:00?",
        a: "Yes. They describe the same instant, so both convert to the same Unix timestamp.",
      },
    ],
    related: ["unix-to-iso-8601", "date-to-timestamp", "timezone-converter", "unix-timestamp-converter"],
    guide: "iso-8601-date-format-guide",
  },
  {
    slug: "unix-to-iso-8601",
    category: "Developer",
    name: "Unix to ISO 8601",
    seoTitle: "Unix Timestamp to ISO 8601 Converter | Castov",
    metaDescription:
      "Convert a Unix timestamp in seconds or milliseconds to an ISO 8601 string in UTC or with your local UTC offset, ready to copy into code or an API.",
    intro:
      "Convert a Unix timestamp to an ISO 8601 string, once in UTC and once with your local UTC offset.",
    cardDescription: "Get an ISO 8601 string in UTC or with your local offset.",
    sections: [
      {
        heading: "Unix timestamp to ISO 8601",
        paragraphs: [
          "APIs, JSON documents and databases usually expect dates as ISO 8601 strings. This page turns a Unix timestamp into that format, once in UTC ending in Z and once with your local UTC offset, so you can copy whichever your code or API needs.",
        ],
      },
      {
        heading: "UTC or local offset?",
        paragraphs: [
          "Use the UTC form, which ends in Z, for storage, logs and API payloads: it is unambiguous and sorts alphabetically in time order. Use the offset form when a person needs to read local time while the exact instant stays recoverable, for example 2026-09-21T15:13:20.000+01:00.",
        ],
      },
    ],
    howTo: [
      "Enter the Unix timestamp.",
      "Leave Unit on Auto, or choose Seconds or Milliseconds.",
      "Select Convert to ISO 8601.",
      "Copy the UTC or local-offset string.",
    ],
    faq: [
      {
        q: "How do I create an ISO 8601 string in JavaScript?",
        a: "new Date(timestampInMilliseconds).toISOString() returns a UTC string such as 2026-09-21T14:13:20.000Z.",
      },
      {
        q: "How do I create one in Python?",
        a: "datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() returns a string such as 2026-09-21T14:13:20+00:00.",
      },
      {
        q: "Why does the ISO string end in Z?",
        a: "Z stands for Zulu time, another name for UTC. It means the offset from UTC is zero.",
      },
      {
        q: "Are milliseconds always included?",
        a: "Yes, the output always has three decimal places, like JavaScript's toISOString(). Most parsers accept this. Remove the .000 if your API does not want a fraction.",
      },
    ],
    related: ["iso-8601-to-unix", "unix-timestamp-converter", "timestamp-to-date", "timezone-converter"],
    guide: "iso-8601-date-format-guide",
  },
  {
    slug: "timezone-converter",
    category: "Time Zones",
    name: "Timezone Converter",
    seoTitle: "Timezone Converter – Convert Time Between Time Zones | Castov",
    metaDescription:
      "Convert a date and time between IANA time zones and compare the same moment across cities, with correct daylight saving time handling.",
    intro:
      "Convert a date and time from one time zone to another, then compare the same moment across several cities.",
    cardDescription: "Convert time between zones and compare cities side by side.",
    sections: [
      {
        heading: "Convert time between time zones",
        paragraphs: [
          "Choose the zone your time is written in, enter the date and time, and pick the zone you want to convert to. The result shows the converted date and time, the offsets involved and how far apart the two zones are at that moment. Zone names come from the IANA time zone database built into your browser, so they follow current daylight saving rules.",
        ],
      },
      {
        heading: "Compare several time zones",
        paragraphs: [
          "Below the converter, the same moment is shown in a list of cities: UTC, New York, London, Paris, Dubai, Tokyo and Algiers by default. Add or remove any IANA zone to build a list that matches your team, meeting or customers.",
        ],
      },
      {
        heading: "Why region names instead of EST or IST",
        paragraphs: [
          "Abbreviations such as EST, CST or IST are ambiguous (IST can mean India, Ireland or Israel) and do not say whether daylight saving time applies. Region names such as America/New_York carry the complete history of rule changes, which is why the tool uses them.",
        ],
      },
    ],
    howTo: [
      "Choose the From time zone.",
      "Enter the date and time, or select Use current time.",
      "Choose the To time zone and select Convert.",
      "Add or remove zones in the comparison list to see the same moment in more places.",
    ],
    faq: [
      {
        q: "How does the tool handle daylight saving time?",
        a: "It uses the rules for the exact date you enter. If the time falls in a spring-forward gap, it tells you the time does not exist. If it falls in a fall-back overlap, it uses the first occurrence and tells you.",
      },
      {
        q: "Which time zones are available?",
        a: "Every IANA time zone your browser supports, usually more than 400. The most common ones are listed first.",
      },
      {
        q: "Does the converter need an internet connection?",
        a: "Only to load the page. Conversions run locally in your browser using the built-in Intl.DateTimeFormat, and nothing you enter is sent anywhere.",
      },
      {
        q: "Why is Algiers UTC+1 all year?",
        a: "Algeria uses Central European Time all year and does not observe daylight saving time.",
      },
    ],
    related: ["date-to-timestamp", "iso-8601-to-unix", "timestamp-difference", "current-unix-timestamp"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "timestamp-difference",
    category: "Date & Duration",
    name: "Timestamp Difference",
    seoTitle: "Timestamp Difference Calculator – Calculate Time Difference | Castov",
    metaDescription:
      "Calculate the difference between two Unix timestamps in milliseconds, seconds, minutes, hours and days, plus a human-readable duration.",
    intro:
      "Enter two Unix timestamps to get the time between them in milliseconds, seconds, minutes, hours and days.",
    cardDescription: "Find the time between two timestamps as a duration.",
    sections: [
      {
        heading: "Calculate the difference between two timestamps",
        paragraphs: [
          "Enter two Unix timestamps and the calculator returns the gap in milliseconds, seconds, minutes, hours and days, plus a human-readable duration such as 2 days 4 hours 12 minutes 30 seconds. The result is always a positive amount, with a sentence telling you which timestamp comes first.",
        ],
      },
      {
        heading: "Common uses",
        paragraphs: [
          "Measure how long a job ran from two log lines, check how long a session or token lived, work out the time left until an expiry, or find the age of a record. Each field has its own Unit setting, so you can compare a value in seconds with a value in milliseconds.",
        ],
      },
    ],
    howTo: [
      "Enter Timestamp A and Timestamp B, or select Use current time on either field.",
      "Set the unit of each timestamp, or leave both on Auto.",
      "Select Calculate difference.",
      "Read the totals and the human-readable duration. Swap A and B to reverse the direction.",
    ],
    faq: [
      {
        q: "How do I calculate the difference between two timestamps in code?",
        a: "Subtract the earlier timestamp from the later one. If both are in seconds the result is in seconds, and you divide by 60, 3,600 or 86,400 for minutes, hours or days.",
      },
      {
        q: "Are months and years included?",
        a: "No. Months and years have different lengths, so the tool reports exact days, hours, minutes and seconds instead of approximations.",
      },
      {
        q: "Can I mix seconds and milliseconds?",
        a: "Yes. Each timestamp has its own unit setting, and Auto detects the unit of each one separately.",
      },
      {
        q: "Does daylight saving time change the result?",
        a: "No. Unix timestamps are in UTC, so the difference is the exact elapsed time. Only differences between local calendar times can shift by an hour around a clock change.",
      },
    ],
    related: ["unix-timestamp-converter", "epoch-converter", "timezone-converter", "date-to-timestamp"],
    guide: "what-is-unix-time",
  },
  {
    slug: "utc-converter",
    category: "Time Zones",
    name: "UTC Converter",
    seoTitle: "UTC Converter \u2013 Convert Local Time to UTC and Back | Castov",
    metaDescription:
      "Convert local time to UTC or UTC to local time in any IANA time zone. See the UTC offset and ISO 8601 output, with daylight saving time handled correctly.",
    intro: "Convert a local date and time to UTC, or a UTC time to any local time zone, with the offset shown.",
    cardDescription: "Convert between local time and UTC in any time zone.",
    sections: [
      {
        heading: "Local time and UTC",
        paragraphs: [
          "UTC (Coordinated Universal Time) is the reference every time zone is defined against. Local time is UTC plus that zone's current offset, which can change twice a year where daylight saving time applies. This tool converts in either direction: give it a local time and a zone to get UTC, or leave the zone on UTC to convert the other way.",
          "The result always shows the UTC offset that was used, so you can see at a glance whether daylight saving time was in effect for the date you entered.",
        ],
      },
      {
        heading: "Why not just use an offset?",
        paragraphs: [
          "A fixed offset like +02:00 is only correct for one moment. A time zone name such as Europe/Paris carries the full history of daylight saving rules, so the same tool gives the right offset for a date in July and a date in January without you having to know which one applies.",
        ],
      },
    ],
    howTo: [
      "Choose the time zone your date and time are written in.",
      "Enter the date and time, or select Use current time.",
      "Select Convert to see the UTC time, the offset that was applied, and the ISO 8601 form.",
      "Switch the time zone to Local time or another zone to convert a UTC time the other way.",
    ],
    faq: [
      {
        q: "How do I convert my local time to UTC?",
        a: "Choose your local time zone, enter the date and time, and select Convert. The UTC result accounts for daylight saving time automatically.",
      },
      {
        q: "How do I convert UTC to my local time?",
        a: "Enter the UTC date and time with the time zone set to UTC, then read the local time shown for the zone you choose to compare against, or use the Timezone Converter for a full comparison view.",
      },
      {
        q: "Does the offset change with daylight saving time?",
        a: "Yes. The offset shown is calculated for the exact date you enter, so it reflects whichever rule (standard time or daylight saving time) applies on that date.",
      },
      {
        q: "What is the difference between UTC and GMT?",
        a: "UTC is the modern time standard used by computers; GMT is a time zone that, in practice, keeps the same clock time as UTC. The small technical difference (GMT is based on solar time, UTC on atomic clocks) does not affect everyday conversions.",
      },
    ],
    related: ["timezone-converter", "date-to-timestamp", "iso-8601-to-unix", "world-clock", "timezone-offset"],
    guide: "utc-vs-gmt",
  },
  {
    slug: "date-difference",
    category: "Date & Duration",
    name: "Date Difference Calculator",
    seoTitle: "Date Difference Calculator \u2013 Days Between Two Dates | Castov",
    metaDescription:
      "Calculate the difference between two dates in years, months, weeks and days, plus total days, hours, minutes and seconds. Leap years are handled correctly.",
    intro: "Enter a start and end date to get the difference in years, months, weeks and days, plus the totals in each unit.",
    cardDescription: "Years, months, weeks and days between two dates, leap years included.",
    sections: [
      {
        heading: "Calendar difference between two dates",
        paragraphs: [
          "This calculator breaks the gap between two dates into whole years, whole months, whole weeks and remaining days, the way people naturally describe an age or a countdown: for example 1 year, 3 months and 2 days rather than an unwieldy number of days. It also gives you the same gap as a single total in days, hours, minutes and seconds.",
          "Leap years are handled automatically. A February that has 29 days is simply one day longer, so a difference that spans it comes out correctly without any extra input from you.",
        ],
      },
      {
        heading: "How the year and month count is chosen",
        paragraphs: [
          "Whole months are counted first, using the calendar (so January 31 to February 28 is treated as one full month), and any partial month left over is expressed in weeks and days. This matches how people read a date range on a calendar, rather than converting everything to an average month length.",
        ],
      },
    ],
    howTo: [
      "Enter the start date, or select Use today.",
      "Enter the end date.",
      "Select Calculate difference.",
      "Read the breakdown in years, months, weeks and days, and the totals below it.",
    ],
    faq: [
      {
        q: "How many days are between two dates?",
        a: "Enter both dates and read the Total days figure, which is the exact number of calendar days between them, leap years included.",
      },
      {
        q: "Does it matter which date I enter first?",
        a: "No. If the end date is earlier than the start date, the calculator swaps them automatically and says so, so the breakdown is always a positive duration.",
      },
      {
        q: "How are leap years handled?",
        a: "A leap year's extra day (29 February) is simply counted like any other day, so a range that includes it is one day longer than the same range in a non-leap year.",
      },
      {
        q: "Why do the years and months look different from just dividing the days?",
        a: "Months have different lengths (28 to 31 days) and years vary between 365 and 366 days, so the calculator counts whole calendar months and years directly instead of dividing by an average length, which would be less precise.",
      },
    ],
    related: ["time-duration-calculator", "add-time", "subtract-time", "timestamp-difference", "date-to-timestamp"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "time-duration-calculator",
    category: "Date & Duration",
    name: "Time Duration Calculator",
    seoTitle: "Time Duration Calculator \u2013 Elapsed Time Between Two Clock Times | Castov",
    metaDescription:
      "Calculate the elapsed time between two clock times, including shifts that cross midnight, in seconds, minutes, hours and days.",
    intro: "Enter a start time and an end time to get the elapsed duration, including shifts that cross midnight.",
    cardDescription: "Elapsed time between two clock times, midnight crossings included.",
    sections: [
      {
        heading: "Elapsed time between two clock times",
        paragraphs: [
          "This calculator works with clock times only, not full dates, which makes it a fast way to check a shift length, a commute, or how long a task took when you only have the start and end time. If the end time is earlier than the start time, it is treated as happening the next day: 23:30 to 01:15 comes out as 1 hour 45 minutes, not a negative number.",
        ],
      },
      {
        heading: "Shifts longer than a day",
        paragraphs: [
          "For a shift or task that spans more than 24 hours, add the number of extra full days on top of the clock times. A 09:00-to-09:00 shift with 1 extra day, for example, comes out as exactly 1 day (24 hours), and the calculator supports any number of extra days.",
        ],
      },
    ],
    howTo: [
      "Enter the start time.",
      "Enter the end time. If it is earlier than the start time, it is read as being on the next day.",
      "Add extra whole days if the duration spans more than one midnight.",
      "Select Calculate to see the duration in seconds, minutes, hours and days.",
    ],
    faq: [
      {
        q: "How is a shift that crosses midnight handled?",
        a: "If the end time is earlier than the start time, the calculator assumes the end time is on the following day. For example 23:30 to 01:15 is treated as 1 hour 45 minutes.",
      },
      {
        q: "Can I calculate a duration longer than 24 hours?",
        a: "Yes. Add the number of extra full days, and they are added on top of the difference between the two clock times.",
      },
      {
        q: "What if the start and end time are the same?",
        a: "The duration is 0 seconds, unless you add extra days, in which case it is exactly that many whole days.",
      },
      {
        q: "Does this account for daylight saving time?",
        a: "No, because it works with plain clock times and does not use a date or time zone. For a duration across a specific calendar date and time zone, use the Date Difference Calculator or the Timezone Converter instead.",
      },
    ],
    related: ["date-difference", "timestamp-difference", "add-time", "subtract-time", "current-unix-timestamp"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "add-time",
    category: "Date & Duration",
    name: "Add Time Calculator",
    seoTitle: "Add Time Calculator \u2013 Add Days, Hours, Minutes | Castov",
    metaDescription:
      "Add a duration in seconds, minutes, hours, days or weeks to a date and time and get the resulting date, with daylight saving time and time zones handled.",
    intro: "Enter a starting date and time, choose a duration to add, and get the resulting date and time.",
    cardDescription: "Add seconds, minutes, hours, days or weeks to a date and time.",
    sections: [
      {
        heading: "Add a duration to a date and time",
        paragraphs: [
          "Enter a starting date and time, a time zone, an amount and a unit (seconds, minutes, hours, days or weeks), and the tool returns the resulting date and time. This is useful for working out a deadline, an expiry time, or a follow-up date without counting on a calendar.",
        ],
      },
      {
        heading: "Exact time vs calendar days",
        paragraphs: [
          "Seconds, minutes and hours add an exact amount of elapsed time. Days and weeks add calendar days in the time zone you choose and keep the same clock time, even across a daylight saving change, the way a person scheduling \u201Cthis time next week\u201D would expect. If the result would land in a gap created by clocks moving forward, the tool moves it forward by the size of the gap and tells you.",
        ],
      },
    ],
    howTo: [
      "Enter the starting date and time, or select Use current time.",
      "Choose the time zone.",
      "Enter the amount to add and choose the unit.",
      "Select Add time to see the resulting date and time.",
    ],
    faq: [
      {
        q: "Does adding days keep the same time of day?",
        a: "Yes. Adding days or weeks keeps the clock time and moves the calendar date, even when a daylight saving change happens in between.",
      },
      {
        q: "What happens if adding hours crosses a daylight saving change?",
        a: "Adding hours always adds an exact amount of elapsed time, so the result may show a clock time that is one hour different from what you might expect, because the offset changed in between.",
      },
      {
        q: "Can I add a fractional number of hours?",
        a: "Yes for seconds, minutes and hours. Days and weeks must be whole numbers; use hours if you need a fraction of a day.",
      },
      {
        q: "How do I subtract time instead?",
        a: "Use the Subtract Time Calculator, which works the same way but moves backward from the starting date and time.",
      },
    ],
    related: ["subtract-time", "date-difference", "time-duration-calculator", "date-to-timestamp", "timezone-converter"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "subtract-time",
    category: "Date & Duration",
    name: "Subtract Time Calculator",
    seoTitle: "Subtract Time Calculator \u2013 Subtract Days, Hours, Minutes | Castov",
    metaDescription:
      "Subtract a duration in seconds, minutes, hours, days or weeks from a date and time and get the resulting date, with daylight saving time handled correctly.",
    intro: "Enter a date and time, choose a duration to subtract, and get the resulting date and time.",
    cardDescription: "Subtract seconds, minutes, hours, days or weeks from a date and time.",
    sections: [
      {
        heading: "Subtract a duration from a date and time",
        paragraphs: [
          "Enter a date and time, a time zone, an amount and a unit, and the tool returns the date and time that far before it. This answers questions like \u201Cwhat date was 90 days before this deadline\u201D or \u201Cwhat time did this 6-hour job start if it finished at 14:00.\u201D",
        ],
      },
      {
        heading: "Exact time vs calendar days",
        paragraphs: [
          "Seconds, minutes and hours subtract an exact amount of elapsed time. Days and weeks go back by calendar days in the time zone you choose and keep the same clock time, even across a daylight saving change. If that lands in a gap created by clocks moving forward, the tool moves the result forward by the size of the gap and explains why.",
        ],
      },
    ],
    howTo: [
      "Enter the date and time to subtract from, or select Use current time.",
      "Choose the time zone.",
      "Enter the amount to subtract and choose the unit.",
      "Select Subtract time to see the resulting date and time.",
    ],
    faq: [
      {
        q: "How do I find the date a number of days ago?",
        a: "Enter today's date, set the unit to Days, enter the number of days, and select Subtract time.",
      },
      {
        q: "Does subtracting days keep the same time of day?",
        a: "Yes, days and weeks keep the clock time and move the calendar date backward, including across a daylight saving change.",
      },
      {
        q: "Can the result be a negative number of days?",
        a: "No. The result is always a specific date and time; if you need the size of a gap between two dates instead, use the Date Difference Calculator.",
      },
      {
        q: "How do I add time instead?",
        a: "Use the Add Time Calculator, which works the same way but moves forward from the starting date and time.",
      },
    ],
    related: ["add-time", "date-difference", "time-duration-calculator", "date-to-timestamp", "timezone-converter"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "unix-timestamp-validator",
    category: "Developer",
    name: "Unix Timestamp Validator",
    seoTitle: "Unix Timestamp Validator \u2013 Check a Timestamp Is Valid | Castov",
    metaDescription:
      "Check whether a value is a valid Unix timestamp, see whether it is in seconds or milliseconds, and get a clear, specific reason when it is not valid.",
    intro: "Check whether a value is a valid Unix timestamp and see exactly why, if it is not.",
    cardDescription: "Check whether a value is a valid Unix timestamp, with a clear reason if not.",
    sections: [
      {
        heading: "What counts as a valid Unix timestamp",
        paragraphs: [
          "A valid Unix timestamp is a whole number (an optional decimal fraction is also accepted) that, once interpreted as seconds or milliseconds, falls within the supported calendar range of the years 1 to 9999. This tool checks the format first, then the range, and tells you which check failed instead of a generic error.",
        ],
      },
      {
        heading: "Why validation catches real bugs",
        paragraphs: [
          "The most common mistake is mixing up seconds and milliseconds, which does not always cause an obvious crash; it can silently produce a date decades in the wrong direction. This tool flags that case directly, so a value that is technically valid but suspicious (for example, a 13-digit value forced into a seconds field) is called out in the notes.",
        ],
      },
    ],
    howTo: [
      "Enter the value you want to check.",
      "Choose the unit, or leave it on Auto to have it detected.",
      "Select Validate.",
      "Read the Valid or Invalid result, the reason if it is invalid, and any notes about the value.",
    ],
    faq: [
      {
        q: "What makes a timestamp invalid?",
        a: "Text that is not a number, a value with more digits than any real Unix timestamp unit uses, or a number that falls outside the supported calendar range (years 1 to 9999) once interpreted in the chosen unit.",
      },
      {
        q: "Can negative numbers be valid?",
        a: "Yes. Negative Unix timestamps represent moments before 1 January 1970 and are valid as long as they are within the supported range.",
      },
      {
        q: "How does the validator choose seconds or milliseconds?",
        a: "On Auto, values with 12 or more digits are treated as milliseconds and shorter values as seconds, the same rule the other Castov converters use. You can force a specific unit instead.",
      },
      {
        q: "Does this check leap seconds?",
        a: "No. Unix time does not count leap seconds, so this validator (like the rest of Castov) treats every day as exactly 86,400 seconds.",
      },
    ],
    related: ["unix-timestamp-converter", "unix-timestamp-batch-converter", "epoch-converter", "milliseconds-to-date"],
    guide: "seconds-vs-milliseconds-timestamps",
  },
  {
    slug: "epoch-milliseconds",
    category: "Timestamp",
    name: "Epoch Milliseconds Converter",
    seoTitle: "Epoch Milliseconds Converter \u2013 Convert Milliseconds to Date | Castov",
    metaDescription:
      "Convert epoch milliseconds to a date in UTC, local time and ISO 8601, or find the current epoch time in milliseconds. Fast, free and browser-based.",
    intro: "Convert a value in epoch milliseconds to a readable date in UTC, local time and ISO 8601.",
    cardDescription: "Epoch milliseconds to a readable date, in UTC, local time and ISO 8601.",
    sections: [
      {
        heading: "Epoch milliseconds",
        paragraphs: [
          "Epoch milliseconds is the same Unix epoch (1 January 1970, 00:00:00 UTC) counted in thousandths of a second instead of whole seconds. It is the unit JavaScript's Date.now() and many JSON APIs return, and it has 13 digits today, for example 1790000000123.",
        ],
      },
      {
        heading: "When to use this instead of Milliseconds to Date",
        paragraphs: [
          "This tool and Milliseconds to Date use the same conversion; both exist because people search for \u201Cepoch\u201D and \u201Cmilliseconds\u201D as different terms for the same idea. Use whichever page you found first, or the Unix Timestamp Converter if you are not sure which unit you have.",
        ],
      },
    ],
    howTo: [
      "Enter the value in epoch milliseconds.",
      "Select Convert.",
      "Read the date in UTC, local time and ISO 8601.",
      "Copy the value you need.",
    ],
    faq: [
      {
        q: "How many digits does epoch milliseconds have today?",
        a: "13 digits, for example 1790000000123. It will reach 14 digits in the year 2286.",
      },
      {
        q: "How do I get the current time in epoch milliseconds?",
        a: "In JavaScript, Date.now() returns it directly. You can also see the live value on the Current Unix Timestamp page.",
      },
      {
        q: "What if my value has 10 digits?",
        a: "A 10-digit value is in seconds, not milliseconds. Use the Unix Timestamp Converter, which detects the unit automatically.",
      },
      {
        q: "Are microseconds or nanoseconds supported?",
        a: "Not directly. Divide a microsecond value by 1,000, or a nanosecond value by 1,000,000, to get milliseconds first.",
      },
    ],
    related: ["milliseconds-to-date", "unix-timestamp-converter", "current-unix-timestamp", "unix-timestamp-validator"],
    guide: "seconds-vs-milliseconds-timestamps",
  },
  {
    slug: "unix-timestamp-batch-converter",
    category: "Developer",
    name: "Unix Timestamp Batch Converter",
    seoTitle: "Unix Timestamp Batch Converter \u2013 Convert Many at Once | Castov",
    metaDescription:
      "Paste a list of Unix timestamps, one per line, and convert all of them at once to UTC, local time and ISO 8601. Copy the results or download them as CSV.",
    intro: "Paste a list of Unix timestamps, one per line, and convert all of them at once.",
    cardDescription: "Convert a whole list of Unix timestamps at once, with CSV export.",
    sections: [
      {
        heading: "Convert many timestamps at once",
        paragraphs: [
          "Paste timestamps one per line, in seconds or milliseconds, and this tool converts every line to UTC, local time and ISO 8601 in a single table. It is built for pasting a column out of a spreadsheet or a handful of values from a log file, without converting them one at a time.",
        ],
      },
      {
        heading: "Handling bad values",
        paragraphs: [
          "A line that is not a valid timestamp is marked as invalid in its own row, with the reason shown, while every valid line around it still converts normally. Blank lines are skipped without being reported as errors.",
        ],
      },
    ],
    howTo: [
      "Paste your timestamps into the box, one per line.",
      "Choose the unit, or leave it on Auto to detect each line separately.",
      "Select Convert all.",
      "Copy the table, or select Download CSV to save it as a spreadsheet file.",
    ],
    faq: [
      {
        q: "How many timestamps can I convert at once?",
        a: "Up to 5,000 lines in a single batch. Anything beyond that is not processed, and the tool tells you when the list was cut off.",
      },
      {
        q: "What happens to blank lines?",
        a: "They are ignored and do not appear as rows in the result, so you can paste data with extra spacing without it affecting the count.",
      },
      {
        q: "Can I mix seconds and milliseconds in the same list?",
        a: "Yes, if you leave the unit on Auto. Each line is detected separately based on its digit count.",
      },
      {
        q: "Does the CSV download send my data anywhere?",
        a: "No. The file is generated in your browser from the values you entered and saved directly to your device; nothing is uploaded.",
      },
    ],
    related: ["unix-timestamp-converter", "unix-timestamp-validator", "epoch-converter", "timestamp-to-date"],
    guide: "seconds-vs-milliseconds-timestamps",
  },
  {
    slug: "date-format-converter",
    category: "Developer",
    name: "Date Format Converter",
    seoTitle: "Date Format Converter \u2013 Convert Between Date and Time Formats | Castov",
    metaDescription:
      "Convert a date between ISO 8601, RFC 2822, RFC 3339, UTC, local time, Unix seconds and Unix milliseconds. Paste any common format and get every other one.",
    intro: "Paste a date in almost any common format and get it converted to every other format at once.",
    cardDescription: "One date in, every common format out: ISO 8601, RFC 2822, RFC 3339, Unix and more.",
    sections: [
      {
        heading: "One input, every format",
        paragraphs: [
          "Paste a date as a Unix timestamp, an ISO 8601 string, an RFC 3339 string, or an RFC 2822 string (the format used in email headers, such as Mon, 21 Sep 2026 14:13:20 +0000), and this tool detects which format it is and shows the same instant in all of the others: ISO 8601, UTC, local time, Unix seconds, Unix milliseconds, RFC 2822 and RFC 3339.",
        ],
      },
      {
        heading: "When the format is ambiguous",
        paragraphs: [
          "An ISO-style string without a UTC offset (like 2026-09-20T12:30:00, with no Z or +hh:mm) does not specify a time zone by itself. This tool reads it as UTC and says so, since that is the safest default; convert with the ISO 8601 Converter directly if you need to assume a different zone.",
        ],
      },
    ],
    howTo: [
      "Paste a date in any of the supported formats.",
      "Select Detect and convert.",
      "Read the same instant shown in every supported format.",
      "Copy the one you need.",
    ],
    faq: [
      {
        q: "Which formats are detected automatically?",
        a: "Unix timestamps in seconds or milliseconds, ISO 8601, RFC 3339 and RFC 2822 (email-style) dates are all detected from the text you paste, with no need to say which one it is.",
      },
      {
        q: "What is the difference between ISO 8601 and RFC 3339?",
        a: "RFC 3339 is a stricter, internet-focused profile of ISO 8601: it always requires a full date, a full time and an offset or Z. Most APIs that mention ISO 8601 actually follow the RFC 3339 profile.",
      },
      {
        q: "What is RFC 2822 used for?",
        a: "It is the date format used in email and HTTP headers, for example Mon, 21 Sep 2026 14:13:20 +0000. This tool both reads and produces it.",
      },
      {
        q: "My date was not recognised. What should I do?",
        a: "Check for typos in the month name or a missing time zone offset. If you know which exact format you have, the ISO 8601 Converter or RFC 3339 Converter may give a more specific error.",
      },
    ],
    related: ["iso-8601-converter", "rfc-3339-converter", "unix-timestamp-converter", "unix-to-iso-8601"],
    guide: "iso-8601-date-format-guide",
  },
  {
    slug: "iso-8601-converter",
    category: "Developer",
    name: "ISO 8601 Converter",
    seoTitle: "ISO 8601 Converter \u2013 Convert ISO 8601 to Unix Time and Back | Castov",
    metaDescription:
      "A complete ISO 8601 converter: turn an ISO 8601 string into Unix seconds, milliseconds, UTC and a readable date, or turn a Unix timestamp into ISO 8601.",
    intro: "Convert an ISO 8601 date to Unix time and a readable date, or convert a Unix timestamp to ISO 8601, in one place.",
    cardDescription: "ISO 8601 to Unix time and back, in one combined tool.",
    sections: [
      {
        heading: "A two-way ISO 8601 tool",
        paragraphs: [
          "This page combines both directions of ISO 8601 conversion: paste an ISO 8601 string to get Unix seconds, Unix milliseconds and a readable date, or enter a Unix timestamp to get its ISO 8601 form in UTC and with your local UTC offset.",
        ],
      },
      {
        heading: "Recognised ISO 8601 forms",
        paragraphs: [
          "Both a date alone (2026-09-20) and a full date and time with Z or a numeric offset (2026-09-20T12:30:00+02:00) are accepted, with or without fractional seconds. A string with no offset is read in the time zone you choose, UTC by default.",
        ],
      },
    ],
    howTo: [
      "To convert ISO 8601 to Unix time: paste the string and select Convert to Unix.",
      "To convert Unix time to ISO 8601: enter the timestamp and select Convert to ISO 8601.",
      "Copy whichever result you need.",
      "Use Use example to see a worked ISO 8601 string.",
    ],
    faq: [
      {
        q: "What is ISO 8601?",
        a: "The international standard format for writing dates and times, such as 2026-09-20T12:30:00Z, designed to sort correctly and never be mistaken for month/day versus day/month.",
      },
      {
        q: "Does this tool need a time zone offset in the string?",
        a: "No. If the string has no offset, choose which time zone to assume; UTC is used by default, which is the safest choice for logs and data storage.",
      },
      {
        q: "Can I convert a Unix timestamp to ISO 8601 here too?",
        a: "Yes, the second part of this page does exactly that, showing both the UTC form (ending in Z) and the form with your local UTC offset.",
      },
      {
        q: "Is milliseconds precision supported?",
        a: "Yes, both directions keep fractional seconds down to the millisecond.",
      },
    ],
    related: ["iso-8601-to-unix", "unix-to-iso-8601", "rfc-3339-converter", "date-format-converter"],
    guide: "iso-8601-date-format-guide",
  },
  {
    slug: "rfc-3339-converter",
    category: "Developer",
    name: "RFC 3339 Converter",
    seoTitle: "RFC 3339 Converter \u2013 Convert RFC 3339 Timestamps to Unix Time | Castov",
    metaDescription:
      "Convert an RFC 3339 timestamp to Unix time, or Unix time to RFC 3339, with the UTC offset shown. RFC 3339 is the strict internet date-time profile of ISO 8601.",
    intro: "Convert an RFC 3339 timestamp to Unix time, or a Unix timestamp to RFC 3339.",
    cardDescription: "RFC 3339 to Unix time and back, the strict internet date-time format.",
    sections: [
      {
        heading: "What is RFC 3339?",
        paragraphs: [
          "RFC 3339 is the date-time format defined for internet protocols: a full date, a full time with seconds, and a mandatory UTC offset (either Z for UTC or a signed +hh:mm). It is a stricter subset of ISO 8601, which allows several optional parts that RFC 3339 requires, so every RFC 3339 string is valid ISO 8601 but not the reverse.",
        ],
      },
      {
        heading: "Where you will see it",
        paragraphs: [
          "Many JSON APIs, log formats and configuration files specify RFC 3339 explicitly because it removes the ambiguity that plain ISO 8601 allows (such as a date with no time, or a time with no offset). This tool converts it to and from Unix time and shows the offset that was used.",
        ],
      },
    ],
    howTo: [
      "To convert RFC 3339 to Unix time: paste the timestamp and select Convert to Unix.",
      "To convert Unix time to RFC 3339: enter the timestamp, choose UTC or a local offset, and select Convert to RFC 3339.",
      "Copy the result you need.",
      "Select Use example to see a worked RFC 3339 string with an offset.",
    ],
    faq: [
      {
        q: "Is RFC 3339 the same as ISO 8601?",
        a: "RFC 3339 is a stricter profile of ISO 8601. Every valid RFC 3339 string is also valid ISO 8601, but ISO 8601 allows some forms, such as a date without a time, that RFC 3339 does not.",
      },
      {
        q: "Is the UTC offset required?",
        a: "Yes. Unlike plain ISO 8601, RFC 3339 always requires either Z (UTC) or a signed offset such as +02:00; a string without one is rejected with an explanation.",
      },
      {
        q: "Does it support leap seconds?",
        a: "No. RFC 3339 technically allows a leap second (:60), but Unix time does not represent them, so this tool does not accept a :60 seconds value.",
      },
      {
        q: "What is the difference from RFC 2822?",
        a: "RFC 2822 is the older email and HTTP header date format (Mon, 21 Sep 2026 14:13:20 +0000). RFC 3339 is the newer, sortable format most JSON APIs use today. Use the Date Format Converter if you need to convert between the two.",
      },
    ],
    related: ["iso-8601-converter", "iso-8601-to-unix", "unix-to-iso-8601", "date-format-converter"],
    guide: "iso-8601-date-format-guide",
  },
  {
    slug: "timezone-offset",
    category: "Time Zones",
    name: "Time Zone Offset Calculator",
    seoTitle: "Time Zone Offset Calculator \u2013 Compare UTC Offsets Between Zones | Castov",
    metaDescription:
      "Compare the UTC offset of two time zones on a given date and see the exact difference between them, with daylight saving time applied automatically.",
    intro: "Pick two time zones and a date to see each one's UTC offset and the exact difference between them.",
    cardDescription: "Compare the UTC offset of two time zones and the gap between them.",
    sections: [
      {
        heading: "Comparing UTC offsets",
        paragraphs: [
          "Every time zone is defined by its offset from UTC, which can change on a schedule when daylight saving time applies. This tool shows the offset for each of two zones on the date you choose, and the exact difference between them, which is what actually matters when scheduling a call or a handover between two places.",
        ],
      },
      {
        heading: "Why the difference can change through the year",
        paragraphs: [
          "Two zones that are 5 hours apart in one season can be 4 or 6 hours apart in another, if only one of them observes daylight saving time, or if they change on different dates. Checking the specific date, rather than assuming a fixed gap, avoids scheduling mistakes around those transition weeks.",
        ],
      },
    ],
    howTo: [
      "Choose the first time zone.",
      "Choose the second time zone.",
      "Pick a date, or select Use today.",
      "Select Compare to see each offset and the difference between them.",
    ],
    faq: [
      {
        q: "Why does the difference between two zones change during the year?",
        a: "If one zone observes daylight saving time and the other does not, or they switch on different dates, the gap between their offsets shifts by an hour during the affected weeks.",
      },
      {
        q: "Does this tool convert a specific time between the zones?",
        a: "It shows the offset and the difference for the date you choose. For a specific clock time converted between zones, use the Timezone Converter.",
      },
      {
        q: "What if I want to compare more than two zones at once?",
        a: "Use the comparison table on the Timezone Converter or the World Clock, both of which show several zones side by side.",
      },
      {
        q: "Does Algiers observe daylight saving time?",
        a: "No. Algeria uses Central European Time all year, so its offset from UTC stays at +1 regardless of the date.",
      },
    ],
    related: ["timezone-converter", "world-clock", "utc-converter", "business-hours-converter"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "world-clock",
    category: "Time Zones",
    name: "World Clock",
    seoTitle: "World Clock \u2013 Current Time in Cities Around the World | Castov",
    metaDescription:
      "See the current time in New York, London, Paris, Algiers, Dubai and Tokyo at once, updated live, with each city's UTC offset. Add or remove cities.",
    intro: "The current time in cities around the world, updated live, with each city's UTC offset.",
    cardDescription: "Live local time in several cities at once, with day and night shown.",
    sections: [
      {
        heading: "See the time in several places at once",
        paragraphs: [
          "The World Clock shows the current local time, date and UTC offset for a set of cities side by side, updating once per second. It starts with a useful default spread across time zones and lets you add or remove any city with an IANA time zone your browser supports.",
        ],
      },
      {
        heading: "Day and night at a glance",
        paragraphs: [
          "Each card is marked as day or night based on the local hour (6 a.m. to 6 p.m. counts as day), which makes it quick to see, without reading the numbers, whether a city is in a reasonable hour to call or message.",
        ],
      },
    ],
    howTo: [
      "Read the current time, date and offset for each city.",
      "Select Add a city to add another time zone to the list.",
      "Select Remove on a card to take it off the list.",
      "Leave the page open; every clock updates once per second on its own.",
    ],
    faq: [
      {
        q: "How often do the clocks update?",
        a: "Once per second, using your device's own clock, so if your device's time is wrong, the displayed times will be off by the same amount.",
      },
      {
        q: "Can I save my list of cities?",
        a: "Not yet; the list resets to the default cities when you reload the page. Bookmark the page and re-add your cities, or use the Timezone Converter's comparison table for a similar side-by-side view.",
      },
      {
        q: "How is day or night decided?",
        a: "A city is shown as daytime when its local hour is between 6 a.m. and 6 p.m., and night-time otherwise. It is a simple clock-based rule, not based on actual sunrise or sunset.",
      },
      {
        q: "Does this need an internet connection to stay accurate?",
        a: "No. Once the page is loaded, the clocks run from your device's own clock and the browser's built-in time zone data, with nothing fetched from a server.",
      },
    ],
    related: ["timezone-converter", "timezone-offset", "current-unix-timestamp", "business-hours-converter"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "business-hours-converter",
    category: "Time Zones",
    name: "Business Hours Converter",
    seoTitle: "Business Hours Converter \u2013 Compare Working Hours | Castov",
    metaDescription:
      "Compare working hours between two or more time zones and find the overlap when it exists, so you can schedule a meeting that works for every team.",
    intro: "Compare working hours between two or more time zones and find the overlap, if there is one.",
    cardDescription: "Compare working hours across time zones and find the overlap for meetings.",
    sections: [
      {
        heading: "Finding a meeting time across time zones",
        paragraphs: [
          "Give each team its time zone and working hours (for example 09:00-17:00), and this tool shows every team's window converted into a single reference zone, side by side, plus the exact overlap across all of them, if one exists. It is built for scheduling meetings and handovers between offices in different time zones.",
        ],
      },
      {
        heading: "Overnight and non-overlapping shifts",
        paragraphs: [
          "An end time earlier than the start time (such as 22:00 to 06:00) is treated as an overnight shift ending the next day. When the working hours genuinely do not overlap at all, the tool says so plainly instead of showing a confusing or empty result.",
        ],
      },
    ],
    howTo: [
      "Pick a date to compare on, since offsets can depend on the date.",
      "For each team, choose its time zone and enter its working hours.",
      "Select Add a time zone for more than two teams.",
      "Select Compare hours to see each team's window and the overlap, if any.",
    ],
    faq: [
      {
        q: "What happens if the teams' hours never overlap?",
        a: "The tool tells you plainly that there is no overlap on the date you chose, rather than showing an empty or misleading time range.",
      },
      {
        q: "Can I compare more than two time zones?",
        a: "Yes, add as many time zone rows as you need; the overlap is calculated across all of them at once.",
      },
      {
        q: "What happens in the weeks around a daylight saving change?",
        a: "Each zone's offset is calculated for the specific date you choose, so if two zones change on different dates, the tool correctly shows a different overlap during the weeks between those changes.",
      },
      {
        q: "Can I compare an overnight shift, like 22:00 to 06:00?",
        a: "Yes. If the end time is earlier than the start time, it is treated as ending the following day.",
      },
    ],
    related: ["timezone-converter", "timezone-offset", "world-clock", "utc-converter"],
    guide: "time-zones-and-dst-for-developers",
  },
  {
    slug: "cron-generator",
    category: "Developer",
    name: "Cron Expression Generator",
    seoTitle: "Cron Expression Generator \u2013 Build and Explain Cron Schedules | Castov",
    metaDescription:
      "Build a cron expression from simple options or write one directly, see a plain-English explanation and the next run times, and check it for mistakes.",
    intro: "Build a cron expression from simple options, or write one directly, with a plain-English explanation.",
    cardDescription: "Build a cron expression and see a plain-English explanation of its schedule.",
    sections: [
      {
        heading: "What a cron expression is",
        paragraphs: [
          "A standard cron expression has five fields, separated by spaces: minute, hour, day-of-month, month and day-of-week. Each field can be a specific value, a range (1-5), a list (1,3,5), a step (*/15) or an asterisk meaning \u201Cevery value.\u201D For example 0 9 * * 1-5 means 09:00 on every weekday.",
        ],
      },
      {
        heading: "Building one without memorising the syntax",
        paragraphs: [
          "Choose a common pattern (every minute, hourly, daily, weekly or monthly) and fill in the specific minute, hour, weekday or day of the month; the tool assembles the five fields for you. If you already know cron, switch to Custom and type the expression directly; either way, the explanation and next run times update to match.",
        ],
      },
    ],
    howTo: [
      "Choose a preset (every minute, hourly, daily, weekly, monthly), or select Custom to type your own expression.",
      "Fill in the specific minute, hour, day of the month, or weekdays for the preset you chose.",
      "Read the plain-English explanation and the next few run times.",
      "Select Copy to copy the five-field expression.",
    ],
    faq: [
      {
        q: "What do the five fields in a cron expression mean?",
        a: "In order: minute (0-59), hour (0-23), day of the month (1-31), month (1-12) and day of the week (0-6, where 0 is Sunday). An asterisk in any field means \u201Cevery value.\u201D",
      },
      {
        q: "What does */15 mean?",
        a: "A step value: */15 in the minute field means every 15 minutes (0, 15, 30 and 45). The same pattern works in any field.",
      },
      {
        q: "What happens if I fill in both day-of-month and day-of-week?",
        a: "Standard cron treats that as \u201Ceither/or\u201D: the schedule runs when the day matches the day-of-month field OR the day-of-week field, not only when both match.",
      },
      {
        q: "Does this support 6-field cron with seconds, like Quartz?",
        a: "No, this tool covers the standard 5-field cron format used by Unix cron and most schedulers. A 6 or 7 field expression is detected and flagged as unsupported rather than silently misread.",
      },
    ],
    related: ["current-unix-timestamp", "timezone-converter", "world-clock", "unix-timestamp-validator"],
    guide: "cron-expressions-explained",
  },
  {
    slug: "timezone-simulator",
    category: "Time Zones",
    name: "Timezone Travel Simulator",
    seoTitle: "Timezone Simulator: Visually Test Events Across Regions",
    metaDescription: "Test and debug how your cron jobs, deployments, or global events align across different timezones using a visual timeline simulator.",
    intro: "Slide through time to visually verify how a single point in time resolves across multiple global cities simultaneously.",
    cardDescription: "Visual timeline for debugging global events across regions.",
    sections: [
      {
        heading: "Why a Simulator?",
        paragraphs: ["Building distributed systems means dealing with events happening globally. A standard converter shows you static times, but a simulator lets you drag a slider and instantly see how day and night shift across regions. It's the ultimate tool for debugging cron jobs, deployment windows, and global push notifications."]
      }
    ],
    howTo: [
      "Add the timezones you want to track (e.g., Tokyo, UTC, PST).",
      "Drag the slider along the 24-hour axis.",
      "Watch the local times update synchronously to verify overlap hours."
    ],
    faq: [
      { q: "Does this affect other browser tabs?", a: "No, the override is isolated to the current Service Worker scope or injected script execution context." }
    ],
    related: ["timezone-converter", "world-clock", "cron-generator"],
  },
  {
    slug: "universal-config-sync",
    category: "Developer",
    name: "Universal Config Sync",
    seoTitle: "Universal Config Sync: YAML, JSON, TOML Converter",
    metaDescription: "Convert and synchronize JSON, YAML, and TOML configuration files in real-time.",
    intro: "Edit your configuration in any format, and watch the others synchronize instantly with real-time syntax validation.",
    cardDescription: "Real-time sync between JSON, YAML, and TOML.",
    sections: [
      {
        heading: "Why a Universal Sync?",
        paragraphs: ["Configuration formats are a mess. DevOps engineers constantly translate between JSON (for APIs), YAML (for Kubernetes/CI), and TOML (for Rust/Python). This tool translates them locally in your browser in real-time."]
      }
    ],
    howTo: [
      "Paste your configuration in the format you have.",
      "Edit the file.",
      "Copy the converted configuration from the other panels."
    ],
    faq: [
      { q: "Does it support custom ESLint plugins?", a: "Yes, it cross-references standard plugin rulesets to prevent collisions." }
    ],
    related: ["timezone-simulator", "env-vault"],
  },
  {
    slug: "env-vault", isPro: true,
    category: "Developer",
    name: "Zero-Knowledge .env Vault",
    seoTitle: "Secure .env Vault: Share Environment Variables Safely",
    metaDescription: "Share your .env files securely. Encrypted in your browser using AES-GCM before transmission.",
    intro: "Share sensitive .env files with your team using military-grade encryption in your browser. The server never sees your raw secrets.",
    cardDescription: "End-to-End encrypted .env sharing.",
    sections: [
      {
        heading: "How it works",
        paragraphs: ["When you paste your .env file and enter a password, your browser generates a secure key using PBKDF2 and encrypts the file using AES-GCM. Only the encrypted blob is sent to our servers. When your teammate opens the link, the reverse happens on their machine. We literally cannot read your secrets."]
      }
    ],
    howTo: [
      "Paste your .env file into the Encrypt tab.",
      "Enter a strong password.",
      "Send the generated payload or link to your teammate.",
      "They use the Decrypt tab and the password to read the secrets."
    ],
    faq: [
      { q: "What happens if I lose the URL?", a: "The data is unrecoverable. Because the encryption key is never sent to the server, we cannot restore your access." }
    ],
    related: ["universal-config-sync"],
  },
  {
    slug: "secret-scanner",
    category: "Developer",
    name: "Universal Secret Scanner",
    seoTitle: "Secret Scanner: Check Code for Leaked API Keys",
    metaDescription: "Scan your source code and .env files locally for over 200 known secret patterns, including AWS, Stripe, and GitHub keys.",
    intro: "Never commit a secret again. Paste your code to scan for exposed API keys and sensitive tokens completely offline.",
    cardDescription: "Find leaked secrets in code before committing.",
    sections: [
      {
        heading: "Secure Your Code",
        paragraphs: ["Accidentally committing an AWS key or Stripe token can cost thousands of dollars. This tool runs 100% locally in your browser, using advanced regex patterns to identify over 200 types of credentials across multiple cloud providers."]
      }
    ],
    howTo: [
      "Paste your source code or configuration file.",
      "The tool immediately highlights any detected secrets.",
      "Remove or rotate the compromised secrets before pushing your code."
    ],
    faq: [
      { q: "Can I configure custom regex patterns?", a: "Yes, you can add custom patterns in the settings panel to detect internal company tokens." }
    ],
    related: ["env-vault"],
  },
  {
    slug: "api-load-tester",
    category: "Developer",
    name: "Shadow API Load Tester",
    seoTitle: "API Load Tester: Test Endpoint Performance Locally",
    metaDescription: "Test the rate limits, latency, and performance of your API endpoints directly from your browser.",
    intro: "Stress test your APIs instantly. Configure RPS and duration, and watch a real-time latency chart populate as your browser hammers the endpoint.",
    cardDescription: "Real-time API stress testing and latency charts.",
    sections: [
      {
        heading: "Browser-Based Stress Testing",
        paragraphs: ["Most load testing tools require complex CLI setup or paid subscriptions. Shadow API Load Tester uses your browser's fetch engine to send high-concurrency requests to your API, giving you instant visual feedback on latency spikes and rate limiting (429s)."]
      }
    ],
    howTo: [
      "Enter your API endpoint URL.",
      "Select the HTTP method.",
      "Configure the Requests per Second (RPS) and test duration.",
      "Click Start and monitor the real-time latency charts."
    ],
    faq: [
      { q: "Is it safe to run against production?", a: "WARNING: This tool can generate significant traffic. Only run tests against endpoints you own and have permission to stress test." }
    ],
    related: ["universal-config-sync"],
  },
  {
    slug: "docker-visualizer",
    category: "Developer",
    name: "Docker Architecture Visualizer",
    seoTitle: "Docker & Kubernetes Architecture Visualizer",
    metaDescription: "Paste your docker-compose.yml and instantly generate an interactive architecture diagram of your microservices.",
    intro: "Visualize complex microservice architectures instantly. Paste your docker-compose file to see a visual map of how your containers communicate, expose ports, and share volumes.",
    cardDescription: "Generate diagrams from docker-compose.yml.",
    sections: [
      {
        heading: "Instant Architecture Maps",
        paragraphs: ["Understanding a 500-line docker-compose file is tough. This tool parses the YAML directly in your browser and uses React Flow to draw an interactive map of your stack, showing dependencies, ports, and volumes at a glance."]
      }
    ],
    howTo: [
      "Paste your docker-compose.yml file into the editor.",
      "The canvas automatically renders nodes for each service.",
      "Arrows represent \"depends_on\" or \"links\" relationships between containers."
    ],
    faq: [
      { q: "Does it support Docker Compose v3 syntax?", a: "Yes, it fully supports version 2, 3, and the latest Compose Specification." }
    ],
    related: ["universal-config-sync"],
  },
  {
    slug: "sqlite-fiddle",
    category: "Developer",
    name: "In-Browser SQLite Fiddle",
    seoTitle: "Online SQLite Fiddle & Database Playground",
    metaDescription: "Write and execute SQL queries in a fully local SQLite database running entirely in your browser via WebAssembly.",
    intro: "Test SQL queries, create tables, and manipulate data instantly without installing anything. Powered by WebAssembly SQLite, everything runs offline in your browser.",
    cardDescription: "Run SQLite entirely in your browser via WASM.",
    sections: [
      {
        heading: "A Full Database in Your Browser",
        paragraphs: ["Sometimes you just need to test a complex JOIN or window function. Instead of spinning up a Docker container, this tool boots a real SQLite engine (sql.js) locally via WebAssembly. Your data never leaves your machine."]
      }
    ],
    howTo: [
      "Click 'Load Demo Data' to populate the database with a sample table.",
      "Write standard SQLite queries in the editor.",
      "Click 'Run Query' to view the results in the table below."
    ],
    faq: [
      { q: "Is the data saved when I refresh the page?", a: "No, the database runs in memory. If you refresh, all data is lost. Make sure to export your DB if you want to keep it." },
      { q: "Can I load an existing database?", a: "Yes, use the Import DB feature to load an existing .sqlite file into the WASM engine." }
    ],
    related: ["universal-config-sync"],
  },
  {
    slug: "code-to-image",
    category: "Developer",
    name: "Code to Image Generator",
    seoTitle: "Code to Image Generator: Create Beautiful Code Snippets | Castov",
    metaDescription: "Transform code snippets into gorgeous images with Mac OS window frames, custom gradient backgrounds, and instant PNG downloads for Twitter and presentations.",
    intro: "Turn your source code into beautiful, presentation-ready images with custom gradient backgrounds, Mac-style window controls, and syntax styling. 100% private and in-browser.",
    cardDescription: "Convert code snippets into beautiful images with gradients.",
    sections: [
      {
        heading: "Why Share Code as Images?",
        paragraphs: [
          "Posting plain text snippets on social networks like X (Twitter), LinkedIn, or Discord often destroys code indentation and syntax highlighting.",
          "Our in-browser canvas renderer converts any code into high-DPI retina PNG screenshots styled with modern frosted backgrounds and terminal headers."
        ]
      }
    ],
    howTo: [
      "Paste your code into the editor pane.",
      "Choose a background gradient theme (Midnight, Cyberpunk, Sunset, Matrix, or Carbon).",
      "Set your file title and padding.",
      "Click Download PNG or Copy Image to Clipboard."
    ],
    faq: [
      { q: "Is my code uploaded to any external server?", a: "Never. All image rendering is calculated directly on an HTML5 Canvas inside your browser." },
      { q: "What format does it export?", a: "It exports high-resolution 2x Retina PNG images suitable for retina screens and print." }
    ],
    related: ["diff-checker", "json-to-ts", "universal-config-sync"]
  },
  {
    slug: "glassmorphism-generator",
    category: "Developer",
    name: "CSS Glassmorphism Generator",
    seoTitle: "CSS Glassmorphism & Frosted Glass Generator | Castov",
    metaDescription: "Generate modern CSS and Tailwind frosted glass UI effects with customizable blur, opacity, border, and shadows in real-time.",
    intro: "Design stunning frosted glass UI components in real time. Customize blur, background opacity, border styling, and copy ready-to-use Tailwind CSS or Pure CSS with one click.",
    cardDescription: "Generate frosted glass UI styles in CSS & Tailwind.",
    sections: [
      {
        heading: "The Power of Modern Glassmorphism",
        paragraphs: [
          "Glassmorphism relies on the CSS backdrop-filter property to blur the layers beneath an element, mimicking translucent frosted glass.",
          "It adds depth, hierarchy, and modern aesthetics to dark and light dashboard interfaces, modals, and landing page cards."
        ]
      }
    ],
    howTo: [
      "Adjust the blur intensity, background opacity, and border radius using the sliders.",
      "Observe the real-time preview over dynamic vibrant gradients.",
      "Select your output format (Tailwind CSS or Pure CSS).",
      "Click Copy Code and paste into your project."
    ],
    faq: [
      { q: "Does backdrop-filter work in all modern browsers?", a: "Yes, backdrop-filter is fully supported in Chromium browsers, Safari, Firefox, and Edge with hardware acceleration." },
      { q: "Can I use this with Tailwind CSS?", a: "Yes, our generator provides copyable Tailwind utility classes including arbitrary value syntax for exact blur and opacity matching." }
    ],
    related: ["code-to-image", "universal-config-sync"]
  },
  {
    slug: "github-readme-generator",
    category: "Developer",
    name: "GitHub README Builder",
    seoTitle: "GitHub Profile & Repo README Builder | Castov",
    metaDescription: "Generate viral, dynamic GitHub profile READMEs with skill badges, animated stats, and tech stacks.",
    intro: "Create viral, eye-catching GitHub profile READMEs with live shields.io badges, dynamic stat cards, streaks, and custom Markdown in seconds.",
    cardDescription: "Build dynamic GitHub profile READMEs with badges and live stats.",
    sections: [
      {
        heading: "Crafting Standout GitHub Profiles",
        paragraphs: [
          "Your GitHub profile is your open-source resume. Having a well-structured README with verified tech stack badges, GitHub streaks, and clean markdown boosts credibility with recruiters and collaborators."
        ]
      }
    ],
    howTo: [
      "Fill in your name, bio, and social handles.",
      "Select your technologies to generate shields.io badges.",
      "Pick your preferred theme for GitHub stats widgets.",
      "Click 'Copy README.md' and paste into your special GitHub repo."
    ],
    faq: [
      { q: "How do I create a GitHub Profile README?", a: "Create a new public repository with the exact same name as your GitHub username, initialize it with a README.md file, and paste your generated markdown." }
    ],
    related: ["code-to-image", "app-mockup", "diff-checker"]
  },
  {
    slug: "app-mockup",
    category: "Developer",
    name: "App & Screenshot Mockup Studio",
    seoTitle: "Device & Screenshot Mockup Studio: Mac, iPhone, Chrome | Castov",
    metaDescription: "Turn ordinary UI screenshots into 3D framed device mockups for Mac, iPhone, and Chrome in seconds.",
    intro: "Transform ordinary UI screenshots into stunning, high-converting product mockups inside browser, laptop, and phone frames with rich 3D gradients and realistic drop shadows.",
    cardDescription: "Turn screenshots into 3D framed device mockups for Mac and iPhone.",
    sections: [
      {
        heading: "High-Converting Screenshot Mockups",
        paragraphs: [
          "Present your software and web designs in realistic device frames with custom gradients and natural shadows, perfect for Product Hunt and Twitter announcements."
        ]
      }
    ],
    howTo: [
      "Upload your app screenshot.",
      "Select a device frame (Browser, Laptop, or Phone).",
      "Pick a gradient atmosphere and adjust canvas padding.",
      "Click Export High-Res PNG to download your graphic."
    ],
    faq: [
      { q: "Are images uploaded to any server?", a: "No, all mockup rendering happens 100% locally on your computer inside your browser via HTML5 Canvas." }
    ],
    related: ["code-to-image", "github-readme-generator", "glassmorphism-generator"]
  },
  {
    slug: "favicon-generator",
    category: "Developer",
    name: "Favicon & App Icon Generator",
    seoTitle: "Favicon & App Icon Generator: Full Multi-Size Icon Sets | Castov",
    metaDescription: "Create complete web and mobile favicon packages (16x16, 32x32, 180x180, PWA) from any image or logo.",
    intro: "Convert any image or brand logo into complete favicon packages for modern browsers, Apple iOS devices, and Android PWAs with HTML meta tags.",
    cardDescription: "Generate multi-size favicon packages and HTML head tags.",
    sections: [
      {
        heading: "Complete Browser & Mobile Icon Sets",
        paragraphs: [
          "Generate perfectly formatted favicons for Google search results, Safari bookmarks, Apple home screens, and Android PWAs with zero quality loss."
        ]
      }
    ],
    howTo: [
      "Upload your brand logo or icon.",
      "Customize padding and background transparency.",
      "Download individual icon sizes or copy the HTML header tags.",
      "Drop the generated files into your project public directory."
    ],
    faq: [
      { q: "What sizes are required for modern websites?", a: "Modern websites need 16x16 and 32x32 PNGs for tabs, 180x180 for iOS Apple Touch Icons, and 192x192/512x512 for Progressive Web Apps." }
    ],
    related: ["app-mockup", "color-converter", "code-to-image"]
  },
  {
    slug: "color-converter",
    category: "Developer",
    name: "Color Code Converter & Palette Studio",
    seoTitle: "Color Code Converter: HEX, RGB, HSL, RGBA, Tailwind | Castov",
    metaDescription: "Convert HEX, RGB, HSL, RGBA, and CSS variables instantly with live previews and Tailwind tokens.",
    intro: "Fast, accurate color converter between HEX, RGB, RGBA, HSL, and Tailwind CSS arbitrary classes with real-time contrast feedback.",
    cardDescription: "Convert colors between HEX, RGB, HSL, and Tailwind CSS tokens.",
    sections: [
      {
        heading: "Precision Color Code Conversion",
        paragraphs: [
          "Effortlessly convert design system colors between HEX, RGB, HSL, and Tailwind CSS arbitrary values with instant clipboard copying."
        ]
      }
    ],
    howTo: [
      "Pick a color with the picker or type any valid HEX code.",
      "View instant synchronized conversions across HEX, RGB, HSL, and Tailwind.",
      "Click the copy icon on any format to copy to your clipboard."
    ],
    faq: [
      { q: "Can I convert directly to Tailwind CSS?", a: "Yes, the tool outputs Tailwind arbitrary value classes like bg-[#6366f1] ready to paste into JSX." }
    ],
    related: ["glassmorphism-generator", "favicon-generator", "code-to-image"]
  },
  {
    slug: "token-visualizer",
    category: "Developer",
    name: "LLM Token & Cost Visualizer",
    seoTitle: "LLM Token & Cost Visualizer: OpenAI, Claude, Gemini | Castov",
    metaDescription: "Estimate BPE tokenization and calculate real-time API costs across OpenAI, Anthropic, Google, and DeepSeek models instantly.",
    intro: "Understand and visualize how large language models segment text into tokens. Compare real-time API pricing across GPT-4o, Claude 3.5 Sonnet, Gemini 1.5, and DeepSeek V3 in seconds.",
    cardDescription: "Visualize BPE tokens and calculate real-time LLM API costs.",
    sections: [
      {
        heading: "Mastering LLM Tokenization and API Budgeting",
        paragraphs: [
          "Every modern AI model processes text as tokens rather than whole words. Punctuation, whitespace, and programming code fragments can inflate your token usage unexpectedly.",
          "Our visualizer breaks your prompt down into discrete segments and computes exact input and response costs for single queries and scaled production workloads."
        ]
      }
    ],
    howTo: [
      "Paste your prompt, system instructions, or code snippet into the editor.",
      "Select your target model (OpenAI, Anthropic, Google Gemini, or DeepSeek).",
      "Inspect the live BPE token breakdown and per-token character count.",
      "View estimated production costs and copy the formatted prompt."
    ],
    faq: [
      { q: "Is this tokenizer 100% accurate?", a: "It provides an accurate close-approximation of Byte-Pair Encoding (BPE) used across contemporary transformer models with zero network latency." }
    ],
    related: ["diff-checker", "json-to-ts", "code-to-image"]
  },
  {
    slug: "git-time-traveler",
    category: "Developer",
    name: "Git Disaster Recovery & Time-Traveler",
    seoTitle: "Git Disaster Recovery & Emergency Time-Traveler | Castov",
    metaDescription: "Recover lost commits, undo hard resets, purge leaked secrets, and fix Git merge conflicts safely with instant interactive commands.",
    intro: "Step-by-step interactive command generator to rescue your codebase from common Git disasters: accidental hard resets, committed API keys, wrong branches, and messy merge conflicts.",
    cardDescription: "Rescue lost commits, undo hard resets, and escape Git merge disasters.",
    sections: [
      {
        heading: "Never Panic in Git Again",
        paragraphs: [
          "Git's object database almost never deletes your work immediately. Using git reflog and commit pointer manipulation, you can rescue virtually any destroyed state without risking project history.",
          "Select your emergency and follow verified step-by-step commands tailored to get you back to a clean working state safely."
        ]
      }
    ],
    howTo: [
      "Select your specific Git disaster scenario from the cards above.",
      "Review the explanations to understand how Git handles the rescue under the hood.",
      "Copy individual terminal commands or click 'Copy Rescue Script'.",
      "Run the commands in your local project root."
    ],
    faq: [
      { q: "Does 'git reset --hard' truly delete uncommitted files?", a: "Uncommitted untracked files cannot be retrieved, but any commit that was ever created can be fully restored via 'git reflog' within 30 days." }
    ],
    related: ["diff-checker", "github-readme-generator", "universal-config-sync"]
  },
  {
    slug: "svg-animator",
    category: "Developer",
    name: "SVG Keyframe Animator & Studio",
    seoTitle: "SVG Keyframe Animator & CSS Motion Studio | Castov",
    metaDescription: "Generate hypnotic CSS keyframe stroke animations and Framer Motion code from raw SVG icons and logos with instant live previews.",
    intro: "Turn static SVG logos and icons into cinematic animations with stroke drawing, glowing pulses, and 3D hover effects. Export directly to Pure CSS or Framer Motion.",
    cardDescription: "Turn static SVG icons into animated CSS & Framer Motion vectors.",
    sections: [
      {
        heading: "Cinematic Vector Animation Made Effortless",
        paragraphs: [
          "Complex vector animations traditionally require heavy libraries or video exports. By leveraging CSS stroke-dasharray and keyframe filters, you achieve 60fps animations with zero overhead."
        ]
      }
    ],
    howTo: [
      "Paste your SVG markup or select a sample geometric logo.",
      "Choose an animation preset (Stroke Draw, Pulse Glow, Morph Spin, or Float).",
      "Adjust cycle duration and accent color in real time.",
      "Copy the generated CSS Keyframes or Framer Motion React code."
    ],
    faq: [
      { q: "Does this require external animation libraries?", a: "No, the output works with standard Pure CSS and Tailwind without any third-party dependencies." }
    ],
    related: ["code-to-image", "glassmorphism-generator", "favicon-generator"]
  },
  {
    slug: "mock-data-studio",
    category: "Developer",
    name: "Synthetic Mock Data Studio",
    seoTitle: "Synthetic Mock Data Studio: JSON, TypeScript, SQL | Castov",
    metaDescription: "Generate realistic synthetic seed data for users, e-commerce orders, SaaS metrics, and crypto transactions in JSON, TypeScript, and SQL.",
    intro: "Instant, realistic synthetic datasets for frontend prototyping and database seeding. Generate authentic user profiles, orders, SaaS metrics, and SQL insert statements in milliseconds.",
    cardDescription: "Generate realistic synthetic datasets in JSON, TypeScript, and SQL.",
    sections: [
      {
        heading: "Rapid Prototyping with Authentic Synthetic Data",
        paragraphs: [
          "Building frontend prototypes while waiting for backend APIs shouldn't stall your development velocity.",
          "Our client-side synthetic data studio produces rich, structured datasets with realistic timestamps, statuses, and relational IDs."
        ]
      }
    ],
    howTo: [
      "Pick your domain schema (Users, E-Commerce, SaaS Metrics, or Crypto Transactions).",
      "Select your record count from 5 up to 100 entries.",
      "Choose your export format (JSON, TypeScript types, or SQL Insert statements).",
      "Copy the payload or download the generated file."
    ],
    faq: [
      { q: "Is my data generated on a remote server?", a: "No, all synthetic data generation is executed client-side in your browser." }
    ],
    related: ["json-to-ts", "json-formatter", "diff-checker"]
  }
];

export const TOOL_SLUGS = TOOLS.map((t) => t.slug);

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolPath(slug: ToolSlug): string {
  return `/${slug}`;
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tool.related.map((s) => getTool(s)).filter((t): t is Tool => Boolean(t));
}
