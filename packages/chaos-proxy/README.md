# Chaos Proxy – Castov (VS Code Extension)

Local HTTP proxy and fault injector for resilience testing: inject 429 Rate Limits, 500/502 Server Errors, custom network latency, and mock JSON payloads directly from Visual Studio Code and Cursor IDE.

Test how your frontends, mobile apps, and microservices react to network failures and upstream outages without spinning up external mock servers.

Zero dependencies, instant local execution, zero telemetry.

Powered by [Castov.com](https://castov.com).

---

## ✨ Features

### 1. ⚡ 1-Click Status Bar & Proxy Control
- Click the status bar icon (`⚡ Chaos: OFF` / `⚡ Chaos: ON (8080)`) to toggle the local HTTP proxy on `127.0.0.1:8080`.
- Automatically selects the next available port if port 8080 is occupied.

### 2. 🚨 Pre-Configured Fault Presets
- **429 Too Many Requests:** Injects standard HTTP 429 status with `Retry-After: 60` headers to test API client rate-limiting logic.
- **500 Internal Server Error:** Simulates catastrophic upstream server crashes.
- **502 Bad Gateway / 504 Gateway Timeout:** Tests upstream network timeouts.
- **3000ms High Latency:** Simulates degraded mobile or satellite network connections.
- **Socket Reset / Drop:** Abruptly drops the TCP socket to test client reconnection and retry handling.

### 3. 🎯 Route & Domain Filtering
- Match rules against URL patterns (e.g. `/api/checkout`, `api.stripe.com`, or wildcard `*`).
- Filter by HTTP Method (`GET`, `POST`, `PUT`, `DELETE`, `*`).
- Configure failure probability (e.g., fail only 50% of requests to test intermittent glitches).

### 4. 📡 Live Interception Log
- Real-time table displaying every request passing through the proxy.
- Inspect timestamps, target URLs, injected faults, returned status codes, and measured latencies.

---

## ⌨️ Commands

| Command | Description |
| :--- | :--- |
| `Chaos Proxy: Toggle Start / Stop` | Starts or stops the local proxy server |
| `Chaos Proxy: Open Control Panel` | Opens the full interactive dashboard |
| `Chaos Proxy: Enable 429 Rate Limit Preset` | Toggles the 429 Rate Limit preset |
| `Chaos Proxy: Enable 500 Server Error Preset` | Toggles the 500 Internal Error preset |
| `Chaos Proxy: Enable 3000ms Latency Preset` | Toggles the 3000ms artificial delay preset |

---

## 🚀 How to Use

1. Start Chaos Proxy by clicking **`⚡ Chaos: OFF`** in the status bar or running `Chaos Proxy: Toggle Start / Stop`.
2. Configure your client (e.g., `axios`, `fetch`, or mobile emulator) to use `http://127.0.0.1:8080` as the HTTP proxy, or change your API base URL to `http://127.0.0.1:8080`.
3. Enable your desired fault presets in the dashboard.
4. Watch how your application handles errors in real time!

---

## 📄 License

MIT © [Castov](https://castov.com)
