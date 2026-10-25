# 🌟 Awesome MCP Servers Pull Request Template

Use this ready-to-submit data to add Castov to the official and largest MCP repository:
**Repository**: [punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

---

## 1. 📋 The Entry Line to Add

Navigate to section:
`### 💻 <a name="developer-tools"></a>Developer Tools`

Add this line in alphabetical order:

```markdown
- [castovdev/castov](https://github.com/castovdev/castov) [![castovdev/castov MCP server](https://glama.ai/mcp/servers/castovdev/castov/badges/score.svg)](https://glama.ai/mcp/servers/castovdev/castov) 📇 🏠 🍎 🪟 🐧 - Fast, privacy-first developer execution layer & offline toolkit: deterministic tools for EADDRINUSE port killing, IPv4 CIDR subnet calculation, cron schedules, cryptographic secret generation, local secret leak scanning, and JWT inspection.
```

### Legend Breakdown
- `📇` TypeScript / JavaScript codebase
- `🏠` Local Service (runs 100% locally via stdio, zero cloud leakage)
- `🍎` macOS compatible
- `🪟` Windows compatible
- `🐧` Linux compatible
- `Glama Badge` Grade A Certified score

---

## 2. 📝 Pull Request Details

### PR Title
```text
Add castov: Privacy-first developer execution layer & offline toolkit
```

### PR Description Body
```markdown
### What does this PR do?
Adds **Castov** (`castovdev/castov`) to the **Developer Tools** section.

### About Castov
- **Repository**: https://github.com/castovdev/castov
- **Scope**: Local stdio server (`npx -y castov mcp`)
- **Glama Grade A Score**: https://glama.ai/mcp/servers/castovdev/castov
- **Capabilities**:
  - `castov_port`: EADDRINUSE process inspector & killer.
  - `castov_cidr`: IPv4 subnet, wildcard mask, and usable host calculations.
  - `castov_cron`: Cron schedule explainer & execution prediction.
  - `castov_secret`: High-entropy CSPRNG key generator.
  - `castov_scan_secrets`: Local directory & git diff leak auditor.
  - `castov_jwt_decode`: Offline JWT header/payload/claim inspector.
  - `castov_timezone`: IANA timezone converter with DST transition tracking.

### Checklist
- [x] Follows the formatting conventions and alphabetical order.
- [x] Includes language (`📇`), scope (`🏠`), and OS tags (`🍎 🪟 🐧`).
- [x] Tested locally with Claude Desktop and Cursor.
```

---

## 3. 🚀 How to Submit in 30 Seconds via GitHub Web UI

1. Open this direct edit link in your browser:
   👉 **[https://github.com/punkpeye/awesome-mcp-servers/edit/main/README.md](https://github.com/punkpeye/awesome-mcp-servers/edit/main/README.md)**
2. Press `Ctrl + F` and search for: `### 💻 <a name="developer-tools"></a>Developer Tools`
3. Paste the markdown entry line under that section.
4. Scroll to the bottom ("Propose changes"), paste the PR Title and Description above, and click **Propose changes**.
5. Click **Create pull request**! 🎉
