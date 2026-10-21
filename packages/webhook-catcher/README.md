# Webhook Catcher – Castov (VS Code Extension)

Local webhook receiver, inspector, and replay debugger for Stripe, GitHub, Shopify, Slack, and custom webhooks. Catch incoming HTTP requests directly inside Visual Studio Code and replay them to your local dev server with one click.

Zero external dependencies, instant local execution, zero cloud relay required.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. 📡 Built-In Local Webhook Receiver
- Runs a lightweight HTTP receiver directly inside VS Code (default `http://127.0.0.1:9090/webhook`).
- Automatically increments port if `9090` is occupied.
- Captures full HTTP headers, method, URL path, raw payload, and parsed JSON.

### 2. 🔍 Auto-Detect Provider & Event Type
- **Stripe:** Identifies `type` (e.g. `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.created`) and extracts `stripe-signature`.
- **GitHub:** Identifies `X-GitHub-Event` (e.g. `push`, `pull_request`, `issues`, `workflow_run`) and parses webhook signatures.
- **Shopify:** Identifies `X-Shopify-Topic` (e.g. `orders/create`, `products/update`) and webhook domain.
- **Slack:** Detects event subscriptions and Slack verification tokens.

### 3. 🔁 1-Click Replay to Localhost
- Replay any captured webhook to your active development server (e.g. `http://localhost:3000/api/webhook`).
- Automatically preserves source headers and signatures for webhook validation testing.
- Tracks response status codes, execution duration (ms), and server responses.
- **Auto-Forward Mode:** Automatically forward every incoming webhook to your backend in real time!

### 4. 📋 Instant cURL Generator
- Generates exact, copy-pasteable `curl` commands with all headers, auth signatures, and body payloads to debug in terminal or Postman.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Webhook Catcher: Open Inspector Dashboard` | Opens the split-view webhook inspector, payload viewer, and replayer |
| `Webhook Catcher: Start / Stop Receiver` | Toggles the local HTTP receiver server on `:9090` |
| `Webhook Catcher: Clear All Webhooks` | Clears all captured webhooks from memory |

---

## 📄 License

MIT © [Castov](https://castov.com)
