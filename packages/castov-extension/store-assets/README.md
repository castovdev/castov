# Chrome Web Store Asset Mapping — Castov Secret Shield

This directory contains all visual and promotional assets required to publish **Castov Secret Shield** on the **Chrome Web Store Developer Dashboard** (and Microsoft Edge Add-ons).

---

## 1. Extension Package (Upload in "Package" Tab)

| File Path | Format | Target Dashboard Field |
|---|---|---|
| `../dist/castov-secret-shield-1.0.0.zip` | `.zip` | **Package > Upload new package** |

---

## 2. Store Icon (Upload in "Store listing > Graphic assets")

| File Path | Dimensions | Format | Target Dashboard Field |
|---|---|---|---|
| `../icons/icon128.png` | `128 × 128 px` | 24-bit PNG | **Store icon** (128x128 px) |
| `../icons/store-logo-300.png` | `300 × 300 px` | 24-bit PNG | Optional high-res store logo (for Edge Add-ons) |

---

## 3. Screenshots (Upload in "Store listing > Screenshots" — up to 5 in CWS)

All screenshots are rendered at the exact recommended Chrome Web Store resolution (`1280 × 800 px`, 24-bit PNG, no alpha transparency):

| Order | File Name | Dimensions | What It Shows | Target Dashboard Field |
|---|---|---|---|---|
| 1 | `screenshot-1-interception.png` | `1280 × 800 px` | Real-time SafePaste™ interception dialog blocking sensitive credentials before paste | **Screenshots** (Slot 1 — Primary) |
| 2 | `screenshot-2-redaction.png` | `1280 × 800 px` | Side-by-side comparison of raw intercepted keys vs. `[REDACTED:<TYPE>_<n>]` placeholders | **Screenshots** (Slot 2) |
| 3 | `screenshot-3-popup.png` | `1280 × 800 px` | Extension toolbar popup showing local weekly counter, global switches, and per-site toggles | **Screenshots** (Slot 3) |
| 4 | `screenshot-4-masked-preview.png` | `1280 × 800 px` | Strict secret masking preview (`AKIA… (20 chars)`) protecting multi-secret `.env` pastes | **Screenshots** (Slot 4) |
| 5 | `screenshot-5-supported-secrets.png` | `1280 × 800 px` | Overview of all 7 explicitly scoped AI chat domains and 11+ detected secret categories | **Screenshots** (Slot 5) |
| 6 | `screenshot-6-security-audit.png` | `1280 × 800 px` | Zero-network CSP (`connect-src 'none'`), single `storage` permission, and Shadow DOM isolation | **Screenshots** (Optional / Alternate Slot) |

---

## 4. Promotional Tiles (Upload in "Store listing > Additional promotional tiles")

| File Name | Dimensions | Format | Target Dashboard Field |
|---|---|---|---|
| `small-promotional-tile-440x280.png` | `440 × 280 px` | 24-bit PNG | **Small promo tile (440x280)** |
| `large-promotional-tile-1400x560.png` | `1400 × 560 px` | 24-bit PNG | **Marquee promo tile (1400x560)** |

---

## 5. Promotional Video

| File Name | Resolution & Duration | Format | Target Dashboard Field |
|---|---|---|---|
| `castov-secret-shield-demo.mp4` | `1920 × 1080 px` (35s, silent) | H.264 `.mp4` | Upload to YouTube (Unlisted/Public) and paste link into **YouTube video URL**, or upload directly on stores that accept `.mp4` |

---

## 6. Text & Privacy Policy Fields (See `../STORE_LISTING.md` and `../PRIVACY.md`)

- **Title & Summary / Detailed Description / Category:** Copy from `../STORE_LISTING.md`.
- **Single Purpose & Permission Justifications (`storage` + 7 host patterns):** Copy from Section 1 of `../STORE_LISTING.md` into the **Privacy practices** tab.
- **Privacy Policy URL:** Enter `https://castov.com/privacy/secret-shield` (rendered from `src/app/privacy/secret-shield/page.tsx` and `../PRIVACY.md`) in **Privacy practices > Privacy policy URL**.
