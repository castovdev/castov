import type { Metadata } from "next";
import { StaticPage } from "@/components/static-page";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy | Castov",
  description: "Detailed information on how Castov handles your data across our time tools, AI tools, BYOK vaults, and Cloud Sync features.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <StaticPage
      title="Privacy Policy"
      intro="Last updated: October 2026."
      crumbs={[{ name: "Home", href: "/" }, { name: "Privacy Policy" }]}
      path="/privacy"
    >
      <h2>Transparency First</h2>
      <p>
        At Castov, we believe developers should have absolute clarity on where their data goes. Time, date and converter tools do not upload your input to Castov servers. Some preferences, such as theme, custom time zones and selected models, are stored locally on your device. Some features use the network by design: Env Vault uploads an encrypted copy, P2P Ghost Tunnel uses a public STUN server for ICE/NAT discovery with manual token exchange, and Developer Canvas connects to public WebRTC signaling servers for peer-to-peer CRDT collaboration.
      </p>

      <h2>1. Features That Run in the Browser (Client-First)</h2>
      <p>
        The following tools process their primary user data locally in the browser. Some peer-to-peer features may still contact public STUN or signaling services to establish connections:
      </p>
      <ul>
        <li><strong>Data Visualization:</strong> JSON Viewer (3D Galaxy) and AST Conflict Telepathy.</li>
        <li><strong>Time & Utility:</strong> All Timestamp Converters, World Clocks, and Date tools.</li>
        <li><strong>Steganography & Crypto:</strong> Steganography Env Vault (AES-GCM encryption and hiding the result inside a PNG image) and the Secret Scanner. <em>Not</em> the Env Vault sharing tool: see section 4.</li>
        <li><strong>Compute & Web APIs:</strong> NexusGrid WebGPU Engine, Sonic-Gap Audio Bridge, and Quantum Simulator.</li>
        <li><strong>P2P Ghost Tunnel:</strong> Uses a public STUN server for ICE/NAT discovery with manual copy-paste token exchange—Castov does not operate a signaling server or store tunnel payloads.</li>
        <li><strong>Developer Canvas:</strong> Developer Canvas synchronizes workflow data directly between browser peers using WebRTC and Yjs CRDTs. Public community signaling servers are used only to coordinate the initial peer connection and may temporarily receive standard network connection metadata (such as IP addresses and ICE candidates) necessary to establish the peer handshake. By application design, these signaling servers never receive, process, or store workflow graphs, node configurations, or payload data.</li>
      </ul>

      <h2>2. Features That Store Data Locally</h2>
      <p>
        Some tools remember your preferences without uploading them.
      </p>
      <ul>
        <li><strong>What is stored:</strong> Custom Timezones, selected AI models, UI theme preferences, and your Master Password for local vaults.</li>
        <li><strong>Where it is stored:</strong> `localStorage` or `IndexedDB` on your specific device.</li>
        <li><strong>Protection:</strong> Local secrets are encrypted using the WebCrypto API (AES-GCM).</li>
      </ul>

      <h2>3. Features That Use External APIs (BYOK)</h2>
      <p>
        Our AI Hub (System Prompt Builders, Agent Designers) utilizes a "Bring Your Own Key" (BYOK) model.
      </p>
      <ul>
        <li><strong>API Key Storage:</strong> API keys you provide are stored strictly in your browser's local storage. They are never sent to Castov servers.</li>
        <li><strong>Data Transmission:</strong> Prompts, Context, and Keys are transmitted directly from your browser to the respective external provider (e.g., OpenAI, Anthropic, Vercel) over HTTPS.</li>
      </ul>

      <h2>4. Features That Send Data to Castov Servers (Account Required)</h2>
      <p>
        Features like <strong>Team Vaults</strong> require a Castov account:
      </p>
      <ul>
        <li><strong>What is uploaded:</strong> Authentication details (email, provider ID) and encrypted team vault records.</li>
        <li><strong>How synced data is protected:</strong> For Team Vaults, your `.env` variables are encrypted <strong>client-side</strong> before transmission. Castov servers store only the ciphertext. We cannot read your secrets.</li>
      </ul>

      <h3>Env Vault (secure .env sharing) is not a local tool</h3>
      <p>
        The <strong>Env Vault</strong> tool is the one tool on this site that is <strong>not</strong> zero-server. To let someone else open your file with a link, it uploads data to our servers:
      </p>
      <ul>
        <li><strong>What is uploaded:</strong> the encrypted payload only (a random salt, an initialization vector and the AES-GCM ciphertext). It is stored in our database, hosted on Supabase.</li>
        <li><strong>What is not uploaded:</strong> your plaintext `.env` contents and your password. Encryption happens in your browser, and the key is derived from your password with PBKDF2, so neither ever leaves your device. Share the password with your recipient through a different channel than the link.</li>
        <li><strong>What we can see:</strong> that a vault exists, its size, its creation time and an expiry timestamp (set to 7 days after creation), plus the standard request logs described in section 5. We cannot decrypt it.</li>
        <li><strong>Limits of this protection:</strong> the stored ciphertext is retrievable only by exact ID lookup via the sharing link (direct table listing is denied). Its security rests on your client-side encryption password: use a long, unique password and share it through a different channel than the link.</li>
      </ul>

      <h2>5. Server Logs, Analytics, and Backups</h2>
      <ul>
        <li><strong>Server Logs:</strong> Our infrastructure providers (Vercel, Supabase) log standard request metadata (IP address, user-agent, timestamp, URL path) for DDoS protection and debugging. These logs <strong>do not</strong> contain the payload data of your tools (e.g., the JSON you parse or the Regex you test).</li>
        <li><strong>Analytics & Error Tracking:</strong> We use Vercel Web Analytics for aggregate page-view statistics. We do not use session-recording tools (like Hotjar or LogRocket) to capture your screen, ensuring your proprietary code and JSON payloads remain private.</li>
        <li><strong>Backups:</strong> Cloud-synced user data is backed up automatically. If you delete your account, backups are purged within 30 days.</li>
      </ul>

      <h2>Contact Us</h2>
      <p>If you have any questions about your privacy or data, please contact us at <a href="mailto:support@castov.com">support@castov.com</a>.</p>
    </StaticPage>
  );
}
