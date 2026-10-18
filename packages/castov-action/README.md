# Castov GitHub Action 🛡️

Fast, 100% offline secret scanning, port verification, and environment validation right inside your GitHub Actions CI/CD workflows.

Powered by [Castov.com](https://castov.com) and the official `castov` CLI.

---

## 🚀 Quick Usage

Add this step to your `.github/workflows/ci.yml`:

```yaml
name: Security & Quality Check

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Scan Repository for Leaked Secrets
        uses: castovdev/castov-action@v1
        with:
          command: 'scan'
          args: '.'
```

---

## ⚙️ Inputs

| Input | Description | Default |
| :--- | :--- | :--- |
| `command` | The Castov command to execute (`scan`, `cidr`, `rules`, etc.) | `scan` |
| `args` | Parameters or paths passed to the command | `.` |

---

## 📋 Examples

### 1. Validate CIDR Subnets in Infrastructure PRs:
```yaml
- name: Verify VPC Subnet
  uses: castovdev/castov-action@v1
  with:
    command: 'cidr'
    args: '10.0.0.0/24'
```

### 2. Generate `.cursorrules` for AI Coding Agents:
```yaml
- name: Ensure AI Rules Are Present
  uses: castovdev/castov-action@v1
  with:
    command: 'rules'
    args: 'nextjs'
```

---

## 📄 License
MIT © [Castov](https://castov.com)
