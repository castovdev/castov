# 📘 الدليل التقني والمرجعي الشامل لمنصة Castov (Local-First Developer Workspace)

> **الإصدار التوثيقي:** v2.5 (نوفمبر 2026)  
> **النطاق الرسمي:** [https://castov.com](https://castov.com)  
> **نموذج التشغيل:** 100% Client-Side Execution (Zero-Server, Zero-Telemetry)  
> **الترخيص والبنية:** Next.js 16 (App Router) + WebAssembly + Web Crypto API + Local CLI/MCP Server

---

## 1. نظرة عامة على المشروع (Project Overview)

### 1.1 تعريف المنصة
**Castov** هي منصة هندسية متكاملة لأدوات المطورين (Developer Productivity & Security Suite) صُممت وفق معمارية **التشغيل المحلي أولاً (Local-First Architecture)**. تهدف المنصة إلى توفير بيئة عمل فورية وآمنة لتحويل البيانات، توليد المخططات البرمجية (Schemas)، فحص التوكنات، تشفير الأسرار، وتشخيص الأخطاء البرمجية، بالإضافة إلى حماية المطورين من تسريب مفاتيح الـ API وأسرار العمل أثناء استخدام أدوات الذكاء الاصطناعي.

بخلاف المواقع التقليدية التي تُرسل مدخلات المطور (مثل ملفات `.env`، أوامر `cURL`، توكنات `JWT`، أو مخططات قواعد البيانات `SQL`) إلى خوادم خلفية لمعالجتها، تعمل منصة **Castov** بالكامل داخل ذاكرة متصفح المستخدم (`V8 Isolate` / `Web Workers` / `WebAssembly`) أو محلياً عبر الطرفية (`@castov/cli`).

### 1.2 الفلسفة الهندسية الأساسية (Core Engineering Pillars)

| الركيزة الأساسية | الوصف الهندسي والتنفيذي | القيمة المضافة للمطور والمؤسسات |
| :--- | :--- | :--- |
| **الخصوصية المطلقة (Absolute Privacy)** | لا تغادر أي بايتات من مدخلات المستخدم جهازه إطلاقاً. جميع عمليات التحليل (Parsing)، التحويل (AST Transformation)، والتشفير تتم محلياً. | إمكانية استخدام المنصة بأمان تام مع بيانات الإنتاج الحساسة (`Production Secrets`، `Stripe Live Keys`، `Customer JSON Payloads`). |
| **صفر تتبع (Zero-Telemetry)** | غياب تام لأي برمجيات تتبع طرف ثالث (لا Google Analytics، لا PostHog، لا Sentry لتسجيل المدخلات، ولا بصمات متصفح). | امتثال فوري لمعايير الأمان المؤسسية (`SOC2`، `GDPR`، `HIPAA`) دون الحاجة لاتفاقيات معالجة بيانات (DPA). |
| **التنفيذ عبر المتصفح و WASM** | الاعتماد على محركات TypeScript/JavaScript حتمية (Deterministic Parsers) و `WebAssembly` (مثل `sql.js` لـ SQLite) وواجهات `Web Crypto API` الأصلية. | سرعة استجابة فورية (`Sub-millisecond latency`) بدون انتظار رحلة الشبكة (`0ms Network RTT`) ودعم العمل دون اتصال (Offline-capable). |
| **القضاء على تكاليف السحاب (Zero Cloud Compute Cost)** | بما أن المعالجة تتم على وحدة المعالجة المركزية (CPU) الخاصة بجهاز الزائر، وتُقدم الصفحات عبر التوليد الثابت (`SSG`) على شبكة CDN، فإن تكلفة الحوسبة السحابية تقترب من الصفر. | استدامة مالية كاملة تسمح بإتاحة جميع الأدوات مجاناً وبلا حدود للاستخدام (No Rate Limits, No Paywalls). |

---

## 2. الهيكل التقني والتقنيات المستخدمة (Tech Stack)

تعتمد منصة **Castov** على مكدس تقني حديث ومُحسّن للأداء الفائق والأمان الصارم:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CASTOV ARCHITECTURE LAYER                           │
├───────────────────────┬──────────────────────────┬─────────────────────────┤
│   Browser UI Layer    │  Local Compute Engines   │  AI & Terminal Layer    │
│  (Next.js 16 + React) │  (100% Client-Side JS)   │  (CLI + MCP + Shield)   │
├───────────────────────┼──────────────────────────┼─────────────────────────┤
│ • Next.js 16.2.1 SSG  │ • Custom AST Converters  │ • @castov/cli (Zero-dep)│
│ • React 19.2.4        │ • Web Crypto (AES-256)   │ • STDIO MCP Server      │
│ • Tailwind CSS v4     │ • WebAssembly (SQLite)   │ • MV3 Browser Extension │
│ • CodeMirror 6        │ • Web Workers (Regex)    │ • Secret Redaction Engine│
└───────────────────────┴──────────────────────────┴─────────────────────────┘
```

### 2.1 طبقة الواجهة الأمامية (Frontend & UI Layer)
* **إطار العمل الأساسي:** `Next.js 16.2.1` (App Router) مع الاعتماد الكلي على التوليد الثابت للصفحات (`Static Site Generation - SSG`) لضمان تحميل فوري (`Instant FCP/LCP`).
* **مكتبة الواجهة:** `React 19.2.4` مع استخدام المكونات الخادمة (`React Server Components`) لبناء هيكل SEO ثابت، والمكونات العميلة (`Client Components`) لتحميل محركات التحويل عند الطلب (`Dynamic Code-Splitting`).
* **التصميم والأنماط:** `Tailwind CSS v4` مع نظام تصميم داكن مخصص للمطورين (`Developer Dark-Mode First`)، ومكونات `Radix UI` للوصولية (`Accessibility - ARIA`)، وأيقونات `Lucide React`.
* **محررات الأكواد:** `CodeMirror 6` (`@uiw/react-codemirror`) مع دعم التلوين النحوي لـ `JSON`، `SQL`، `HTML`، `Markdown`، و `CSS`، بالإضافة إلى عارض الفروقات `react-diff-viewer-continued`.

### 2.2 محركات المعالجة المحلية (Local Execution Engines)
* **محركات التحويل المعيارية (Modular AST/Token Engines):** مكتوبة بلغة `TypeScript` الصارمة في المسار `src/lib/converters/engines/`، وتشمل محللات مخصصة لأوامر `cURL`، ومخططات `SQL DDL`، وملفات `.env`، ومستندات `YAML 1.1/1.2` (عبر مكتبة `yaml` القياسية)، وتوليد مخططات `Zod v3/v4`، `Drizzle ORM`، و `Prisma`.
* **محرك قواعد البيانات المدمج:** `sql.js` (`SQLite` مُترجم إلى `WebAssembly`) لتشغيل استعلامات SQL وبناء الجداول محلياً داخل ذاكرة المتصفح.
* **معالجة المخططات والرسوميات:** `Mermaid.js` لتوليد المخططات الهندسية، و `html-to-image` لتصدير لقطات الأكواد بجودة عالية.

### 2.3 أنظمة الأمان والتشفير (Security & Cryptography Stack)
* **التشفير الأصلي:** الاعتماد الحصري على `window.crypto.subtle` (`Web Crypto API`) في المتصفح و `node:crypto` في الطرفية:
  * **اشتقاق المفاتيح:** `PBKDF2` مع `SHA-256` بـ **600,000 دورة تكرار** (متوافق مع توصيات OWASP/NIST الحديثة) وملح عشوائي (`16-byte Salt`).
  * **التشفير المتماثل الموثق:** `AES-256-GCM` مع متجه ابتدائي عشوائي (`12-byte IV`) لضمان السرية وسلامة البيانات من التلاعب (`Authenticated Encryption`).
* **الحماية من هجمات حجب الخدمة التعبيرات النمطية (ReDoS Protection):** تشغيل اختبارات الـ Regex داخل `Web Worker` معزول مع مؤقت إيقاف قسري (`Watchdog Timeout`) يمنع تجميد المتصفح عند كتابة تعبير نمطي كارثي (`Catastrophic Backtracking`).
* **ترويسات الأمان الصارمة (Security Headers):** تطبيق سياسة أمن محتوى صارمة (`Content-Security-Policy`) في `next.config.ts` تمنع `unsafe-eval` (في الإنتاج)، وتقيّد `frame-ancestors 'none'`، وتفرض `X-Content-Type-Options: nosniff` و `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 3. دليل تفصيلي لجميع المميزات والأدوات (Features & Tools Directory)

تضم منصة **Castov** أكثر من **65 أداة متخصصة** موزعة على **6 قطاعات هندسية رئيسية**:

---

### القطاع الأول: المحولات البرمجية عالية الدقة (Modular Code Converters — 10 Engines)

تُعد هذه المحولات الجيل الجديد من أدوات التحويل في Castov، حيث يدعم كل محول خيارات تخصيص دقيقة، إخراجاً ابتدائياً ثابتاً لمحركات البحث (`SSR Example Output`)، شرحاً هندسياً للأخطاء الشائعة (`Common Pitfalls`)، ومعالجة للحالات الحدية (`Edge Cases`):

| # | الأداة (المُحوّل) | الوظيفة التقنية الدقيقة | الفائدة العملية للمطور | الرابط المباشر |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **ENV to Zod & T3 Env Converter** | يحلل ملفات `.env` (بما فيها `export`، القيم متعددة الأسطر، والتعليقات) ويستنتج الأنواع تلقائياً (`URL`، `Email`، `Number`، `Boolean`، `NODE_ENV enum`) ليولّد مخططات **Zod v4** (`z.stringbool()`)، أو **Zod v3**، أو إعداد **`@t3-oss/env-nextjs`** الكامل (`server` / `client` / `runtimeEnv`)، أو ملف `.env.example` نظيف. | يمنع تسريب قيم الأسرار (لا يطبع القيم أبداً في الكود الناتج)، ويكتشف فوراً كارثة وضع مفتاح سري داخل متغير يبدأ بـ `NEXT_PUBLIC_`. | [https://castov.com/convert/env-to-zod](https://castov.com/convert/env-to-zod) |
| **2** | **JSON to Zod Schema Converter** | يحوّل كائنات ومصفوفات JSON المعقدة والمتداخلة إلى مخططات تحقق `Zod` مع التبديل الفوري بين **Zod v4** (`z.email()`, `z.url()`, `z.iso.datetime()`) و **Zod v3** (`z.string().email()`)، مع خيارات `.strict()` وتوليد `z.infer<typeof Schema>`. | يوفر وقت كتابة مخططات التحقق يدوياً لبيانات الـ APIs والـ Webhooks مع ضمان التوافق مع أحدث إصدارات Zod. | [https://castov.com/convert/json-to-zod](https://castov.com/convert/json-to-zod) |
| **3** | **JSON to TypeScript Interfaces** | يستنتج واجهات `interface` أو أنواع `type` من هياكل JSON، مع تحويل ذكي لأسماء المصفوفات من الجمع إلى المفرد (`categories` → `Category`، `children` → `Child`)، واقتباس المفاتيح الخاصة، وخيار التعامل مع `null` (`null` أو `unknown`)، وإضافة `readonly`. | بناء نماذج بيانات TypeScript نظيفة ومقسمة هرمياً خلال أجزاء من الثانية دون استخدام `any`. | [https://castov.com/convert/json-to-typescript](https://castov.com/convert/json-to-typescript) |
| **4** | **cURL to Fetch & Axios Converter** | يحلل أوامر `cURL` الحقيقية المنسوخة من متصفح Chrome (`Copy as cURL`) ويعالج رايات `-X`, `-H`, `-d`, `--data-raw`, `-u` (بترميز UTF-8 آمن)، `-F` (`FormData`)، `-b` (Cookies)، `-L`، `-I`، وينبه عند وجود `-k` (`--insecure`). يخرج الكود بصيغة **Browser Fetch** أو **Node.js Fetch** أو **Axios**. | تحويل طلبات الشبكة المعقدة من DevTools مباشرة إلى كود JavaScript/TypeScript جاهز للإنتاج مع شرح مشاكل CORS. | [https://castov.com/convert/curl-to-fetch](https://castov.com/convert/curl-to-fetch) |
| **5** | **YAML to JSON Converter (1.1 vs 1.2)** | يحوّل ملفات `YAML` (مثل `docker-compose.yml` وملفات Kubernetes) إلى JSON مع حل المراجع (`Anchors & Aliases * / &`)، ودعم المستندات المتعددة (`---`)، والتبديل بين مواصفة **YAML 1.2** و **YAML 1.1**، وعرض رقم السطر والعمود الدقيق عند وجود خطأ. | كشف مشكلة "مشكلة النرويج" (`NO` أو `yes/no` التي تتحول لـ `boolean` في YAML 1.1) والأرقام الثمانية (`0755` مقابل `0o755`) قبل تعطل الإنتاج. | [https://castov.com/convert/yaml-to-json](https://castov.com/convert/yaml-to-json) |
| **6** | **SQL to Prisma Schema Converter** | يترجم جمل `CREATE TABLE` و `CREATE TYPE AS ENUM` و `CREATE INDEX` (لـ PostgreSQL و MySQL و SQLite) إلى ملف `schema.prisma` متكامل، ويستنتج العلاقات ثنائية الاتجاه (`1:1` عبر `UNIQUE FK`، و `1:n`، وجداول الربط `n:m`) مع `@default` و `@map` و `@@map`. | تسريع ترحيل قواعد البيانات القديمة إلى Prisma ORM مع الحفاظ على تسميات `camelCase` البرمجية وأسماء الأعمدة الأصلية في قاعدة البيانات. | [https://castov.com/convert/sql-to-prisma](https://castov.com/convert/sql-to-prisma) |
| **7** | **SQL to Drizzle ORM Schema Converter** | يترجم جمل `CREATE TABLE` و `CREATE TYPE AS ENUM` و `CREATE INDEX` إلى مخططات **Drizzle ORM** بلغة TypeScript (`pgTable`, `mysqlTable`, `sqliteTable`)، ويولّد علاقات `relations()` ومؤشرات `index()`/`uniqueIndex()` والمفاتيح المركبة `primaryKey()` وأنواع `$inferSelect` / `$inferInsert`. | الترحيل الفوري من SQL الخام إلى Drizzle ORM الحديث بدون تكلفة Binary Engine وبأمان أنواع كامل. | [https://castov.com/convert/sql-to-drizzle](https://castov.com/convert/sql-to-drizzle) |
| **8** | **Webhook HMAC Debugger & Zod Handler** | يشخص أسباب فشل التحقق من تواقيع الـ Webhooks (`401 Invalid Signature`) لمنصات **Shopify** (`Base64`) و **Stripe** (`t=...,v1=... Hex`) و **GitHub** (`sha256=... Hex`)، ويختبر تلقائياً 8 طفرات شائعة للجسم، ثم يولّد كود التحقق الآمن (`crypto.timingSafeEqual`) مع مخطط Zod للبيانات. | حل أعقد مشاكل تكامل المدفوعات والتجارة الإلكترونية (تغير المسافات أو `req.json()` قبل التحقق من الـ Raw Body) في ثوانٍ. | [https://castov.com/convert/webhook-hmac-debugger](https://castov.com/convert/webhook-hmac-debugger) |
| **9** | **cURL to n8n & Make.com HTTP Node** | يحوّل أوامر `cURL` مباشرة إلى كود JSON لعقدة **n8n HTTP Request Node (v4.2)** قابل للصق المباشر (`Ctrl+V`) داخل لوحة عمل n8n، أو مخطط **Make.com HTTP Module**، مع فصل الترويسات، المعاملات، التوثيق الأساسي، والـ Body تلقائياً. | توفير وقت بناء عقد الـ API يدوياً لمطوري الأتمتة (`Workflow Automation`) مع ضمان عدم تسريب مفاتيح الـ API لأي سحاب وسيط. | [https://castov.com/convert/curl-to-n8n](https://castov.com/convert/curl-to-n8n) |
| **10** | **HAR File & JSON Log Secret Sanitizer** | ينظف ملفات `.har` المسجلة من المتصفح وسجلات JSON من الكوكيز (`Cookie`/`Set-Cookie`) وترويسات `Authorization` ومعاملات الروابط الحساسة، ويغوص داخل نصوص JSON المتداخلة (`postData.text` و `content.text`) لحجب مفاتيح Stripe و AWS و GitHub و JWTs. | مشاركة ملفات تشخيص الشبكة (`.har`) بأمان مع فرق الدعم الفني أو نماذج الذكاء الاصطناعي دون اختراق حسابات الإنتاج. | [https://castov.com/convert/har-sanitizer](https://castov.com/convert/har-sanitizer) |

---

### القطاع الثاني: منظومة الأمان، التشفير، والذكاء الاصطناعي (Security, Privacy & AI Suite)

| # | الأداة / الميزة | الوظيفة التقنية الدقيقة | الفائدة العملية للمطور | الرابط المباشر |
| :-: | :--- | :--- | :--- | :--- |
| **11** | **Castov Secret Shield (Browser Extension)** | إضافة متصفح (Manifest V3 لـ Chrome و Firefox) تعترض عمليات اللصق (`paste`) والرفع (`drop`) في منصات المحادثة الذكية (**ChatGPT, Claude, Gemini, DeepSeek, Perplexity, Grok**) وتمسح الأسرار محلياً قبل وصولها لحقل الإدخال. | حماية المطورين تلقائياً من لصق مفاتيح AWS أو Stripe أو Private Keys بالخطأ داخل محادثات الذكاء الاصطناعي، مع استبدالها برموز آمنة مثل `[REDACTED_STRIPE_KEY_1]`. | [https://castov.com/secret-shield](https://castov.com/secret-shield) |
| **12** | **Env Vault (Zero-Knowledge .env Encryptor)** | خزنة تشفير محلية لملفات `.env` تستخدم `PBKDF2 (600k iterations)` + `AES-256-GCM`، بالإضافة إلى ماسح أسرار محلي (`Secret Scanner`) ومولّد `.env.example`. | تشفير ملفات متغيرات البيئة ومشاركتها مع الفريق عبر Slack أو Git دون أن يتمكن أي طرف (بما فيه Castov) من فك تشفيرها بدون كلمة المرور. | [https://castov.com/env-vault](https://castov.com/env-vault) |
| **13** | **Local MCP Server (`castov mcp`)** | خادم **Model Context Protocol (MCP)** يعمل محلياً عبر `STDIO` (يدعم كلاً من `Content-Length Framing` و `NDJSON`) ويزود وكلاء الذكاء الاصطناعي (**Cursor, Claude Desktop, Windsurf, VS Code**) بـ **16 أداة حتمية** (بما فيها توليد مخططات Zod و Prisma). | بدلاً من أن "يهلوس" نموذج الذكاء الاصطناعي في حسابات التوقيت أو أقنعة الشبكات أو مخططات Zod، يستدعي أداة Castov المحلية ليحصل على نتيجة رياضية وهندسية دقيقة 100%. | [https://castov.com/mcp](https://castov.com/mcp) |
| **14** | **Castov CLI (`npx @castov/cli`)** | أداة سطر أوامر (Zero-dependency CLI) تعمل بدون اتصال بالإنترنت، توفر أوامر فورية (`uuid`, `ts`, `detect`, `cron`, `tz`, `cidr`, `port`, `secret`, `scan`, `env-check`, `hook`, `fix`, `rules`, `jwt`, `hash`). | تنفيذ جميع مهام التطوير وفحص الأسرار وحماية Git Pre-commit مباشرة من الطرفية أو داخل أنابيب `CI/CD` بسرعة فائقة. | [https://castov.com/cli](https://castov.com/cli) |
| **15** | **JWT Debugger & Inspector** | محلل وفاحص لتوكنات `JSON Web Tokens (JWT)` يفكك الترويسة (`Header`) والحمولة (`Payload`)، ويتحقق من صلاحية التوقيت (`exp`, `iat`, `nbf`) ويحذر من ثغرات مثل `alg: "none"`. | فحص توكنات المصادقة الحقيقية الخاصة ببيئة الإنتاج بأمان تام دون إرسالها لمواقع خارجية قد تسجلها. | [https://castov.com/jwt](https://castov.com/jwt) |
| **16** | **Cryptographic Hash Generator** | يولّد بصمات التجزئة (`SHA-1`, `SHA-256`, `SHA-384`, `SHA-512`, `MD5`) محلياً عبر `Web Crypto API` مع مقارنة التطابق. | التحقق من سلامة البيانات وتوليد البصمات النصية بسرعة وأمان. | [https://castov.com/hash-generator](https://castov.com/hash-generator) |
| **17** | **HMAC Signature Generator** | يحسب تواقيع `HMAC` (`HMAC-SHA256`, `HMAC-SHA512`) باستخدام مفتاح سري محلياً بصيغتي Hex و Base64. | اختبار تواقيع الـ Webhooks (مثل Shopify و Stripe و GitHub) والتحقق من صحتها محلياً. | [https://castov.com/hmac-generator](https://castov.com/hmac-generator) |
| **18** | **Bcrypt Password Hasher & Verifier** | يولّد ويتحقق من تجزئات كلمات المرور بخوارزمية `bcrypt` مع التحكم في معامل التكلفة (`Cost Factor / Salt Rounds`). | إنشاء كلمات مرور مشفرة لبذر قواعد البيانات (`Database Seeding`) أو اختبار التحقق محلياً. | [https://castov.com/bcrypt-generator](https://castov.com/bcrypt-generator) |
| **19** | **Password & CSPRNG Secret Generator** | مولّد كلمات مرور ومفاتيح عشوائية مشفرة (`crypto.getRandomValues`) مع حساب الإنتروبيا بالبت (`Entropy Bits`). | توليد مفاتيح `NEXTAUTH_SECRET` و `JWT_SECRET` وكلمات مرور قواعد البيانات القوية. | [https://castov.com/password-generator](https://castov.com/password-generator) |
| **20** | **UUID & ULID Generator** | يولّد معرفات فريدة من نوع `UUID v4`، `UUID v7` (القابلة للفرز زمنياً)، و `ULID` بكميات فردية أو جماعية. | توفير معرفات جاهزة لعمليات الاختبار وبناء قواعد البيانات الحديثة التي تعتمد على `UUIDv7`. | [https://castov.com/uuid-generator](https://castov.com/uuid-generator) |
| **21** | **LLM Token Counter & Cost Estimator** | يحسب عدد التوكنات (`Tokens`) والأحرف والتكلفة التقديرية لنماذج الذكاء الاصطناعي المختلفة قبل إرسال المطالبة (`Prompt`). | تحسين استهلاك سياق النماذج اللغوية (`Context Window`) وتقليل فواتير استخدام واجهات الـ LLM. | [https://castov.com/token-counter](https://castov.com/token-counter) |
| **22** | **AI Cursor Rules Directory (`.cursorrules`)** | مكتبة قوالب جاهزة ومحسنة لملفات توجيه وكلاء الذكاء الاصطناعي (`Next.js`, `Rust`, `Python FastAPI`, `Go`, `Tailwind`). | ضبط سلوك المساعد البرمجي في Cursor و Windsurf ليتبع أفضل الممارسات المعمارية منذ اللحظة الأولى. | [https://castov.com/cursorrules](https://castov.com/cursorrules) |

---

### القطاع الثالث: مختبرات البيانات، القواعد النمطية، ومقارنة الأكواد (Data, Regex & Diff Workbenches)

| # | الأداة / الميزة | الوظيفة التقنية الدقيقة | الفائدة العملية للمطور | الرابط المباشر |
| :-: | :--- | :--- | :--- | :--- |
| **23** | **SQLite Browser Playground (WASM)** | بيئة قواعد بيانات `SQLite` متكاملة تعمل داخل المتصفح عبر `WebAssembly` (`sql.js`)، تدعم إنشاء الجداول، تنفيذ الاستعلامات، وتصدير النتائج. | تجربة استعلامات SQL المعقدة واختبار هياكل البيانات فوراً بدون تثبيت خادم قاعدة بيانات محلي. | [https://castov.com/sqlite-playground](https://castov.com/sqlite-playground) |
| **24** | **Regex Tester & Library (ReDoS-Safe)** | مختبر تعبيرات نمطية تفاعلي يعمل داخل `Web Worker` مع حماية ضد التجميد (`ReDoS Timeout`)، ومكتبة شاملة لأشهر الأنماط (`/regex/[slug]`). | اختبار التعبيرات النمطية المعقدة بأمان مع شرح تفصيلي للمجموعات (`Capture Groups`) وحالات الفشل. | [https://castov.com/regex](https://castov.com/regex) |
| **25** | **JSON Formatter, Validator & Tree Viewer** | منسق وفاحص JSON فائق السرعة مع تصغير (`Minify`)، فرز المفاتيح، واكتشاف أخطاء بناء الجملة بدقة. | تنظيف وفحص استجابات الـ API الضخمة محلياً دون رفع بيانات العملاء لأي خادم. | [https://castov.com/json-formatter](https://castov.com/json-formatter) |
| **26** | **JSON Diff & Structural Comparator** | أداة مقارنة هيكلية ونصية بين ملفي JSON جنباً إلى جنب (`Split / Unified View`) مع إبراز الإضافات والحذف والتعديلات. | اكتشاف التغييرات الدقيقة بين استجابات الـ API في بيئة التطوير مقابل بيئة الإنتاج. | [https://castov.com/json-diff](https://castov.com/json-diff) |
| **27** | **Code & Text Diff Checker** | مقارن نصوص وأكواد برمجية يدعم المقارنة على مستوى السطر والكلمة. | مراجعة التعديلات السريعة على الملفات والإعدادات قبل اعتمادها. | [https://castov.com/diff-checker](https://castov.com/diff-checker) |
| **28** | **SQL Query Formatter & Beautifier** | منسق استعلامات SQL يدعم لهجات متعددة (`PostgreSQL`, `MySQL`, `SQLite`, `Standard SQL`) مع تكبير الكلمات المفتاحية وترتيب جمل `JOIN` و `WHERE`. | تحويل استعلامات SQL الطويلة والمضغوطة من السجلات (`Logs`) إلى كود مقروء ومنظم. | [https://castov.com/sql-formatter](https://castov.com/sql-formatter) |
| **29** | **CSV to JSON & JSON to CSV Converters** | محول ثنائي الاتجاه بين جداول `CSV` ومصفوفات `JSON` مع معالجة الفواصل المقتبسة والترويسات. | تجهيز بيانات الجداول لعمليات الاستيراد والتصدير البرمجية. | [https://castov.com/csv-to-json](https://castov.com/csv-to-json) / [https://castov.com/json-to-csv](https://castov.com/json-to-csv) |
| **30** | **TOML / XML / YAML Converters** | مجموعة محولات متخصصة لتنسيقات الإعدادات (`TOML to JSON`، `XML to JSON`، `JSON to YAML`). | التبديل السلس بين ملفات إعدادات `Cargo.toml`، `pyproject.toml`، وملفات السحابة. | [https://castov.com/toml-to-json](https://castov.com/toml-to-json) / [https://castov.com/xml-to-json](https://castov.com/xml-to-json) |

---

### القطاع الرابع: موسوعات الأخطاء، الشبكات، الموانئ، والـ HTTP (Encyclopedias & Network References)

| # | الأداة / الميزة | الوظيفة التقنية الدقيقة | الفائدة العملية للمطور | الرابط المباشر |
| :-: | :--- | :--- | :--- | :--- |
| **31** | **Developer Error Encyclopedia (`/errors`)** | موسوعة تشخيصية تغطي أشهر أخطاء الأنظمة والأطر (`Next.js Hydration`, `CORS`, `Docker Exit 137/139`, `Postgres Connection`, `Git`, `Prisma`, `Kubernetes`) مع السبب الجذري والحل العملي. | الوصول المباشر لخطوات إصلاح الأخطاء البرمجية المعقدة بدون حشو، مع إمكانية البحث عنها من الطرفية عبر `castov fix`. | [https://castov.com/errors](https://castov.com/errors) |
| **32** | **IPv4 CIDR Subnet Calculator (`/cidr`)** | حاسبة شبكات تحسب قناع الشبكة (`Subnet Mask`)، قناع الـ Wildcard، عنوان الشبكة، عنوان البث (`Broadcast`)، ونطاق العناوين القابلة للاستخدام (بما فيها حالات `/31` RFC 3021 و `/32`). | تخطيط الشبكات السحابية (`AWS VPC`, `Docker Networks`, `Kubernetes Subnets`) بدقة رياضية. | [https://castov.com/cidr](https://castov.com/cidr) |
| **33** | **Network Ports Encyclopedia (`/ports`)** | دليل تفاعلي لمنافذ الشبكة القياسية (`TCP/UDP Ports` مثل `5432`, `6379`, `3000`, `8080`, `27017`) مع أوامر قتل العمليات المتعارضة (`lsof` / `netstat`) وإعدادات الجدار الناري. | معرفة الخدمة التي تشغل منفذاً معيناً وحل خطأ `EADDRINUSE` فوراً. | [https://castov.com/ports](https://castov.com/ports) |
| **34** | **HTTP Status Codes Reference (`/http-status`)** | مرجع شامل لأكواد حالة HTTP (`1xx` إلى `5xx`) مع متى يُستخدم كل كود في تصميم `REST APIs` وأمثلة عملية. | اختيار كود الاستجابة الصحيح هندسياً (مثل الفرق بين `401` و `403`، أو `422` و `400`). | [https://castov.com/http-status](https://castov.com/http-status) |
| **35** | **HTTP Headers Reference (`/http-headers`)** | دليل ترويسات HTTP القياسية والأمنية (`Cache-Control`, `CSP`, `CORS`, `Strict-Transport-Security`) مع أمثلة الضبط. | ضبط سياسات التخزين المؤقت والأمان في تطبيقات الويب بدقة. | [https://castov.com/http-headers](https://castov.com/http-headers) |
| **36** | **MIME Types Reference (`/mime-types`)** | جدول مرجعي لأنواع المحتوى (`Content-Type / MIME`) وامتدادات الملفات المقابلة لها. | ضبط ترويسات رفع وتحميل الملفات في الخوادم وتخزين `S3`. | [https://castov.com/mime-types](https://castov.com/mime-types) |
| **37** | **Linux Chmod Calculator (`/chmod-calculator`)** | حاسبة صلاحيات ملفات يونكس/لينكس التفاعلية (تحويل ثنائي الاتجاه بين التمثيل الرقمي `0755` والرمزي `rwxr-xr-x`). | ضبط صلاحيات ملفات الخادم ومفاتيح SSH (`chmod 600`) بدون أخطاء أمنية. | [https://castov.com/chmod-calculator](https://castov.com/chmod-calculator) |
| **38** | **ASCII & Keycodes Reference** | جداول مرجعية لرموز `ASCII` (العشرية، الست عشرية، الثنائية) وأكواد مفاتيح لوحة المفاتيح (`JavaScript KeyboardEvent.key / code`). | تسهيل برمجة اختصارات لوحة المفاتيح والتعامل مع الترميز المنخفض المستوى. | [https://castov.com/ascii-table](https://castov.com/ascii-table) / [https://castov.com/keycodes](https://castov.com/keycodes) |
| **39** | **Git Commands Cheat Sheet (`/git-commands`)** | مرجع تفاعلي لأوامر Git المتقدمة (التراجع عن الأخطاء، `rebase`، `cherry-pick`، `stash`، وإدارة الفروع). | إنقاذ المطورين في مواقف Git الحرجة بأوامر دقيقة ومشروحة. | [https://castov.com/git-commands](https://castov.com/git-commands) |

---

### القطاع الخامس: أدوات الوقت، المناطق الزمنية، والجدولة (Time, Epoch & Cron Suite)

| # | الأداة / الميزة | الوظيفة التقنية الدقيقة | الفائدة العملية للمطور | الرابط المباشر |
| :-: | :--- | :--- | :--- | :--- |
| **40** | **Unix Timestamp & Epoch Converter** | محول طوابع زمنية يكتشف تلقائياً الثواني (`10 digits`)، المللي ثانية (`13 digits`)، الميكروثانية، والنانوثانية، ويحولها إلى `UTC` و `ISO 8601` والتوقيت المحلي. | فحص طوابع الوقت في قواعد البيانات والسجلات بنقرة واحدة، مع صفحات مرجعية (`/timestamp/[value]`). | [https://castov.com/timestamp](https://castov.com/timestamp) |
| **41** | **Cron Expression Generator & Explainer** | محلل ومولّد لتعبيرات الجدولة (`Cron Jobs`) يشرح التعبير باللغة الطبيعية ويحسب أوقات التنفيذ الـ 5 القادمة عبر المناطق الزمنية المختلفة. | التحقق من مواعيد تشغيل المهام الخلفية (`GitHub Actions`, `Vercel Cron`, `Linux Crontab`) قبل نشرها. | [https://castov.com/cron](https://castov.com/cron) |
| **42** | **IANA Timezone & DST Converter** | محول مناطق زمنية احترافي يعتمد على قاعدة بيانات `IANA` ويكتشف فجوات وتداخلات التوقيت الصيفي (`DST Spring-Forward Gaps & Fall-Back Overlaps`). | تجنب الأخطاء الكارثية في جدولة الاجتماعات والعمليات المالية العابرة للقارات أثناء تغير التوقيت الصيفي. | [https://castov.com/timezone-converter](https://castov.com/timezone-converter) |
| **43** | **World Clock & Stopwatch / Timer** | ساعة عالمية متعددة المناطق للمطورين العاملين عن بُعد، مع مؤقت وساعة إيقاف دقيقة. | تنسيق أوقات النشر (`Deployments`) والاجتماعات بين الفرق الموزعة عالمياً. | [https://castov.com/world-clock](https://castov.com/world-clock) |

---

### القطاع السادس: أدوات الترميز، الويب، والتصميم (Encoding, Web & UI Utilities)

* **أدوات الترميز والتحويل النصي:**
  * **Base64 Encoder / Decoder** (نص وملفات وصور بدعم كامل لـ UTF-8): [https://castov.com/base64](https://castov.com/base64)
  * **URL Encoder / Decoder & Parser**: [https://castov.com/url-encoder](https://castov.com/url-encoder)
  * **HTML Entities Encoder / Decoder**: [https://castov.com/html-entities](https://castov.com/html-entities)
  * **String Case Converter** (`camelCase`, `snake_case`, `PascalCase`, `kebab-case`, `CONSTANT_CASE`): [https://castov.com/case-converter](https://castov.com/case-converter)
  * **URL Slug Generator**: [https://castov.com/slug-generator](https://castov.com/slug-generator)
  * **Number Base Converter** (`Binary`, `Octal`, `Decimal`, `Hexadecimal`): [https://castov.com/number-base-converter](https://castov.com/number-base-converter)
* **أدوات الواجهة والتصميم والـ SEO:**
  * **Color Converter & Contrast Checker** (`HEX`, `RGB`, `HSL`, `OKLCH` + WCAG Contrast): [https://castov.com/color-converter](https://castov.com/color-converter) / [https://castov.com/contrast-checker](https://castov.com/contrast-checker)
  * **CSS Gradient & Box Shadow Generators**: [https://castov.com/css-gradient-generator](https://castov.com/css-gradient-generator) / [https://castov.com/box-shadow-generator](https://castov.com/box-shadow-generator)
  * **SVG Optimizer & Viewer**: [https://castov.com/svg-optimizer](https://castov.com/svg-optimizer)
  * **QR Code Generator (Client-Side SVG/PNG)**: [https://castov.com/qr-code-generator](https://castov.com/qr-code-generator)
  * **Meta Tag & OpenGraph Previewer**: [https://castov.com/meta-tag-generator](https://castov.com/meta-tag-generator) / [https://castov.com/og-preview](https://castov.com/og-preview)
  * **Markdown Editor & Mermaid Diagram Previewer**: [https://castov.com/markdown-preview](https://castov.com/markdown-preview) / [https://castov.com/mermaid-preview](https://castov.com/mermaid-preview)
  * **Code Screenshot Generator**: [https://castov.com/code-screenshot](https://castov.com/code-screenshot)

---

## 4. استراتيجية الأمان وحماية البيانات (Security & Privacy Layer)

تطبق منصة **Castov** استراتيجية دفاع متعددة الطبقات (**Defense-in-Depth**) لضمان عدم تسريب مفاتيح الـ API أو أسرار العمل سواء إلى خوادم خارجية، أو إلى نماذج الذكاء الاصطناعي، أو حتى عبر متصفح الزائر نفسه:

### 4.1 فصل الأنواع عن القيم في محولات البيئة (Zero-Value Output Guarantee)
في أداة **ENV to Zod & T3 Env Converter** (`/convert/env-to-zod`):
1. يقوم المحرك المحلي (`src/lib/converters/engines/env-to-zod.ts`) بقراءة القيمة فقط لاستنتاج نوعها الرياضي (`URL`، `Email`، `Number`، `Boolean`)، ثم **يتخلص من القيمة نهائياً في الذاكرة** ولا يطبعها أبداً في الكود المُولّد.
2. إذا اكتشف المحرك مفتاحاً حساساً (مثل `sk_live_...` أو `whsec_...` أو متغير يحتوي اسمه على `SECRET` / `TOKEN` / `PASSWORD` / `KEY`)، فإنه يضيف تعليقاً تحذيرياً `// Sensitive secret — keep server-only`.
3. **نظام الإنذار المبكر لـ Next.js (`NEXT_PUBLIC_` Leak Detection):** إذا قام المطور بتسمية متغير يبدأ بـ `NEXT_PUBLIC_` وكان اسمه أو قيمته توحي بأنه مفتاح سري (مثل `NEXT_PUBLIC_STRIPE_SECRET_KEY`)، يطلق المحول تحذيراً أمنياً بارزاً يمنع المطور من تضمين المفتاح السري داخل حزمة المتصفح (`Client Bundle`).

### 4.2 اعتراض الأسرار قبل وصولها للذكاء الاصطناعي (Pre-LLM Interception via Secret Shield)
تعمل إضافة **Castov Secret Shield** كجدار ناري محلي داخل المتصفح (`DOM Event Interceptor`):
* تستمع الإضافة لأحداث `paste` و `drop` في مرحلة الالتقاط المبكرة (`Capture Phase: true`) داخل صفحات ChatGPT و Claude و Gemini و DeepSeek.
* يتم تمرير النص الملصوق عبر محرك أنماط عالي الدقة يكتشف:
  * مفاتيح `AWS Access Key ID` (`AKIA...`) و `AWS Secret Keys`
  * مفاتيح `Stripe Live & Test Secret Keys` (`sk_live_...`, `rk_live_...`, `whsec_...`)
  * مفاتيح `OpenAI` (`sk-proj-...`) و `Anthropic` (`sk-ant-...`)
  * توكنات `GitHub PAT` (`ghp_...`, `github_pat_...`) و `Slack` (`xoxb-...`)
  * المفاتيح الخاصة (`-----BEGIN RSA/OPENSSH/EC PRIVATE KEY-----`)
  * سلاسل الاتصال بقواعد البيانات (`postgresql://user:pass@host...`, `mongodb+srv://...`)
* يتم استبدال السر فوراً في النص الملصوق بعنصر نائب آمن (`[REDACTED_AWS_KEY_1]`)، بحيث يفهم الذكاء الاصطناعي سياق الكود ويساعد المطور في حل المشكلة **دون أن يرى المفتاح الحقيقي إطلاقاً**.

### 4.3 التشفير الصفري لخزنة البيئة (Zero-Knowledge AES-256-GCM Vault)
في أداة **Env Vault** (`/env-vault`):
* يتم توليد الملح (`Salt`) والمتجه الابتدائي (`IV`) عبر مولّد الأرقام العشوائية المشفر في المتصفح (`crypto.getRandomValues`).
* لا يتم إرسال كلمة المرور ولا النص الأصلي لأي خادم. حتى عند نسخ الحمولة المشفرة (`Ciphertext Bundle`)، لا يمكن فك تشفيرها إلا بنفس عبارة المرور عبر `PBKDF2-SHA256` (600,000 دورة).

### 4.4 حماية المحولات وخادم MCP من حقن الأكواد (Code Injection & DoS Hardening)
* **تطهير المعرفات (`Identifier Sanitization`):** جميع محركات التحويل (في الويب وفي `castov_json_to_ts_pipeline` داخل خادم MCP) تقوم بتطهير أسماء المفاتيح وفحصها عبر تعبيرات صارمة (`/^[A-Za-z_$][A-Za-z0-9_$]*$/`) أو تغليفها بـ `JSON.stringify` لمنع هجمات حقن الكود (`Prototype Pollution` و `Interface Breakout Injection`).
* **حماية الذاكرة في خادم MCP:** يفرض خادم `castov mcp` حداً أقصى لحجم الرسالة (`MAX_BODY_SIZE = 4MB`) وعمق التداخل (`maxDepth`) لمنع استنزاف الذاكرة (`OOM`) عند التعامل مع وكلاء الذكاء الاصطناعي.

---

## 5. خارطة الطريق والمستقبل (Future Roadmap — مُطبّقة محلياً)

تم تنفيذ خارطة الطريق التالية محلياً بالكامل داخل المستودع البرمجي لتوسيع قدرات **Castov** في 3 مسارات استراتيجية:

### المرحلة الأولى: توسيع عائلة المحولات المعيارية عالية القيمة (High-Impact Modular Converters)
1. **مُحوّل `sql-to-drizzle` (`/convert/sql-to-drizzle`):**
   * البناء على نجاح محلل الـ DDL في `sql-to-prisma` لدعم مكتبة **Drizzle ORM** السريعة النمو (`pgTable`, `mysqlTable`, `sqliteTable`، العلاقات `relations()`, الفهارس `index()`/`uniqueIndex()`، والمفاتيح المركبة `primaryKey()`، مع توليد أنواع `$inferSelect` و `$inferInsert`).
2. **مُشخّص ومولّد تواقيع الـ Webhooks (`webhook-hmac-debugger` — `/convert/webhook-hmac-debugger`):**
   * أداة متخصصة لمطوري التجارة الإلكترونية والمدفوعات (**Shopify, Stripe, GitHub**) تكتشف تلقائياً سبب فشل التحقق من توقيع `HMAC-SHA256` (مثل تعديل المسافات البيضاء، أو парس JSON قبل التحقق من الـ Raw Body، أو خلط `Hex` مع `Base64`، أو نسيان بادئة `timestamp.` في Stripe)، وتولّد كود التحقق الجاهز لـ Next.js App Router / Express مع مخطط Zod للبيانات.
3. **مُحوّل `curl-to-n8n` (`/convert/curl-to-n8n`):**
   * استغلال محلل `cURL` الحالي لتوليد ملف JSON جاهز للصق المباشر (`Ctrl+V`) كعقدة `HTTP Request Node` داخل منصة الأتمتة **n8n** أو مخطط **Make.com** أو عقدة **n8n Code Node**.
4. **مُنظّف ملفات الشبكة والسجلات (`har-sanitizer` — `/convert/har-sanitizer`):**
   * أداة تعمل 100% في المتصفح لتنظيف ملفات `.har` وسجلات JSON من الكوكيز (`Cookie`, `Set-Cookie`) وترويسات `Authorization` ومفاتيح الـ API داخل أجسام الطلبات والاستجابات المتداخلة (`postData.text` و `content.text`) قبل مشاركتها.

### المرحلة الثانية: تعميق تكامل الذكاء الاصطناعي المحلي (AI-Native & MCP Expansion)
* **توسيع خادم `castov mcp`:** إضافة أدوات المحولات المعيارية الجديدة (`castov_json_to_zod`، `castov_env_to_zod`، `castov_sql_to_prisma`) مباشرة داخل بروتوكول MCP، بحيث يتمكن المطور داخل **Cursor** أو **Claude Code** من طلب تحويل ملف `.env` أو `schema.sql` أو `JSON` إلى كود TypeScript/Zod/Prisma حتمي وموثوق بأمر واحد.

### المرحلة الثالثة: أدوات DevSecOps المحلية للفرق (Local-First Team DevSecOps)
* **خطافات Git المسبقة (`castov env-check` & `castov hook install`):**
  * توفير أمر `castov env-check` للتحقق محلياً من تطابق ملف `.env` مع `.env.example` وفحص تسريبات `NEXT_PUBLIC_` والأسرار المكشوفة.
  * توفير أمر `castov hook install` لتثبيت خطاف `.git/hooks/pre-commit` يعمل محلياً في أقل من 50 مللي ثانية لمنع رفع أي مفاتيح مسربة أو متغيرات بيئة غير متزامنة قبل حدوث `git commit`.

---

## ملحق: خلاصة الروابط السريعة للأدوات الأساسية
* **الصفحة الرئيسية:** [https://castov.com](https://castov.com)
* **مركز المحولات البرمجية:** [https://castov.com/convert](https://castov.com/convert)
* **درع الأسرار للذكاء الاصطناعي:** [https://castov.com/secret-shield](https://castov.com/secret-shield)
* **خزنة تشفير البيئة:** [https://castov.com/env-vault](https://castov.com/env-vault)
* **خادم MCP للذكاء الاصطناعي:** [https://castov.com/mcp](https://castov.com/mcp)
* **أداة سطر الأوامر CLI:** [https://castov.com/cli](https://castov.com/cli)
* **موسوعة أخطاء المطورين:** [https://castov.com/errors](https://castov.com/errors)
