import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Castov Secret Shield Privacy Policy | Castov",
  description:
    "Official Privacy Policy for the Castov Secret Shield Chrome Extension: 100% offline secret scanning, zero network calls, and strict Content Security Policy.",
  path: "/privacy/secret-shield",
});

export default function SecretShieldPrivacyPage() {
  return (
    <StaticPage
      title="Castov Secret Shield — Privacy Policy"
      intro="Effective Date: November 14, 2026 • Commitment: 100% Offline, Zero Network Calls, Zero Telemetry, Zero Data Collection."
      crumbs={[
        { name: "Home", href: "/" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Castov Secret Shield" },
      ]}
      path="/privacy/secret-shield"
    >
      <h2>1. Core Principles</h2>
      <p>
        Castov Secret Shield is a Chrome Manifest V3 browser extension designed from the ground up for software developers and security engineers. Our architecture enforces privacy mathematically and at the browser policy level:
      </p>
      <ul>
        <li>
          <strong>Zero Network Connectivity:</strong> The extension has NO permission to make network requests. Its Content Security Policy strictly enforces <code>connect-src &apos;none&apos;</code>. It contains zero <code>fetch()</code>, <code>XMLHttpRequest</code>, <code>WebSocket</code>, <code>sendBeacon</code>, or external analytics scripts.
        </li>
        <li>
          <strong>Zero Plaintext Storage:</strong> The extension NEVER writes your secrets, tokens, clipboard contents, surrounding text, prompt bodies, or visited URLs to disk, <code>chrome.storage</code>, or logs.
        </li>
        <li>
          <strong>Local &amp; Ephemeral Processing:</strong> Secret detection and redaction occur entirely in-memory on your local machine using fast, linear-time regular expressions. Once the paste dialog is closed, the text in memory is discarded.
        </li>
      </ul>

      <h2>2. What Data Is Stored Locally?</h2>
      <p>
        The extension uses <code>chrome.storage.local</code> exclusively on your computer for:
      </p>
      <ul>
        <li>
          <strong>Aggregated Daily Counter:</strong> Stores only integer counts grouped by secret category per calendar date (for example, <code>{`{"2026-11-14": {"AWS_KEY": 2, "GITHUB_TOKEN": 1}}`}</code>). Entries older than 30 days are automatically deleted. No identifiers, no URLs, and no text are stored.
        </li>
        <li>
          <strong>User Preferences:</strong> Master on/off toggle (<code>enabled: true/false</code>), local counting toggle (<code>countingEnabled: true/false</code>), and per-site toggles (<code>{`siteToggles: { "chatgpt.com": true, ... }`}</code>).
        </li>
      </ul>
      <p>
        If you disable local counting in the extension popup, <strong>absolutely no counts are recorded</strong>.
      </p>

      <h2>3. Permissions &amp; Content Script Host Matches Requested &amp; Why</h2>
      <ul>
        <li>
          <strong><code>storage</code>:</strong> Used solely to persist your local toggle settings and the anonymous blocked counter on your device.
        </li>
        <li>
          <strong>Content Script Matches:</strong> Limited strictly to 11 verified AI chat domains across 6 AI platforms (to intercept paste and drop events in the capture phase and prevent accidental leaks of sensitive credentials into prompts without requesting broad <code>&lt;all_urls&gt;</code> permissions):
          <ol>
            <li><code>*://chatgpt.com/*</code> (OpenAI ChatGPT)</li>
            <li><code>*://chat.openai.com/*</code> (OpenAI ChatGPT Legacy)</li>
            <li><code>*://claude.ai/*</code> (Anthropic Claude)</li>
            <li><code>*://gemini.google.com/*</code> (Google Gemini)</li>
            <li><code>*://chat.deepseek.com/*</code> (DeepSeek Chat)</li>
            <li><code>*://deepseek.com/*</code> (DeepSeek Web)</li>
            <li><code>*://www.deepseek.com/*</code> (DeepSeek WWW)</li>
            <li><code>*://www.perplexity.ai/*</code> (Perplexity AI)</li>
            <li><code>*://copilot.microsoft.com/*</code> (Microsoft Copilot)</li>
            <li><code>*://copilot.cloud.microsoft/*</code> (Microsoft 365 Copilot)</li>
            <li><code>*://copilot.com/*</code> (Microsoft Copilot Consumer)</li>
          </ol>
        </li>
      </ul>

      <h2>4. What Is Strictly Forbidden in Our Codebase</h2>
      <ul>
        <li>NO <code>&lt;all_urls&gt;</code> permission.</li>
        <li>NO <code>clipboardRead</code> background permission (clipboard data is read exclusively within the active user <code>paste</code> or <code>drop</code> event).</li>
        <li>NO <code>webRequest</code>, <code>cookies</code>, <code>history</code>, <code>identity</code>, <code>tabs</code>, <code>activeTab</code>, or <code>contextMenus</code> permissions.</li>
        <li>NO dynamic evaluation (<code>eval</code>, <code>new Function</code>).</li>
        <li>NO remote code or CDN dependencies.</li>
        <li>NO analytics, telemetry, crash reporting, or user tracking.</li>
        <li>NO account registration, logins, or paid subscription upsells.</li>
      </ul>

      <h2>5. Open Source &amp; Auditability</h2>
      <p>
        The entire source code of Castov Secret Shield is auditable and verified by an automated bundle security test suite enforcing zero network calls and strict CSP rules. For questions or security disclosures, contact <a href="mailto:security@castov.com">security@castov.com</a>.
      </p>
    </StaticPage>
  );
}
