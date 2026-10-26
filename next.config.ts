import type { NextConfig } from "next";

/**
 * Security headers that are safe for a fully static, script-light site.
 * A Content-Security-Policy is intentionally NOT set here yet: Next.js needs
 * nonce-based CSP for its inline bootstrap scripts, and Google AdSense will need
 * extra allowed hosts. Add a nonce-based CSP together with AdSense (see README).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.castov.com' }],
        destination: 'https://castov.com/:path*',
        permanent: true,
      },
      { source: '/unix', destination: '/unix-timestamp-converter', permanent: true },
      { source: '/regex-explainer', destination: '/regex-genetic-evolution', permanent: true },
      { source: '/timezones/UTC', destination: '/utc-converter', permanent: true },
      { source: '/timezones/:tz', destination: '/timezones', permanent: true },
      { source: '/ai/vercel-ai-sdk-generator', destination: '/ai/vercel-ai-sdk-code-generator', permanent: true },
      {
        source: '/tools/:tool',
        destination: '/:tool',
        permanent: true,
      }
    ];
  }
};

export default nextConfig;
