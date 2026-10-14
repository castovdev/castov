export interface RegexToken {
  token: string;
  label: string;
  detail: string;
}

export interface RegexPattern {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: "Authentication & Security" | "Network & Web" | "Data & Formatting" | "Numbers & Finance" | "Code & Markup";
  pattern: string;
  flags: string;
  explanation: string;
  tokens: RegexToken[];
  validSamples: string[];
  invalidSamples: string[];
  faqs: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const REGEX_PATTERNS: RegexPattern[] = [
  // 1. Email Validation
  {
    slug: "email-validation",
    name: "Email Address Validation",
    title: "Email Validation Regex — RFC 5322 Compliant Regular Expression",
    description: "Standard, robust regular expression to validate email addresses including alphanumeric characters, dots, plus signs, and modern TLDs.",
    category: "Authentication & Security",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    flags: "",
    explanation: "Matches standard email formats with username, domain name, and at least a 2-character top-level domain.",
    tokens: [
      { token: "^", label: "Start of string", detail: "Ensures the match starts at the beginning of the text." },
      { token: "[a-zA-Z0-9._%+-]+", label: "Username / Local part", detail: "Matches 1 or more allowed email local-part characters." },
      { token: "@", label: "At symbol", detail: "Matches the literal @ separator." },
      { token: "[a-zA-Z0-9.-]+", label: "Domain name", detail: "Matches subdomain and main domain labels." },
      { token: "\\.", label: "Dot", detail: "Matches the literal period separator before the TLD." },
      { token: "[a-zA-Z]{2,}", label: "TLD", detail: "Matches top-level domain extensions of 2 or more letters." },
      { token: "$", label: "End of string", detail: "Ensures no extra trailing characters exist." },
    ],
    validSamples: ["user@example.com", "alex.smith+tag@company.co.uk", "support_dev@castov.io"],
    invalidSamples: ["user@", "plainaddress", "@domain.com", "user@domain.c"],
    faqs: [
      { q: "Does this regex support internationalized domain names (IDN)?", a: "This regex validates ASCII domains. For full IDN / Unicode support, punycode encoding or Unicode property escapes (\\p{L}) should be used." },
      { q: "Is RFC 5322 regex strictly recommended?", a: "The official RFC 5322 regex is hundreds of characters long. This battle-tested standard pattern covers 99.9% of real-world emails effectively." },
    ],
    relatedSlugs: ["username-alphanumeric", "url-http-https", "domain-name"],
  },

  // 2. Strong Password
  {
    slug: "strong-password",
    name: "Strong Password Policy",
    title: "Strong Password Regex — Enforce Uppercase, Lowercase, Number & Symbol",
    description: "Enforces minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    category: "Authentication & Security",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$",
    flags: "",
    explanation: "Uses positive lookaheads to enforce password complexity without consuming characters.",
    tokens: [
      { token: "^", label: "Start", detail: "Starts at string beginning." },
      { token: "(?=.*[a-z])", label: "Lowercase Lookahead", detail: "Requires at least one lowercase character." },
      { token: "(?=.*[A-Z])", label: "Uppercase Lookahead", detail: "Requires at least one uppercase character." },
      { token: "(?=.*\\d)", label: "Digit Lookahead", detail: "Requires at least one number." },
      { token: "(?=.*[@$!%*?&#])", label: "Symbol Lookahead", detail: "Requires at least one special symbol." },
      { token: "[A-Za-z\\d@$!%*?&#]{8,}", label: "Length & Allowed Set", detail: "Matches allowed character set with minimum 8 length." },
      { token: "$", label: "End", detail: "Ends at string finish." },
    ],
    validSamples: ["P@ssw0rd2026", "Secure#Key19", "C@st0vMaster!"],
    invalidSamples: ["password", "Password1", "Pass!", "short1A!"],
    faqs: [
      { q: "Can I increase the minimum length to 12?", a: "Yes, change `{8,}` at the end of the pattern to `{12,}`." },
    ],
    relatedSlugs: ["email-validation", "jwt-token", "username-alphanumeric"],
  },

  // 3. URL HTTP / HTTPS
  {
    slug: "url-http-https",
    name: "HTTP & HTTPS URL Validation",
    title: "URL Regex — Match HTTP & HTTPS Web Addresses with Query Strings",
    description: "Matches fully qualified URLs starting with http:// or https://, including subdomains, paths, ports, and query parameters.",
    category: "Network & Web",
    pattern: "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}(?:\\.[a-zA-Z0-9()]{1,6})?(?::[0-9]{1,5})?\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$",
    flags: "i",
    explanation: "Validates secure and unsecure HTTP web addresses with optional query strings, paths, and anchors.",
    tokens: [
      { token: "^https?:\\/\\/", label: "Protocol", detail: "Matches http:// or https://." },
      { token: "(?:www\\.)?", label: "Optional www", detail: "Non-capturing group matching www. if present." },
      { token: "[-a-zA-Z0-9@:%._\\+~#=]{1,256}", label: "Domain Host", detail: "Valid domain host characters up to 256 chars." },
      { token: "(?:\\.[a-zA-Z0-9()]{1,6})?", label: "TLD", detail: "Matches optional dot and TLD suffix." },
      { token: "(?::[0-9]{1,5})?", label: "Port", detail: "Optional port number." },
      { token: "(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)", label: "Path & Query", detail: "Optional URI path, query params, and anchors." },
    ],
    validSamples: ["https://castov.com/convert", "http://localhost:3000/api?v=1", "https://sub.domain.org/path/to/page#section"],
    invalidSamples: ["ftp://files.com", "castov.com", "http:/bad.com", "https://"],
    faqs: [
      { q: "How to make the protocol optional?", a: "Wrap `https?:\\/\\/` into an optional group `(?:https?:\\/\\/)?`." },
    ],
    relatedSlugs: ["domain-name", "localhost-origin", "slug-url-friendly"],
  },

  // 4. Domain Name
  {
    slug: "domain-name",
    name: "Domain Name Matcher",
    title: "Domain Name Regex — Match FQDN and Hostnames",
    description: "Validates Fully Qualified Domain Names (FQDN) adhering to DNS hostname specification (RFC 1035).",
    category: "Network & Web",
    pattern: "^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$",
    flags: "",
    explanation: "Ensures each label is 1-63 chars long, doesn't start or end with a hyphen, and terminates with a valid TLD.",
    tokens: [
      { token: "^", label: "Start", detail: "Starts at string beginning." },
      { token: "[a-zA-Z0-9]", label: "First Char", detail: "DNS labels cannot start with hyphens." },
      { token: "[a-zA-Z0-9-]{0,61}", label: "Label Body", detail: "Allows letters, numbers, and interior hyphens." },
      { token: "\\.", label: "Dot separator", detail: "Separates DNS subdomain and domain labels." },
      { token: "[a-zA-Z]{2,}$", label: "TLD Suffix", detail: "Top-level domain of at least 2 characters." },
    ],
    validSamples: ["castov.com", "api.v2.service.cloud", "my-awesome-domain.org"],
    invalidSamples: ["-bad.com", "domain..com", "invalid_char.com", "test.c"],
    faqs: [
      { q: "Are underscores allowed in domain names?", a: "Standard hostnames do not permit underscores; only DNS records like SRV or DKIM use underscores." },
    ],
    relatedSlugs: ["url-http-https", "ipv4-address", "localhost-origin"],
  },

  // 5. IPv4 Address
  {
    slug: "ipv4-address",
    name: "IPv4 Address Validator",
    title: "IPv4 Regex — Validate 0-255 Decimal Octets with CIDR Support",
    description: "Strictly validates IPv4 addresses ensuring each octet is within the valid 0 to 255 numerical range.",
    category: "Network & Web",
    pattern: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    flags: "",
    explanation: "Checks four dot-separated octets ensuring numbers never exceed 255.",
    tokens: [
      { token: "25[0-5]", label: "Range 250-255", detail: "Matches 250 to 255." },
      { token: "2[0-4][0-9]", label: "Range 200-249", detail: "Matches 200 to 249." },
      { token: "[01]?[0-9][0-9]?", label: "Range 0-199", detail: "Matches 0 to 199." },
      { token: "\\.", label: "Dot delimiter", detail: "Matches period separating octets." },
      { token: "{3}", label: "Repeat 3 times", detail: "Repeats octet and dot for the first 3 groups." },
    ],
    validSamples: ["192.168.1.1", "10.0.0.254", "127.0.0.1", "255.255.255.0"],
    invalidSamples: ["256.1.1.1", "192.168.1", "192.168.1.1.1", "1.2.3.999"],
    faqs: [
      { q: "How to add CIDR subnet support?", a: "Append `(?:\\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$` to allow `/24`, `/16`, etc." },
    ],
    relatedSlugs: ["ipv6-address", "mac-address", "domain-name"],
  },

  // 6. IPv6 Address
  {
    slug: "ipv6-address",
    name: "IPv6 Address Validator",
    title: "IPv6 Regex — Validate Hexadecimal IPv6 Addresses & Compactions",
    description: "Matches standard 8-group IPv6 addresses as well as compressed double-colon (::) formats.",
    category: "Network & Web",
    pattern: "^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$",
    flags: "i",
    explanation: "Matches 8 hex hextets separated by colons, including common loopback and unassigned forms.",
    tokens: [
      { token: "[0-9a-fA-F]{1,4}", label: "Hextet", detail: "Matches 1 to 4 hexadecimal digits." },
      { token: ":", label: "Colon", detail: "Delimiter separating hextets." },
      { token: "{7}", label: "Repeat 7 times", detail: "Requires first seven groups with colons." },
    ],
    validSamples: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334", "fe80:0000:0000:0000:0204:61ff:fe9d:f156", "::1"],
    invalidSamples: ["1200::AB00:1234::2552:7777:1313", "192.168.1.1", "gggg:1234::1"],
    faqs: [
      { q: "Does this match full IPv6 RFC specification?", a: "Yes, covers full 8-group addresses and standard local loopback addresses." },
    ],
    relatedSlugs: ["ipv4-address", "mac-address", "jwt-token"],
  },

  // 7. MAC Address
  {
    slug: "mac-address",
    name: "MAC Address Matcher",
    title: "MAC Address Regex — Colon and Hyphen Hardware Addresses",
    description: "Matches 6-byte IEEE 802 Media Access Control (MAC) hardware addresses with colons or hyphens.",
    category: "Network & Web",
    pattern: "^(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})$",
    flags: "",
    explanation: "Validates six pairs of hexadecimal characters separated by colons or hyphens.",
    tokens: [
      { token: "[0-9A-Fa-f]{2}", label: "Hex byte", detail: "Two hexadecimal digits." },
      { token: "[:-]", label: "Separator", detail: "Either a colon or a hyphen." },
      { token: "{5}", label: "Repeat 5 times", detail: "Matches first five separated bytes." },
    ],
    validSamples: ["00:1A:2B:3C:4D:5E", "a1-b2-c3-d4-e5-f6", "FF:FF:FF:FF:FF:FF"],
    invalidSamples: ["00:1A:2B:3C:4D", "00:1A:2B:3C:4D:5E:6F", "00:1Z:2B:3C:4D:5E"],
    faqs: [
      { q: "How to support Cisco format (xxxx.xxxx.xxxx)?", a: "Use `^(?:[0-9A-Fa-f]{4}\\.){2}[0-9A-Fa-f]{4}$`." },
    ],
    relatedSlugs: ["ipv4-address", "ipv6-address", "uuid-v4"],
  },

  // 8. JWT Token
  {
    slug: "jwt-token",
    name: "JSON Web Token (JWT)",
    title: "JWT Regex — Validate Base64URL Encoded Header, Payload & Signature",
    description: "Validates standard 3-part JSON Web Tokens (Header.Payload.Signature) in Base64URL encoding.",
    category: "Authentication & Security",
    pattern: "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$",
    flags: "",
    explanation: "Checks three dot-separated Base64URL character sequences corresponding to JWT structure.",
    tokens: [
      { token: "^[A-Za-z0-9_-]+", label: "Header", detail: "Base64URL encoded JSON header." },
      { token: "\\.", label: "Dot separator", detail: "Separator between header and payload." },
      { token: "[A-Za-z0-9_-]+", label: "Payload", detail: "Base64URL encoded JSON claims." },
      { token: "\\.", label: "Dot separator", detail: "Separator between payload and signature." },
      { token: "[A-Za-z0-9_-]+$", label: "Signature", detail: "Cryptographic HMAC or RSA signature." },
    ],
    validSamples: [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    ],
    invalidSamples: ["invalid.jwt", "header.payload", "a.b.c.d"],
    faqs: [
      { q: "Does regex verify signature validity?", a: "No, regex only validates token structure. Cryptographic verification requires secret key parsing." },
    ],
    relatedSlugs: ["base64-string", "uuid-v4", "strong-password"],
  },

  // 9. UUID v4
  {
    slug: "uuid-v4",
    name: "UUID v4 Identifier",
    title: "UUID v4 Regex — Validate 128-bit RFC 4122 Canonical UUIDs",
    description: "Strictly matches version 4 UUIDs with 36 canonical characters including hyphens and version bit 4.",
    category: "Data & Formatting",
    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
    flags: "",
    explanation: "Ensures the 3rd section starts with 4 (version) and the 4th section starts with 8, 9, a, or b (variant 1).",
    tokens: [
      { token: "[0-9a-fA-F]{8}", label: "Time-low", detail: "8 hexadecimal characters." },
      { token: "[0-9a-fA-F]{4}", label: "Time-mid", detail: "4 hexadecimal characters." },
      { token: "4[0-9a-fA-F]{3}", label: "Version 4", detail: "Must start with literal digit 4 followed by 3 hex chars." },
      { token: "[89abAB][0-9a-fA-F]{3}", label: "Variant", detail: "Variant bits 8, 9, a, or b." },
      { token: "[0-9a-fA-F]{12}", label: "Node", detail: "Final 12 hexadecimal characters." },
    ],
    validSamples: ["c9bf9e57-1685-4c89-bafb-ff5af830be8a", "550e8400-e29b-41d4-a716-446655440000"],
    invalidSamples: ["c9bf9e57-1685-3c89-bafb-ff5af830be8a", "not-a-uuid", "550e8400-e29b-41d4-a716-44665544000"],
    faqs: [
      { q: "How to match any UUID version (v1-v5)?", a: "Replace `4[0-9a-fA-F]{3}` with `[1-5][0-9a-fA-F]{3}`." },
    ],
    relatedSlugs: ["git-commit-hash", "md5-hash", "sha256-hash"],
  },

  // 10. Slug (URL-Friendly)
  {
    slug: "slug-url-friendly",
    name: "URL Slug Matcher",
    title: "URL Slug Regex — Clean Kebab-Case Web Permalinks",
    description: "Matches lowercase alphanumeric strings separated by single hyphens, ideal for SEO permalinks.",
    category: "Data & Formatting",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    flags: "",
    explanation: "Enforces strictly lowercase letters and digits separated by hyphens without leading, trailing, or double dashes.",
    tokens: [
      { token: "^[a-z0-9]+", label: "Initial Word", detail: "Must begin with alphanumeric chars." },
      { token: "(?:-[a-z0-9]+)*$", label: "Hyphenated Words", detail: "Repeats a single hyphen followed by more alphanumeric chars." },
    ],
    validSamples: ["nextjs-developer-guide", "regex-101-cheat-sheet", "fast-api"],
    invalidSamples: ["-leading-dash", "trailing-dash-", "double--hyphen", "Upper-Case"],
    faqs: [
      { q: "Can slugs contain underscores?", a: "To permit underscores, use `^[a-z0-9]+(?:[-_][a-z0-9]+)*$`." },
    ],
    relatedSlugs: ["url-http-https", "username-alphanumeric", "semver-version"],
  },

  // 11. Username Alphanumeric
  {
    slug: "username-alphanumeric",
    name: "Alphanumeric Username",
    title: "Username Regex — 3 to 20 Characters with Letters, Digits & Underscores",
    description: "Standard web application username policy: 3 to 20 characters, starting with a letter, allowing underscores.",
    category: "Authentication & Security",
    pattern: "^[a-zA-Z][a-zA-Z0-9_]{2,19}$",
    flags: "",
    explanation: "Begins with an ASCII letter, followed by 2 to 19 alphanumeric characters or underscores.",
    tokens: [
      { token: "^[a-zA-Z]", label: "First Letter", detail: "Must start with a letter (no leading numbers or underscores)." },
      { token: "[a-zA-Z0-9_]{2,19}$", label: "Trailing Chars", detail: "2 to 19 characters total length 3-20." },
    ],
    validSamples: ["alex_dev", "sarah99", "CastovUser"],
    invalidSamples: ["9alex", "_user", "us", "this_username_is_way_too_long_for_policy"],
    faqs: [
      { q: "How to allow hyphens?", a: "Change character set to `[a-zA-Z0-9_-]`." },
    ],
    relatedSlugs: ["email-validation", "strong-password", "slug-url-friendly"],
  },

  // 12. International Phone (E.164)
  {
    slug: "international-phone-e164",
    name: "International Phone (E.164)",
    title: "E.164 Phone Regex — International ITU-T Compliant Phone Format",
    description: "Matches international standard phone numbers starting with a plus sign and 7 to 15 digits.",
    category: "Numbers & Finance",
    pattern: "^\\+[1-9]\\d{1,14}$",
    flags: "",
    explanation: "Follows ITU-T E.164 standard: begins with +, country code (1-9), followed by up to 14 digits.",
    tokens: [
      { token: "^\\+", label: "Leading Plus", detail: "Literal plus symbol indicating international prefix." },
      { token: "[1-9]", label: "Country Code start", detail: "First digit cannot be zero." },
      { token: "\\d{1,14}$", label: "Subscriber Number", detail: "1 to 14 subsequent digits." },
    ],
    validSamples: ["+14155552671", "+442071838750", "+971501234567"],
    invalidSamples: ["0014155552671", "+0123456", "14155552671", "+1415555267199999"],
    faqs: [
      { q: "What is E.164 standard?", a: "E.164 is the international telephone numbering plan that ensures worldwide routability." },
    ],
    relatedSlugs: ["us-phone-number", "iban-bank-account", "credit-card-visa-mastercard"],
  },

  // 13. US Phone Number
  {
    slug: "us-phone-number",
    name: "US Phone Number Format",
    title: "US Phone Regex — Match (555) 555-5555, 555-555-5555, and 10 Digits",
    description: "Flexible US phone number validator matching standard parentheses, hyphens, and spaces.",
    category: "Numbers & Finance",
    pattern: "^(?:\\+?1\\s*(?:[.-]\\s*)?)?(?:\\(\\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\\s*\\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\\s*(?:[.-]\\s*)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\\s*(?:[.-]\\s*)?([0-9]{4})$",
    flags: "",
    explanation: "Validates North American Numbering Plan (NANP) rules with area code and exchange restrictions.",
    tokens: [
      { token: "(?:\\+?1\\s*)?", label: "Optional Country Code", detail: "Optional +1 prefix for North America." },
      { token: "\\(\\s*...\\s*\\)", label: "Area Code", detail: "3-digit area code with optional parentheses." },
      { token: "[.-]?", label: "Delimiters", detail: "Optional dash, dot, or space separators." },
      { token: "[0-9]{4}$", label: "Line Number", detail: "Final 4-digit station number." },
    ],
    validSamples: ["(555) 234-5678", "555-234-5678", "+1 555 234 5678", "5552345678"],
    invalidSamples: ["123-456-7890", "555-012-3456", "555-5555"],
    faqs: [
      { q: "Why are area codes starting with 0 or 1 invalid?", a: "NANP rules specify that area codes must begin with digits 2 through 9." },
    ],
    relatedSlugs: ["international-phone-e164", "iban-bank-account", "credit-card-visa-mastercard"],
  },

  // 14. Credit Card (Visa & Mastercard)
  {
    slug: "credit-card-visa-mastercard",
    name: "Credit Card (Visa & Mastercard)",
    title: "Credit Card Regex — Validate Visa (13/16) and Mastercard (16) Numbers",
    description: "Detects Visa and Mastercard credit card format with optional space or hyphen delimiters.",
    category: "Numbers & Finance",
    pattern: "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|2(?:22[1-9]|2[3-9][0-9]|[3-6][0-9]{2}|7[01][0-9]|720)[0-9]{12})$",
    flags: "",
    explanation: "Matches Visa starting with 4 (13 or 16 digits) and Mastercard starting with 51-55 or 2221-2720 (16 digits).",
    tokens: [
      { token: "4[0-9]{12}(?:[0-9]{3})?", label: "Visa Format", detail: "Starts with 4, total 13 or 16 digits." },
      { token: "5[1-5][0-9]{14}", label: "Mastercard Legacy", detail: "Starts with 51-55, total 16 digits." },
      { token: "2[2-7]...[0-9]{12}", label: "Mastercard 2-Series", detail: "Starts with 2221-2720, total 16 digits." },
    ],
    validSamples: ["4111111111111111", "5500000000000004", "2221000000000000"],
    invalidSamples: ["378282246310005", "411111111111", "9999999999999999"],
    faqs: [
      { q: "Should I also run the Luhn algorithm?", a: "Yes, regex validates prefix and length format, but Luhn checksum validation confirms mathematical validity." },
    ],
    relatedSlugs: ["iban-bank-account", "us-phone-number", "hex-color-code"],
  },

  // 15. IBAN Bank Account
  {
    slug: "iban-bank-account",
    name: "IBAN Bank Account Matcher",
    title: "IBAN Regex — International Bank Account Number Validation",
    description: "Validates canonical IBAN structure: 2-letter country code, 2-digit checksum, and up to 30 alphanumeric characters.",
    category: "Numbers & Finance",
    pattern: "^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$",
    flags: "",
    explanation: "Conforms to ISO 13616 standard for international bank account representation.",
    tokens: [
      { token: "^[A-Z]{2}", label: "Country Code", detail: "Two-letter ISO 3166-1 alpha-2 code." },
      { token: "[0-9]{2}", label: "Check Digits", detail: "Two check digits calculated via mod 97." },
      { token: "[A-Z0-9]{4}", label: "Bank Code", detail: "Basic Bank Account Number (BBAN) prefix." },
      { token: "[0-9]{7}", label: "Account number", detail: "Standardized account digits." },
    ],
    validSamples: ["GB82WEST12345698765432", "DE89370400440532013000", "FR1420041010050500013M02606"],
    invalidSamples: ["1282WEST123456", "GB82WEST", "DE8937040044053201300099999999999"],
    faqs: [
      { q: "Does this regex allow spaces?", a: "Electronic IBANs must not contain spaces. For printed IBANs, strip whitespace prior to matching." },
    ],
    relatedSlugs: ["credit-card-visa-mastercard", "us-phone-number", "date-yyyy-mm-dd"],
  },

  // 16. Hex Color Code
  {
    slug: "hex-color-code",
    name: "Hexadecimal Color Code",
    title: "Hex Color Regex — 3, 6, and 8-Digit Hex CSS Colors with Hash",
    description: "Matches CSS hex colors in #RGB, #RRGGBB, and #RRGGBBAA (with alpha transparency) formats.",
    category: "Code & Markup",
    pattern: "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
    flags: "",
    explanation: "Matches leading # followed by 3, 6, or 8 hexadecimal digits.",
    tokens: [
      { token: "^#", label: "Hash Prefix", detail: "Literal # symbol." },
      { token: "[0-9a-fA-F]{3}", label: "3-digit shorthand", detail: "e.g., #fff for #ffffff." },
      { token: "[0-9a-fA-F]{6}", label: "6-digit standard", detail: "Full red, green, blue channels." },
      { token: "[0-9a-fA-F]{8}", label: "8-digit with Alpha", detail: "Adds 2-digit alpha channel for opacity." },
    ],
    validSamples: ["#ffffff", "#3B82F6", "#fff", "#10b98180"],
    invalidSamples: ["ffffff", "#ffff", "#1234567", "#zzzzzz"],
    faqs: [
      { q: "How to make the # optional?", a: "Change `^#` to `^#?`." },
    ],
    relatedSlugs: ["rgb-color", "html-tags", "semver-version"],
  },

  // 17. RGB Color
  {
    slug: "rgb-color",
    name: "RGB & RGBA CSS Color",
    title: "RGB / RGBA Regex — Validate CSS Functional Color Syntax",
    description: "Matches CSS rgb(r, g, b) and rgba(r, g, b, a) expressions with values between 0 and 255.",
    category: "Code & Markup",
    pattern: "^rgba?\\(\\s*(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\s*,\\s*(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\s*,\\s*(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\\s*,\\s*(?:0|1|0?\\.\\d+))?\\s*\\)$",
    flags: "i",
    explanation: "Checks 3 channels (0-255) and an optional alpha transparency channel (0.0 - 1.0).",
    tokens: [
      { token: "^rgba?\\(", label: "Function name", detail: "Matches rgb( or rgba(." },
      { token: "25[0-5]|...", label: "Color channels", detail: "Ensures R, G, B are strictly within 0 to 255." },
      { token: "(?:,\\s*(?:0|1|0?\\.\\d+))?", label: "Optional Alpha", detail: "Validates floating point alpha between 0 and 1." },
    ],
    validSamples: ["rgb(255, 0, 128)", "rgba(59, 130, 246, 0.5)", "rgb(0,0,0)"],
    invalidSamples: ["rgb(256, 0, 0)", "rgba(1, 2)", "rgb(100, 200, 300)"],
    faqs: [
      { q: "Does this match modern space-separated CSS colors?", a: "This regex targets comma-separated syntax widely used in legacy and modern stylesheets." },
    ],
    relatedSlugs: ["hex-color-code", "html-tags", "css-units"],
  },

  // 18. Date YYYY-MM-DD
  {
    slug: "date-yyyy-mm-dd",
    name: "ISO Date (YYYY-MM-DD)",
    title: "Date Regex — Validate ISO 8601 Calendar Dates (YYYY-MM-DD)",
    description: "Validates 4-digit year, 2-digit month (01-12), and 2-digit day (01-31) in ISO format.",
    category: "Data & Formatting",
    pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$",
    flags: "",
    explanation: "Validates structural date format with month 1-12 and day 1-31.",
    tokens: [
      { token: "^\\d{4}", label: "Year", detail: "Four-digit Gregorian calendar year." },
      { token: "0[1-9]|1[0-2]", label: "Month", detail: "Zero-padded month from 01 to 12." },
      { token: "0[1-9]|[12]\\d|3[01]", label: "Day", detail: "Zero-padded day of month from 01 to 31." },
    ],
    validSamples: ["2026-10-14", "1999-12-31", "2024-02-29"],
    invalidSamples: ["2026-13-01", "2026-00-15", "2026-04-32", "26-05-2026"],
    faqs: [
      { q: "Can regex detect leap years?", a: "Leap year calendar logic is best handled via JavaScript `Date` or `Temporal` APIs alongside regex." },
    ],
    relatedSlugs: ["time-24-hour", "iso-8601-datetime", "cron-expression-basic"],
  },

  // 19. Time 24-Hour
  {
    slug: "time-24-hour",
    name: "24-Hour Time Format (HH:mm:ss)",
    title: "24-Hour Time Regex — Validate Hours (00-23) and Minutes (00-59)",
    description: "Matches 24-hour military and standard timestamps in HH:mm or HH:mm:ss format.",
    category: "Data & Formatting",
    pattern: "^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$",
    flags: "",
    explanation: "Guarantees hours do not exceed 23 and minutes/seconds stay within 00-59.",
    tokens: [
      { token: "[01]\\d|2[0-3]", label: "Hours", detail: "00 to 23." },
      { token: ":[0-5]\\d", label: "Minutes", detail: "00 to 59." },
      { token: "(?::[0-5]\\d)?", label: "Optional Seconds", detail: "Optional 00 to 59." },
    ],
    validSamples: ["14:30", "23:59:59", "00:00:00", "08:15"],
    invalidSamples: ["24:00", "12:60", "25:10:00", "7:30"],
    faqs: [
      { q: "How to require seconds?", a: "Remove the `?` after `(?::[0-5]\\d)`." },
    ],
    relatedSlugs: ["date-yyyy-mm-dd", "iso-8601-datetime", "cron-expression-basic"],
  },

  // 20. ISO 8601 Datetime
  {
    slug: "iso-8601-datetime",
    name: "ISO 8601 Combined Timestamp",
    title: "ISO 8601 DateTime Regex — Full UTC and Timezone Offset Formats",
    description: "Matches ISO 8601 timestamps like 2026-10-14T22:30:00.000Z or with +/- timezone offsets.",
    category: "Data & Formatting",
    pattern: "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})$",
    flags: "",
    explanation: "Matches complete calendar date, literal 'T', time, optional fractional milliseconds, and UTC 'Z' or offset.",
    tokens: [
      { token: "\\d{4}-\\d{2}-\\d{2}", label: "Date", detail: "Year, month, and day." },
      { token: "T", label: "Separator", detail: "ISO date-time delimiter." },
      { token: "\\d{2}:\\d{2}:\\d{2}", label: "Time", detail: "Hours, minutes, seconds." },
      { token: "(?:\\.\\d+)?", label: "Milliseconds", detail: "Optional fractional seconds." },
      { token: "(?:Z|[+-]\\d{2}:\\d{2})", label: "Timezone", detail: "UTC marker 'Z' or explicit offset like +02:00." },
    ],
    validSamples: ["2026-10-14T22:30:00Z", "2026-10-14T15:00:00.123+01:00", "2024-01-01T00:00:00.000Z"],
    invalidSamples: ["2026-10-14 22:30:00", "2026-10-14T22:30:00", "2026-10-14T25:00:00Z"],
    faqs: [
      { q: "Is JavaScript Date.prototype.toISOString() output compliant?", a: "Yes, this regex directly validates strings generated by toISOString()." },
    ],
    relatedSlugs: ["date-yyyy-mm-dd", "time-24-hour", "cron-expression-basic"],
  },

  // 21. HTML Tags
  {
    slug: "html-tags",
    name: "HTML Tags Matcher & Stripper",
    title: "HTML Tags Regex — Match Opening, Closing & Self-Closing HTML Tags",
    description: "Matches HTML markup tags for sanitization, stripping, or token extraction.",
    category: "Code & Markup",
    pattern: "<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s+[^>]*?)?\\/?>",
    flags: "g",
    explanation: "Finds opening tags `<div class='x'>`, closing tags `</div>`, and self-closing tags `<img />`.",
    tokens: [
      { token: "<\\/?", label: "Tag start", detail: "Matches < or </." },
      { token: "[a-zA-Z][a-zA-Z0-9]*", label: "Tag name", detail: "Tag name starting with a letter." },
      { token: "(?:\\s+[^>]*?)?", label: "Attributes", detail: "Optional whitespace and attribute pairs." },
      { token: "\\/?>", label: "Tag close", detail: "Matches > or />." },
    ],
    validSamples: ["<p>", "<div class=\"hero\" id=\"main\">", "</span>", "<img src=\"logo.png\" alt=\"Logo\" />"],
    invalidSamples: ["hello world", "5 < 10", "x > y"],
    faqs: [
      { q: "Can regex safely parse nested HTML?", a: "For simple tag stripping, regex works well. For parsing complex nested DOM trees, a proper DOMParser is recommended." },
    ],
    relatedSlugs: ["markdown-links", "xss-script-tag", "hex-color-code"],
  },

  // 22. Markdown Links
  {
    slug: "markdown-links",
    name: "Markdown Links Parser",
    title: "Markdown Link Regex — Extract [Anchor Text](URL) Pairs",
    description: "Captures anchor text and target URL from Markdown link syntax `[text](url)`.",
    category: "Code & Markup",
    pattern: "\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s\\)]+)\\)",
    flags: "g",
    explanation: "Group 1 captures the human-readable link text; Group 2 captures the web hyperlink.",
    tokens: [
      { token: "\\[([^\\]]+)\\]", label: "Link Text Group", detail: "Captures everything inside square brackets." },
      { token: "\\((https?:\\/\\/[^\\s\\)]+)\\)", label: "URL Group", detail: "Captures HTTP/HTTPS web address inside parentheses." },
    ],
    validSamples: ["[Castov](https://castov.com)", "[Documentation](https://castov.com/tools)"],
    invalidSamples: ["plain text", "[unclosed link", "https://example.com"],
    faqs: [
      { q: "Does this match internal relative links?", a: "To allow relative links like `/convert`, use `\\[([^\\]]+)\\]\\(([^\\s\\)]+)\\)`." },
    ],
    relatedSlugs: ["html-tags", "url-http-https", "slug-url-friendly"],
  },

  // 23. YouTube Video ID
  {
    slug: "youtube-video-id",
    name: "YouTube Video ID Extractor",
    title: "YouTube Video ID Regex — Extract 11-Char ID from Any YouTube URL",
    description: "Extracts the unique 11-character video ID from watch?v=, youtu.be, shorts/, and embed/ links.",
    category: "Network & Web",
    pattern: "(?:youtu\\.be\\/|youtube\\.com\\/(?:embed\\/|v\\/|shorts\\/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})",
    flags: "",
    explanation: "Captures the standard 11-character base64-like alphanumeric video identifier.",
    tokens: [
      { token: "youtu\\.be\\/|youtube\\.com...", label: "URL Domain Prefix", detail: "Matches all standard YouTube domain variants." },
      { token: "([\\w-]{11})", label: "Video ID Group", detail: "Captures exact 11 alphanumeric and dash characters." },
    ],
    validSamples: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ"],
    invalidSamples: ["https://youtube.com", "https://youtube.com/feed/trending"],
    faqs: [
      { q: "Does this support YouTube Shorts?", a: "Yes, `shorts/` path is explicitly included in the prefix group." },
    ],
    relatedSlugs: ["url-http-https", "domain-name", "markdown-links"],
  },

  // 24. Semver Version
  {
    slug: "semver-version",
    name: "Semantic Version (SemVer 2.0)",
    title: "Semantic Version Regex — Match MAJOR.MINOR.PATCH with Pre-release",
    description: "Full SemVer 2.0.0 specification regex validating major, minor, patch, and optional pre-release/build tags.",
    category: "Code & Markup",
    pattern: "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
    flags: "",
    explanation: "Checks 3 non-negative integer numbers without leading zeros, plus optional pre-release and build metadata.",
    tokens: [
      { token: "(0|[1-9]\\d*)", label: "Major version", detail: "Non-negative integer without leading zeroes." },
      { token: "\\.(0|[1-9]\\d*)", label: "Minor version", detail: "Minor number component." },
      { token: "\\.(0|[1-9]\\d*)", label: "Patch version", detail: "Patch number component." },
      { token: "(?:-...", label: "Pre-release", detail: "Optional hyphen-separated tags like -alpha.1 or -beta." },
      { token: "(?:\\+...", label: "Build metadata", detail: "Optional plus-separated build hashes." },
    ],
    validSamples: ["1.0.0", "2.14.3-beta.1", "0.4.0+build.1882", "3.0.0-rc.2+sha.5114f85"],
    invalidSamples: ["1.0", "01.2.3", "v1.0.0", "1.2.3.4"],
    faqs: [
      { q: "How to permit leading 'v'?", a: "Prefix the pattern with `^v?`." },
    ],
    relatedSlugs: ["docker-image-tag", "git-commit-hash", "slug-url-friendly"],
  },

  // 25. Docker Image Tag
  {
    slug: "docker-image-tag",
    name: "Docker Image Name & Tag",
    title: "Docker Image Tag Regex — Match Registry, Repository & Tag Syntax",
    description: "Validates Docker image references such as repository/image:tag or standard official tags.",
    category: "Code & Markup",
    pattern: "^(?:(?=[^:\\/]{1,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?\\/)?(?:[a-z0-9]+(?:(?:(?:[._]|__|[-]*)[a-z0-9]+)+)?\\/)*[a-z0-9]+(?:(?:(?:[._]|__|[-]*)[a-z0-9]+)+)?(?::[\\w][\\w.-]{0,127})?$",
    flags: "",
    explanation: "Validates Docker registry domain, namespace, repository name, and optional :tag component.",
    tokens: [
      { token: "registry\/", label: "Optional Registry", detail: "Domain host like ghcr.io or docker.io." },
      { token: "repository", label: "Repository path", detail: "Namespace and image name." },
      { token: ":[\\w.-]{0,127}", label: "Tag", detail: "Alphanumeric tag up to 128 characters." },
    ],
    validSamples: ["nginx:alpine", "ghcr.io/org/service:v1.2.3", "node:20-slim", "redis:latest"],
    invalidSamples: [":latest", "repo:tag:extra", "-bad/name:tag"],
    faqs: [
      { q: "Is 'latest' matched automatically if omitted?", a: "Docker CLI defaults to 'latest' if tag is omitted; this regex marks `:tag` optional." },
    ],
    relatedSlugs: ["semver-version", "git-commit-hash", "env-variable-line"],
  },

  // 26. Cron Expression Basic
  {
    slug: "cron-expression-basic",
    name: "5-Field Cron Expression",
    title: "Cron Expression Regex — Validate Standard 5-Field Schedules",
    description: "Matches standard Unix crontab schedules (minute, hour, day of month, month, day of week).",
    category: "Data & Formatting",
    pattern: "^(?:\\*(?:\\/[0-9]+)?|[0-9,-\\/]+)\\s+(?:\\*(?:\\/[0-9]+)?|[0-9,-\\/]+)\\s+(?:\\*(?:\\/[0-9]+)?|[0-9,-\\/]+)\\s+(?:\\*(?:\\/[0-9]+)?|[0-9,-\\/]+|[a-zA-Z]{3})\\s+(?:\\*(?:\\/[0-9]+)?|[0-9,-\\/]+|[a-zA-Z]{3})$",
    flags: "",
    explanation: "Validates 5 whitespace-separated fields supporting asterisks, ranges, step values, and names.",
    tokens: [
      { token: "Field 1", label: "Minutes", detail: "0-59, *, */5, etc." },
      { token: "Field 2", label: "Hours", detail: "0-23, *, 12-18, etc." },
      { token: "Field 3", label: "Day of Month", detail: "1-31, *." },
      { token: "Field 4", label: "Month", detail: "1-12, JAN-DEC, *." },
      { token: "Field 5", label: "Day of Week", detail: "0-6 (Sun-Sat), MON-FRI, *." },
    ],
    validSamples: ["0 0 * * *", "*/15 * * * *", "30 4 1,15 * 5"],
    invalidSamples: ["0 0 * *", "* * * * * *", "every day"],
    faqs: [
      { q: "Does this match 6-field Quartz cron expressions?", a: "This is for the standard 5-field Unix crontab. Quartz includes a 6th field for seconds." },
    ],
    relatedSlugs: ["iso-8601-datetime", "time-24-hour", "date-yyyy-mm-dd"],
  },

  // 27. SQL Injection Detection
  {
    slug: "sql-injection-detection",
    name: "SQL Injection Detection Pattern",
    title: "SQL Injection Regex — Detect Malicious SQL Keywords & Tautologies",
    description: "Detects common SQL injection attempts including OR 1=1, UNION SELECT, comment dashes, and drops.",
    category: "Authentication & Security",
    pattern: "('(''|[^'])*')|(;\\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|UNION)\\b)|(\\b(OR|AND)\\b\\s+['\"\\d]+[=<>]+['\"\\d]+)|(--|#|\\/\\*)",
    flags: "i",
    explanation: "Detects quotes, stacked statements, boolean tautologies (OR 1=1), and SQL comment indicators.",
    tokens: [
      { token: "('(''|[^'])*')", label: "Quoted Literals", detail: "Detects SQL quote string injection." },
      { token: "(;\\s*SELECT|...)", label: "Stacked Queries", detail: "Detects semicolon followed by SQL command." },
      { token: "\\b(OR|AND)\\b\\s+...", label: "Boolean Tautologies", detail: "Detects 'OR 1=1' authentication bypass patterns." },
      { token: "(--|#|\\/\\*)", label: "SQL Comments", detail: "Detects inline comment characters used to neutralize queries." },
    ],
    validSamples: ["admin' OR '1'='1", "1; DROP TABLE users; --", "test' UNION SELECT username, password FROM users --"],
    invalidSamples: ["john.doe@example.com", "valid_search_term", "12345"],
    faqs: [
      { q: "Can regex fully prevent SQL Injection?", a: "No, parameterized queries (prepared statements) are the primary defense. Regex serves as a WAF layer." },
    ],
    relatedSlugs: ["xss-script-tag", "strong-password", "jwt-token"],
  },

  // 28. XSS Script Tag
  {
    slug: "xss-script-tag",
    name: "Cross-Site Scripting (XSS) Script Tag",
    title: "XSS Regex — Detect Script Tags and Inline Event Handlers",
    description: "Detects malicious `<script>` tags, javascript: pseudo-protocols, and inline event handlers (onload, onerror).",
    category: "Authentication & Security",
    pattern: "<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>|javascript:|on[a-z]+\\s*=",
    flags: "i",
    explanation: "Flags classic `<script>` blocks, inline event handlers like `onerror=alert(1)`, and `javascript:` URIs.",
    tokens: [
      { token: "<script...<\\/script>", label: "Script Tag Block", detail: "Matches entire script tag elements." },
      { token: "javascript:", label: "Pseudo-protocol", detail: "Detects script execution in href/src attributes." },
      { token: "on[a-z]+\\s*=", label: "Event Handlers", detail: "Matches onload=, onclick=, onerror=, etc." },
    ],
    validSamples: ["<script>alert('xss')</script>", "<img src=x onerror=alert(1)>", "<a href=\"javascript:evil()\">click</a>"],
    invalidSamples: ["hello world", "<p>Safe text</p>", "online banking"],
    faqs: [
      { q: "What is the best defense against XSS?", a: "HTML entity encoding and a robust Content Security Policy (CSP) headers." },
    ],
    relatedSlugs: ["sql-injection-detection", "html-tags", "strong-password"],
  },

  // 29. Whitespace Trim
  {
    slug: "whitespace-trim",
    name: "Leading & Trailing Whitespace",
    title: "Whitespace Trim Regex — Strip Leading and Trailing Whitespace",
    description: "Matches beginning and ending spaces, tabs, and newlines for string sanitization.",
    category: "Data & Formatting",
    pattern: "^\\s+|\\s+$",
    flags: "g",
    explanation: "Replaces leading `^\\s+` or trailing `\\s+$` characters with an empty string.",
    tokens: [
      { token: "^\\s+", label: "Leading Whitespace", detail: "Matches whitespace at string start." },
      { token: "|", label: "Or", detail: "Alternation operator." },
      { token: "\\s+$", label: "Trailing Whitespace", detail: "Matches whitespace at string end." },
    ],
    validSamples: ["  leading spaces", "trailing spaces   ", "   both ends   "],
    invalidSamples: ["no_spaces", "clean text with internal space"],
    faqs: [
      { q: "Is this equivalent to String.prototype.trim()?", a: "Yes, replacing this pattern with an empty string replicates trim()." },
    ],
    relatedSlugs: ["duplicate-words", "csv-line-parser", "slug-url-friendly"],
  },

  // 30. Duplicate Words
  {
    slug: "duplicate-words",
    name: "Duplicate Consecutive Words",
    title: "Duplicate Words Regex — Find and Remove Consecutive Repeated Words",
    description: "Finds repeated words separated by whitespace like 'the the' or 'is is' using backreferences.",
    category: "Data & Formatting",
    pattern: "\\b(\\w+)\\s+\\1\\b",
    flags: "gi",
    explanation: "Captures a word with `(\\w+)` and checks if it is immediately followed by the exact same word via `\\1`.",
    tokens: [
      { token: "\\b", label: "Word boundary", detail: "Prevents partial word matches." },
      { token: "(\\w+)", label: "Word Group", detail: "Captures word characters into group 1." },
      { token: "\\s+", label: "Whitespace", detail: "One or more spaces or linebreaks." },
      { token: "\\1", label: "Backreference", detail: "Matches the exact contents of group 1." },
    ],
    validSamples: ["the the company", "this is is great", "we we went"],
    invalidSamples: ["the company", "this is great", "very good"],
    faqs: [
      { q: "How to replace with a single instance?", a: "Use `str.replace(/\\b(\\w+)\\s+\\1\\b/gi, '$1')`." },
    ],
    relatedSlugs: ["whitespace-trim", "markdown-links", "html-tags"],
  },

  // 31. CSV Line Parser
  {
    slug: "csv-line-parser",
    name: "CSV Comma-Separated Line Parser",
    title: "CSV Parser Regex — Match Values with Quotes and Commas",
    description: "Splits a CSV line into fields respecting quotes around fields with embedded commas.",
    category: "Data & Formatting",
    pattern: "(?:^|,)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^,\"]*))",
    flags: "g",
    explanation: "Parses CSV fields supporting RFC 4180 escaped double quotes (`\"\"`).",
    tokens: [
      { token: "(?:^|,)", label: "Start or comma", detail: "Matches line start or delimiter." },
      { token: "\"([^\"]*...)\"", label: "Quoted value", detail: "Captures text enclosed in double quotes." },
      { token: "([^,\"]*)", label: "Unquoted value", detail: "Captures normal text without quotes or commas." },
    ],
    validSamples: ["\"John Doe\",28,\"Engineer, Lead\"", "1,2,3", "apple,\"green, sour\",true"],
    invalidSamples: ["broken\"quote"],
    faqs: [
      { q: "How does it handle escaped quotes?", a: "RFC 4180 specifies that double quotes inside quoted fields are represented as `\"\"`." },
    ],
    relatedSlugs: ["json-key-extractor", "whitespace-trim", "env-variable-line"],
  },

  // 32. JSON Key Extractor
  {
    slug: "json-key-extractor",
    name: "JSON Object Key Extractor",
    title: "JSON Key Regex — Extract All Object Keys from JSON Text",
    description: "Captures all property keys from JSON formatted strings using lookahead for the colon separator.",
    category: "Code & Markup",
    pattern: "\"([a-zA-Z_][a-zA-Z0-9_]*)\"\\s*:",
    flags: "g",
    explanation: "Matches double-quoted identifier strings followed immediately by a colon.",
    tokens: [
      { token: "\"", label: "Opening quote", detail: "Literal double quote." },
      { token: "([a-zA-Z_][a-zA-Z0-9_]*)", label: "Key Identifier", detail: "Captures standard property key." },
      { token: "\"\\s*:", label: "Colon separator", detail: "Trailing quote and JSON key delimiter." },
    ],
    validSamples: ["{\"id\": 10, \"name\": \"Castov\", \"active\": true}"],
    invalidSamples: ["[\"value1\", \"value2\"]"],
    faqs: [
      { q: "Does this match values in quotes?", a: "No, the trailing colon requirement ensures only object keys are matched." },
    ],
    relatedSlugs: ["csv-line-parser", "env-variable-line", "html-tags"],
  },

  // 33. Base64 String
  {
    slug: "base64-string",
    name: "Base64 Encoded String",
    title: "Base64 Regex — Validate Base64 Strings with Valid Padding",
    description: "Validates Base64 encoded data with proper 4-character padding multiples using = characters.",
    category: "Data & Formatting",
    pattern: "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
    flags: "",
    explanation: "Ensures string length is divisible by 4 and valid Base64 alphabet is followed with legal padding.",
    tokens: [
      { token: "[A-Za-z0-9+/]{4}", label: "Full 4-byte chunk", detail: "Standard Base64 alphabet." },
      { token: "[A-Za-z0-9+/]{2}==", label: "2-pad end", detail: "Valid ending with 2 padding equals." },
      { token: "[A-Za-z0-9+/]{3}=", label: "1-pad end", detail: "Valid ending with 1 padding equal." },
    ],
    validSamples: ["SGVsbG8gV29ybGQ=", "Y2FzdG92", "YW55IGNhcm5hbCBwbGVhc3VyZS4="],
    invalidSamples: ["SGVsbG8gV29ybGQ==", "Invalid#Characters", "SGVsbG8="],
    faqs: [
      { q: "What about Base64URL?", a: "For Base64URL, replace `+` and `/` with `-` and `_`." },
    ],
    relatedSlugs: ["jwt-token", "md5-hash", "sha256-hash"],
  },

  // 34. MD5 Hash
  {
    slug: "md5-hash",
    name: "MD5 Hash Checksum",
    title: "MD5 Hash Regex — Validate 32-Character Hexadecimal Hashes",
    description: "Matches 32-character hexadecimal MD5 hash checksum strings.",
    category: "Authentication & Security",
    pattern: "^[a-fA-F0-9]{32}$",
    flags: "",
    explanation: "MD5 hashes are exactly 128 bits represented as 32 hex digits.",
    tokens: [
      { token: "^", label: "Start", detail: "Beginning of string." },
      { token: "[a-fA-F0-9]{32}", label: "32 Hex Digits", detail: "Exact 32 hex characters." },
      { token: "$", label: "End", detail: "End of string." },
    ],
    validSamples: ["5d41402abc4b2a76b9719d911017c592", "098f6bcd4621d373cade4e832627b4f6"],
    invalidSamples: ["5d41402abc4b2a76b9719d911017c59", "5d41402abc4b2a76b9719d911017c592z"],
    faqs: [
      { q: "Is MD5 secure for password hashing?", a: "No, MD5 is cryptographically broken for security. Use bcrypt, Argon2, or SHA-256 for integrity verification." },
    ],
    relatedSlugs: ["sha256-hash", "git-commit-hash", "uuid-v4"],
  },

  // 35. SHA-256 Hash
  {
    slug: "sha256-hash",
    name: "SHA-256 Hash Checksum",
    title: "SHA-256 Hash Regex — Validate 64-Character Hexadecimal Hashes",
    description: "Matches 64-character hexadecimal SHA-256 cryptographic digest strings.",
    category: "Authentication & Security",
    pattern: "^[a-fA-F0-9]{64}$",
    flags: "",
    explanation: "SHA-256 digests are exactly 256 bits represented as 64 hex characters.",
    tokens: [
      { token: "^[a-fA-F0-9]{64}$", label: "64 Hex Digits", detail: "Exact 64 hex characters." },
    ],
    validSamples: ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    invalidSamples: ["e3b0c44298fc1c149afbf4c8996fb924", "invalid_hash_string"],
    faqs: [
      { q: "Where is SHA-256 used?", a: "Widely used in SSL/TLS certificates, Bitcoin blockchain, package integrity checksums, and git commits." },
    ],
    relatedSlugs: ["md5-hash", "git-commit-hash", "uuid-v4"],
  },

  // 36. Git Commit Hash
  {
    slug: "git-commit-hash",
    name: "Git Commit SHA-1 & SHA-256",
    title: "Git Commit Hash Regex — Short (7-Char) and Full (40-Char) Hashes",
    description: "Matches Git commit SHA hashes: 7-character short commit IDs or 40-character full SHA-1 hashes.",
    category: "Code & Markup",
    pattern: "^\\b([a-f0-9]{7}|[a-f0-9]{40})$",
    flags: "i",
    explanation: "Matches standard Git short hashes (7 hex chars) or complete repository commit hashes (40 hex chars).",
    tokens: [
      { token: "[a-f0-9]{7}", label: "Short Hash", detail: "Standard 7-char abbreviated Git commit." },
      { token: "[a-f0-9]{40}", label: "Full SHA-1", detail: "Full 40-char commit hash." },
    ],
    validSamples: ["7866615", "f21e094", "4b825dc642cb6eb9a060e54bf8d69288fbee4904"],
    invalidSamples: ["12345", "not-a-hash", "4b825dc642cb6eb9a060e54bf8d69288fbee4904z"],
    faqs: [
      { q: "Does Git support SHA-256?", a: "Yes, newer Git repositories support 64-char SHA-256 hashes." },
    ],
    relatedSlugs: ["sha256-hash", "md5-hash", "semver-version"],
  },

  // 37. .env Variable Line
  {
    slug: "env-variable-line",
    name: ".env Configuration Key-Value",
    title: ".env Variable Regex — Parse Environment Configuration Files",
    description: "Parses standard `.env` file entries matching uppercase snake_case keys and their string values.",
    category: "Code & Markup",
    pattern: "^([A-Z_][A-Z0-9_]*)=(.*)$",
    flags: "m",
    explanation: "Matches lines in dotenv files, splitting key name and value separated by an equals sign.",
    tokens: [
      { token: "([A-Z_][A-Z0-9_]*)", label: "Variable Key", detail: "Standard POSIX environment variable identifier." },
      { token: "=", label: "Assignment", detail: "Equals operator." },
      { token: "(.*)$", label: "Value", detail: "Raw configuration value." },
    ],
    validSamples: ["DATABASE_URL=postgres://localhost:5432/db", "NEXT_PUBLIC_API_KEY=xyz123", "PORT=3000"],
    invalidSamples: ["123_KEY=val", "=no_key"],
    faqs: [
      { q: "How to strip comments in .env files?", a: "Lines starting with `#` should be filtered out with `/^\\s*#/`." },
    ],
    relatedSlugs: ["json-key-extractor", "csv-line-parser", "docker-image-tag"],
  },

  // 38. Localhost Origin
  {
    slug: "localhost-origin",
    name: "Localhost Web Origin",
    title: "Localhost Regex — Match Localhost and 127.0.0.1 Ports",
    description: "Matches local development origins including http://localhost:PORT and 127.0.0.1 with ports 1024-65535.",
    category: "Network & Web",
    pattern: "^https?:\\/\\/(?:localhost|127\\.0\\.0\\.1)(?::[0-9]{1,5})?$",
    flags: "",
    explanation: "Matches local dev server origins for CORS and redirect URI whitelists.",
    tokens: [
      { token: "^https?:\\/\\/", label: "Protocol", detail: "http:// or https://." },
      { token: "(?:localhost|127\\.0\\.0\\.1)", label: "Host", detail: "Matches localhost or 127.0.0.1." },
      { token: "(?::[0-9]{1,5})?$", label: "Port", detail: "Optional port number up to 65535." },
    ],
    validSamples: ["http://localhost:3000", "http://127.0.0.1:8080", "https://localhost:443"],
    invalidSamples: ["http://castov.com", "ftp://localhost", "http://localhost:999999"],
    faqs: [
      { q: "Why use this in CORS middleware?", a: "Allows local development servers to call APIs without compromising production origins." },
    ],
    relatedSlugs: ["url-http-https", "domain-name", "ipv4-address"],
  },

  // 39. File Extension (Images)
  {
    slug: "file-extension-image",
    name: "Image File Extension Matcher",
    title: "Image Extension Regex — Match PNG, JPG, WebP, SVG & AVIF",
    description: "Matches filenames ending with common web image formats (png, jpg, jpeg, webp, svg, avif, gif).",
    category: "Data & Formatting",
    pattern: "\\.(jpe?g|png|gif|webp|svg|avif|ico|bmp)$",
    flags: "i",
    explanation: "Case-insensitive check for common image file extensions at string termination.",
    tokens: [
      { token: "\\.", label: "Period", detail: "Literal dot before extension." },
      { token: "(jpe?g|png...)", label: "Extension group", detail: "Allowed image format extensions." },
      { token: "$", label: "End of String", detail: "Ensures extension is at the end of filename." },
    ],
    validSamples: ["avatar.png", "hero-banner.webp", "icon.SVG", "photo.JPEG"],
    invalidSamples: ["document.pdf", "bundle.js", "style.css", "image.png.txt"],
    faqs: [
      { q: "How to match image URLs with query params?", a: "Change `$` to `(?:\\?.*)?$` to permit query strings." },
    ],
    relatedSlugs: ["html-tags", "slug-url-friendly", "url-http-https"],
  },

  // 40. Arabic Text Unicode
  {
    slug: "arabic-text-unicode",
    name: "Arabic Unicode Characters",
    title: "Arabic Regex — Match Arabic Letters, Diacritics & Numbers",
    description: "Matches Arabic script characters (Unicode block U+0600 to U+06FF) including letters, digits, and diacritics.",
    category: "Data & Formatting",
    pattern: "[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF]+",
    flags: "gu",
    explanation: "Captures Arabic Unicode blocks including basic Arabic, Arabic Supplement, and Arabic Extended-A.",
    tokens: [
      { token: "\\u0600-\\u06FF", label: "Arabic Main", detail: "Basic Arabic alphabet and numbers." },
      { token: "\\u0750-\\u077F", label: "Arabic Supplement", detail: "Extended letters." },
      { token: "\\u08A0-\\u08FF", label: "Arabic Extended-A", detail: "Additional non-standard Arabic glyphs." },
    ],
    validSamples: ["مرحبا بك في كاستوف", "برمجة السيو", "أداة المطورين 2026"],
    invalidSamples: ["Hello World", "12345", "TypeScript"],
    faqs: [
      { q: "Does this match Arabic diacritics (Harakat)?", a: "Yes, the U+0600-U+06FF block contains Fatha, Damma, Kasra, and Sukun." },
    ],
    relatedSlugs: ["whitespace-trim", "duplicate-words", "slug-url-friendly"],
  },
];

export function getPatternBySlug(slug: string): RegexPattern | undefined {
  return REGEX_PATTERNS.find((p) => p.slug === slug);
}
