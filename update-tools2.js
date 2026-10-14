const fs = require('fs');
let txt = fs.readFileSync('src/content/tools.ts', 'utf8');

const contentMap = {
  "timezone-travel-simulator": {
    sections: '[\n      { heading: "Timezone Travel Simulator", paragraphs: ["When building global applications, you must test how your UI behaves when a user travels across timezones or when Daylight Saving Time (DST) kicks in.", "This simulator overrides your browser\'s native Intl.DateTimeFormat and Date APIs, allowing you to instantly \'teleport\' your browser to any timezone on Earth without changing your operating system settings."] }\n    ]',
    howTo: '[\n      "Select a target timezone from the world map or dropdown.",\n      "Click \'Teleport Browser\'.",\n      "Interact with your application in another tab; all JavaScript Date functions will behave as if you are physically in that timezone."\n    ]',
    faq: '[\n      { q: "Does this affect other browser tabs?", a: "No, the override is isolated to the current Service Worker scope or injected script execution context." }\n    ]'
  },
  "universal-config-sync": {
    sections: '[\n      { heading: "Universal Config Sync", paragraphs: ["Managing formatting tools across teams is chaos. Prettier, ESLint, EditorConfig, and TSConfig often conflict.", "Universal Config Sync analyzes your repository\'s existing configuration files and automatically generates a unified, conflict-free setup. It highlights contradictory rules (e.g., Prettier wanting single quotes while ESLint demands double quotes) and resolves them based on industry best practices."] }\n    ]',
    howTo: '[\n      "Upload or paste your package.json and existing config files.",\n      "The tool analyzes the AST of your configs.",\n      "Review the highlighted conflicts in the dashboard.",\n      "Download the unified, normalized configuration bundle."\n    ]',
    faq: '[\n      { q: "Does it support custom ESLint plugins?", a: "Yes, it cross-references standard plugin rulesets to prevent collisions." }\n    ]'
  },
  "zero-knowledge-env-vault": {
    sections: '[\n      { heading: "Zero-Knowledge .env Vault", paragraphs: ["Sharing .env files over Slack or email is a massive security risk. The Zero-Knowledge .env Vault allows you to encrypt environment variables in your browser.", "The data is encrypted using AES-GCM via the Web Crypto API. The server only stores the encrypted blob, and the decryption key remains entirely in the fragment of the URL, meaning our servers can never read your secrets."] }\n    ]',
    howTo: '[\n      "Paste your .env content into the vault.",\n      "The browser generates a strong AES key and encrypts the data locally.",\n      "Share the generated URL with your team.",\n      "When they open the URL, their browser extracts the key from the URL fragment (#) and decrypts the payload locally."\n    ]',
    faq: '[\n      { q: "What happens if I lose the URL?", a: "The data is unrecoverable. Because the encryption key is never sent to the server, we cannot restore your access." }\n    ]'
  },
  "universal-secret-scanner": {
    sections: '[\n      { heading: "Universal Secret Scanner", paragraphs: ["Committing API keys or AWS credentials to GitHub can cost thousands of dollars in minutes. The Universal Secret Scanner uses aggressive regex heuristics and Shannon entropy analysis to detect high-probability secrets in your code before you commit.", "It runs entirely in your browser using Web Workers, ensuring your proprietary code is never uploaded to an external server for analysis."] }\n    ]',
    howTo: '[\n      "Drag and drop a folder or file into the dropzone.",\n      "The Web Worker scans the files locally.",\n      "Review the list of flagged secrets, which are categorized by service (AWS, Stripe, GitHub, etc.) or high entropy.",\n      "Sanitize your files before committing."\n    ]',
    faq: '[\n      { q: "Can I configure custom regex patterns?", a: "Yes, you can add custom patterns in the settings panel to detect internal company tokens." }\n    ]'
  },
  "shadow-api-load-tester": {
    sections: '[\n      { heading: "Shadow API Load Tester", paragraphs: ["Stress testing usually requires complex CLI tools. The Shadow API Load Tester brings distributed load testing to the browser.", "By utilizing Web Workers and modern fetch APIs, it generates concurrent HTTP traffic against your staging environments to measure latency, throughput, and error rates in real-time with visual graphs."] }\n    ]',
    howTo: '[\n      "Enter the target API endpoint and HTTP method.",\n      "Configure headers, payload, and the number of concurrent virtual users (Workers).",\n      "Set the duration of the test.",\n      "Click \'Launch Test\' and monitor the live latency/throughput graphs."\n    ]',
    faq: '[\n      { q: "Is it safe to run against production?", a: "WARNING: This tool can generate significant traffic. Only run tests against endpoints you own and have permission to stress test." }\n    ]'
  },
  "docker-architecture-visualizer": {
    sections: '[\n      { heading: "Docker Architecture Visualizer", paragraphs: ["Understanding a complex microservices architecture from a docker-compose.yml file is tough.", "This tool parses your Docker Compose files and generates a beautiful, interactive node-graph visualization. It maps out services, networks, volumes, and port bindings, making it easy to spot isolated containers or misconfigured network bridges."] }\n    ]',
    howTo: '[\n      "Paste your docker-compose.yml content into the editor.",\n      "The tool instantly parses the YAML and renders a node graph.",\n      "Hover over nodes to see exposed ports and environment variables.",\n      "Drag nodes to rearrange the architectural layout."\n    ]',
    faq: '[\n      { q: "Does it support Docker Compose v3 syntax?", a: "Yes, it fully supports version 2, 3, and the latest Compose Specification." }\n    ]'
  },
  "sqlite-fiddle": {
    sections: '[\n      { heading: "In-Browser SQLite Fiddle", paragraphs: ["Testing SQL queries usually requires spinning up a local database or using a heavy IDE. The In-Browser SQLite Fiddle compiles the SQLite engine to WebAssembly (WASM), allowing it to run at near-native speeds directly in your browser.", "You can create tables, insert data, run complex joins, and export the database as a binary file—all without any backend server."] }\n    ]',
    howTo: '[\n      "Write your SQL commands (CREATE TABLE, INSERT, SELECT) in the Monaco editor.",\n      "Click \'Execute\' to run the queries against the local WASM database.",\n      "View the tabular results below.",\n      "Use \'Export DB\' to download your database state as a .sqlite file."\n    ]',
    faq: '[\n      { q: "Is the data saved when I refresh the page?", a: "No, the database runs in memory. If you refresh, all data is lost. Make sure to export your DB if you want to keep it." },\n      { q: "Can I load an existing database?", a: "Yes, use the \'Import DB\' feature to load an existing .sqlite file into the WASM engine." }\n    ]'
  }
};

for (const [slug, data] of Object.entries(contentMap)) {
  const parts = txt.split(`slug: "${slug}"`);
  if (parts.length > 1) {
    let block = parts[1];
    
    // Naively replace empty arrays
    block = block.replace(/sections:\s*\[\]/, `sections: ${data.sections}`);
    block = block.replace(/howTo:\s*\[\]/, `howTo: ${data.howTo}`);
    block = block.replace(/faq:\s*\[\]/, `faq: ${data.faq}`);
    
    parts[1] = block;
    txt = parts.join(`slug: "${slug}"`);
    console.log("Updated: " + slug);
  }
}

fs.writeFileSync("src/content/tools.ts", txt);
console.log("Done.");
