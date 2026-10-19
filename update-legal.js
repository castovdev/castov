const fs = require('fs');

// Update ABOUT
let aboutCode = fs.readFileSync('src/app/about/page.tsx', 'utf-8');
const contactInfo = `
      <h2>Who builds Castov?</h2>
      <p>
        Castov is maintained by <strong>Abdelmalik Benidir</strong> and the Castov Engineering team. We are passionate about creating privacy-first, blazing fast developer tools.
      </p>
      <p>
        If you have feedback, feature requests, or need support, reach out to us directly at: 
        <a href="mailto:support@castov.com" className="font-semibold text-link ml-1 hover:underline">support@castov.com</a>
      </p>
`;
aboutCode = aboutCode.replace(
  '      <h2>What we focus on</h2>',
  contactInfo + '\n      <h2>What we focus on</h2>'
);
fs.writeFileSync('src/app/about/page.tsx', aboutCode);

// Update CONTACT
let contactCode = fs.readFileSync('src/app/contact/page.tsx', 'utf-8');
const contactContent = `
      <p>
        We are always open to feedback, feature requests, or bug reports. Castov is actively maintained by <strong>Abdelmalik Benidir</strong>.
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:support@castov.com">support@castov.com</a></li>
        <li><strong>X (Twitter):</strong> <a href="https://x.com/castov_dev">@castov_dev</a></li>
        <li><strong>GitHub:</strong> <a href="https://github.com/castovdev">github.com/castovdev</a></li>
      </ul>
`;
contactCode = contactCode.replace(
  /<p>\s*Have a question, feedback, or need help\?[\s\S]*?<\/p>/m,
  contactContent
);
fs.writeFileSync('src/app/contact/page.tsx', contactCode);

// Update PRIVACY
let privacyCode = fs.readFileSync('src/app/privacy/page.tsx', 'utf-8');
const privacyUpdates = `
      <p><strong>Last Updated: October 2026</strong></p>
      <h2>Data Collection & Privacy</h2>
      <p>
        Castov is designed as a privacy-first suite of developer tools. The vast majority of our tools—including Time Converters, Regex Explainer, Env Vault, Docker Visualizer, and the AI Config Generators—operate <strong>100% locally in your browser</strong>. 
      </p>
      <ul>
        <li><strong>Local Execution:</strong> No code, logs, regex patterns, or API keys are ever transmitted to our servers.</li>
        <li><strong>Team Vaults:</strong> For our "Team Vault" feature, we use <strong>Zero-Knowledge Encryption</strong> (AES-GCM and RSA-OAEP). Your encrypted payload is stored in Supabase, but the decryption keys never leave your device. We cannot read your secrets.</li>
      </ul>
      
      <h2>Third-Party Services</h2>
      <p>
        To keep Castov free, we use <strong>Google AdSense</strong> to display relevant advertisements. Google AdSense may use cookies or web beacons to collect non-personal data (like your IP address or browser type) to personalize ads.
      </p>
`;
privacyCode = privacyCode.replace(
  /<h2>Information We Collect<\/h2>[\s\S]*?<h2>Cookies<\/h2>/m,
  privacyUpdates + '\n<h2>Cookies</h2>'
);
fs.writeFileSync('src/app/privacy/page.tsx', privacyCode);
