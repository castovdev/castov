export interface NetworkPortInfo {
  port: number;
  service: string;
  protocol: "TCP" | "UDP" | "TCP/UDP";
  category: "Web & HTTP" | "Database & Cache" | "Dev & Localhost" | "Email & Messaging" | "Security & Remote" | "Infrastructure & Cloud";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  summary: string;
  description: string;
  defaultProcess: string;
  dockerFlag: string;
}

export const NETWORK_PORTS: NetworkPortInfo[] = [
  { port: 20, service: "FTP Data", protocol: "TCP", category: "Security & Remote", riskLevel: "High", summary: "File Transfer Protocol (Data Channel)", description: "Used by FTP servers to transfer file data between client and server. Unencrypted by default; prefer SFTP (Port 22).", defaultProcess: "vsftpd / proftpd", dockerFlag: "-p 20:20" },
  { port: 21, service: "FTP Control", protocol: "TCP", category: "Security & Remote", riskLevel: "High", summary: "File Transfer Protocol (Command Control)", description: "Primary control port for FTP authentication and commands. Vulnerable to plaintext credential sniffing unless FTPS is enforced.", defaultProcess: "vsftpd", dockerFlag: "-p 21:21" },
  { port: 22, service: "SSH / SFTP", protocol: "TCP", category: "Security & Remote", riskLevel: "Medium", summary: "Secure Shell, SCP, SFTP, and Port Forwarding", description: "Standard port for encrypted remote administration, Git over SSH, and SFTP file transfers. Harden with key-based authentication and fail2ban.", defaultProcess: "sshd", dockerFlag: "-p 2222:22" },
  { port: 23, service: "Telnet", protocol: "TCP", category: "Security & Remote", riskLevel: "Critical", summary: "Unencrypted Text Communications", description: "Legacy remote terminal protocol that transmits all traffic including passwords in plaintext. Should be disabled in favor of SSH (Port 22).", defaultProcess: "telnetd", dockerFlag: "-p 23:23" },
  { port: 25, service: "SMTP", protocol: "TCP", category: "Email & Messaging", riskLevel: "High", summary: "Simple Mail Transfer Protocol (Server-to-Server Relay)", description: "Standard port for relaying email between mail servers (MTAs). Often blocked by cloud providers (AWS, GCP, DigitalOcean) to prevent spam.", defaultProcess: "postfix / exim", dockerFlag: "-p 25:25" },
  { port: 53, service: "DNS", protocol: "TCP/UDP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "Domain Name System Resolver & Server", description: "Translates domain names to IP addresses. Uses UDP for standard queries and TCP for zone transfers (AXFR) or responses exceeding 512 bytes.", defaultProcess: "named / systemd-resolved / dnsmasq", dockerFlag: "-p 53:53/udp -p 53:53/tcp" },
  { port: 80, service: "HTTP", protocol: "TCP", category: "Web & HTTP", riskLevel: "Medium", summary: "Hypertext Transfer Protocol (Unencrypted Web)", description: "Default port for unencrypted web traffic. In modern production setups, Port 80 immediately redirects (HTTP 301) to HTTPS on Port 443.", defaultProcess: "nginx / apache2 / caddy", dockerFlag: "-p 80:80" },
  { port: 110, service: "POP3", protocol: "TCP", category: "Email & Messaging", riskLevel: "Medium", summary: "Post Office Protocol v3 (Unencrypted)", description: "Used by email clients to retrieve messages from a mail server. Superseded by encrypted POP3S on Port 995.", defaultProcess: "dovecot", dockerFlag: "-p 110:110" },
  { port: 123, service: "NTP", protocol: "UDP", category: "Infrastructure & Cloud", riskLevel: "Low", summary: "Network Time Protocol Clock Sync", description: "Synchronizes system clocks across servers over packet-switched networks.", defaultProcess: "ntpd / chronyd", dockerFlag: "-p 123:123/udp" },
  { port: 143, service: "IMAP", protocol: "TCP", category: "Email & Messaging", riskLevel: "Medium", summary: "Internet Message Access Protocol", description: "Retrieves and syncs email messages across multiple devices. Use IMAPS (Port 993) for TLS encryption.", defaultProcess: "dovecot", dockerFlag: "-p 143:143" },
  { port: 443, service: "HTTPS", protocol: "TCP/UDP", category: "Web & HTTP", riskLevel: "Low", summary: "HTTP Secure over TLS/SSL & HTTP/3 (QUIC)", description: "Standard port for all encrypted web traffic, REST APIs, GraphQL endpoints, and WebSockets (wss://). HTTP/3 uses UDP on port 443.", defaultProcess: "nginx / caddy / traefik", dockerFlag: "-p 443:443" },
  { port: 445, service: "SMB", protocol: "TCP", category: "Security & Remote", riskLevel: "Critical", summary: "Server Message Block (Windows File Sharing)", description: "Provides shared access to files and printers across networks. Never expose Port 445 directly to the public internet.", defaultProcess: "smbd / System", dockerFlag: "-p 445:445" },
  { port: 465, service: "SMTPS", protocol: "TCP", category: "Email & Messaging", riskLevel: "Low", summary: "Authenticated SMTP over Implicit TLS", description: "Modern secure port for email submission by mail clients using implicit TLS encryption.", defaultProcess: "postfix", dockerFlag: "-p 465:465" },
  { port: 587, service: "SMTP Submission", protocol: "TCP", category: "Email & Messaging", riskLevel: "Low", summary: "Authenticated Email Submission (STARTTLS)", description: "Standard port used by web apps (Nodemailer, Resend, SendGrid, AWS SES) to send transactional emails via STARTTLS.", defaultProcess: "postfix", dockerFlag: "-p 587:587" },
  { port: 993, service: "IMAPS", protocol: "TCP", category: "Email & Messaging", riskLevel: "Low", summary: "IMAP over TLS/SSL", description: "Secure encrypted email retrieval and folder synchronization.", defaultProcess: "dovecot", dockerFlag: "-p 993:993" },
  { port: 995, service: "POP3S", protocol: "TCP", category: "Email & Messaging", riskLevel: "Low", summary: "POP3 over TLS/SSL", description: "Encrypted POP3 mail retrieval over SSL/TLS.", defaultProcess: "dovecot", dockerFlag: "-p 995:995" },
  { port: 1433, service: "MS SQL Server", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "Microsoft SQL Server Database Engine", description: "Default port for Microsoft SQL Server client connections. Restrict to private VPC subnets.", defaultProcess: "sqlservr", dockerFlag: "-p 1433:1433" },
  { port: 1521, service: "Oracle DB", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "Oracle Net Listener", description: "Default communication port for Oracle Database connections.", defaultProcess: "tnslsnr", dockerFlag: "-p 1521:1521" },
  { port: 2375, service: "Docker Daemon", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Critical", summary: "Unencrypted Docker Remote API", description: "Unauthenticated Docker daemon socket over TCP. Exposing this publicly grants instant root host takeover.", defaultProcess: "dockerd", dockerFlag: "-p 2375:2375" },
  { port: 2376, service: "Docker TLS", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "Encrypted Docker Remote API", description: "TLS-secured Docker daemon communication port.", defaultProcess: "dockerd", dockerFlag: "-p 2376:2376" },
  { port: 3000, service: "Next.js / Node / React", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Default Local Development Server (Next.js, Express, Grafana)", description: "The most common development port used by Next.js, Create React App, Express.js, Ruby on Rails, and Grafana dashboards.", defaultProcess: "node / next-server", dockerFlag: "-p 3000:3000" },
  { port: 3306, service: "MySQL / MariaDB", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "MySQL & MariaDB Relational Database", description: "Default port for MySQL, MariaDB, and Percona Server connections. Should never be bound to 0.0.0.0 on public servers without firewall restrictions.", defaultProcess: "mysqld / mariadbd", dockerFlag: "-p 3306:3306" },
  { port: 3389, service: "RDP", protocol: "TCP/UDP", category: "Security & Remote", riskLevel: "Critical", summary: "Microsoft Remote Desktop Protocol", description: "Provides graphical remote desktop access to Windows servers. Frequently targeted by brute-force bots; place behind a VPN or Bastion host.", defaultProcess: "svchost.exe (TermService)", dockerFlag: "-p 3389:3389" },
  { port: 4000, service: "GraphQL / Phoenix / Ghost", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Apollo GraphQL Server & Elixir Phoenix Dev Port", description: "Default port for Apollo Server, Elixir Phoenix framework, and Jekyll local previews.", defaultProcess: "node / beam.smp", dockerFlag: "-p 4000:4000" },
  { port: 4200, service: "Angular CLI", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Angular Development Server (ng serve)", description: "Default local dev port when running `ng serve` in Angular projects.", defaultProcess: "node", dockerFlag: "-p 4200:4200" },
  { port: 5000, service: "Flask / .NET / AirPlay", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Medium", summary: "Python Flask, ASP.NET Core, Docker Registry & macOS AirPlay", description: "Used by Python Flask, Docker private registries, and macOS ControlCenter (AirPlay Receiver). On macOS, disable AirPlay Receiver if port 5000 is blocked.", defaultProcess: "python / ControlCenter", dockerFlag: "-p 5000:5000" },
  { port: 5173, service: "Vite Dev Server", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Vite Frontend Build Tool (React, Vue, Svelte)", description: "Default hot-module-replacement (HMR) development server port for Vite.", defaultProcess: "node", dockerFlag: "-p 5173:5173" },
  { port: 5432, service: "PostgreSQL", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "PostgreSQL Database Server & Supabase Local", description: "Standard port for PostgreSQL connections. Used by Prisma, Drizzle, TypeORM, and backend services.", defaultProcess: "postgres", dockerFlag: "-p 5432:5432" },
  { port: 5672, service: "RabbitMQ (AMQP)", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "High", summary: "Advanced Message Queuing Protocol", description: "Default port for RabbitMQ message broker connections.", defaultProcess: "beam.smp", dockerFlag: "-p 5672:5672" },
  { port: 6379, service: "Redis / Valkey", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "Redis In-Memory Data Store & Cache", description: "Default port for Redis and Valkey. Unauthenticated Redis instances exposed to the internet are immediately compromised.", defaultProcess: "redis-server", dockerFlag: "-p 6379:6379" },
  { port: 6443, service: "Kubernetes API", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "High", summary: "Kubernetes Control Plane API Server", description: "HTTPS endpoint for kubectl and cluster communication with the Kubernetes kube-apiserver.", defaultProcess: "kube-apiserver", dockerFlag: "-p 6443:6443" },
  { port: 8000, service: "Django / FastAPI / Uvicorn", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Python Web Frameworks & PHP Artisan Serve", description: "Default development port for Python Django, FastAPI (Uvicorn), `python -m http.server`, and Laravel `php artisan serve`.", defaultProcess: "python / php", dockerFlag: "-p 8000:8000" },
  { port: 8080, service: "HTTP Alternate / Tomcat / Proxy", protocol: "TCP", category: "Web & HTTP", riskLevel: "Medium", summary: "Alternative HTTP Port, Spring Boot, Jenkins & Reverse Proxies", description: "Widely used for Java Spring Boot, Apache Tomcat, Jenkins CI, cAdvisor, and non-root HTTP servers.", defaultProcess: "java / nginx / node", dockerFlag: "-p 8080:8080" },
  { port: 8443, service: "HTTPS Alternate", protocol: "TCP", category: "Web & HTTP", riskLevel: "Low", summary: "Alternative HTTPS Port & UniFi Controller", description: "Common alternative port for SSL/TLS web applications running without root privileges.", defaultProcess: "java / nginx", dockerFlag: "-p 8443:8443" },
  { port: 8888, service: "Jupyter Notebook", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Medium", summary: "JupyterLab & Interactive Python Notebooks", description: "Default local web server port for Jupyter Notebook and JupyterLab data science environments.", defaultProcess: "jupyter-notebook", dockerFlag: "-p 8888:8888" },
  { port: 9000, service: "PHP-FPM / SonarQube / MinIO", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "PHP FastCGI Process Manager, MinIO S3 & Portainer", description: "Used by PHP-FPM upstream sockets, MinIO object storage API, SonarQube, and ClickHouse native protocol.", defaultProcess: "php-fpm / minio", dockerFlag: "-p 9000:9000" },
  { port: 9090, service: "Prometheus / Cockpit", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "Prometheus Metrics Server & Linux Cockpit Web UI", description: "Default port for Prometheus time-series monitoring and Red Hat/Ubuntu Cockpit server manager.", defaultProcess: "prometheus", dockerFlag: "-p 9090:9090" },
  { port: 9200, service: "Elasticsearch", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "Elasticsearch REST HTTP API", description: "Primary HTTP port for Elasticsearch search and analytics engine queries.", defaultProcess: "java (elasticsearch)", dockerFlag: "-p 9200:9200" },
  { port: 11211, service: "Memcached", protocol: "TCP/UDP", category: "Database & Cache", riskLevel: "Critical", summary: "Memcached Distributed Memory Caching", description: "High-performance distributed memory object caching system. Must never be exposed on UDP to the public internet (DDoS amplification risk).", defaultProcess: "memcached", dockerFlag: "-p 11211:11211" },
  { port: 11434, service: "Ollama Local LLM", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Medium", summary: "Ollama Local AI Model Server REST API", description: "Default local HTTP API port for running Llama 3, Mistral, DeepSeek, and Qwen models via Ollama.", defaultProcess: "ollama", dockerFlag: "-p 11434:11434" },
  { port: 15672, service: "RabbitMQ Management", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "RabbitMQ Web Management Dashboard", description: "HTTP admin UI and monitoring API for RabbitMQ clusters.", defaultProcess: "beam.smp", dockerFlag: "-p 15672:15672" },
  { port: 27017, service: "MongoDB", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "MongoDB NoSQL Database Server (mongod)", description: "Default port for MongoDB database instances and mongos routers. Enforce authentication and bind to localhost/VPC.", defaultProcess: "mongod", dockerFlag: "-p 27017:27017" },
  { port: 3001, service: "Node.js / Next.js Fallback & Uptime Kuma", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Secondary Node.js Dev Server, NestJS API & Uptime Kuma", description: "Commonly used as the fallback port when Port 3000 is in use, or as the dedicated backend API port alongside a frontend on 3000. Inspect or free with `npx castov port 3001`.", defaultProcess: "node", dockerFlag: "-p 3001:3001" },
  { port: 3002, service: "Microservice Dev HTTP", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Tertiary Local Development & Monorepo Service Port", description: "Frequently assigned to auxiliary microservices, Storybook, or Turborepo apps in multi-app local workspaces.", defaultProcess: "node", dockerFlag: "-p 3002:3002" },
  { port: 3030, service: "Express / FeathersJS / Actix", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Rust Actix, FeathersJS & Local API Server", description: "Popular default port for Rust web servers, FeathersJS APIs, and local static file servers.", defaultProcess: "node / cargo", dockerFlag: "-p 3030:3030" },
  { port: 4001, service: "IPFS API / etcd Client", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "IPFS P2P Swarm & CoreOS etcd", description: "Used by IPFS swarm peers and legacy etcd cluster endpoints.", defaultProcess: "ipfs / etcd", dockerFlag: "-p 4001:4001" },
  { port: 4317, service: "OpenTelemetry Collector (gRPC)", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Low", summary: "OTLP over gRPC Telemetry Ingestion", description: "Standard IANA-registered port for OpenTelemetry Protocol (OTLP) trace, metric, and log ingestion over gRPC.", defaultProcess: "otelcol / jaeger", dockerFlag: "-p 4317:4317" },
  { port: 4318, service: "OpenTelemetry Collector (HTTP)", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Low", summary: "OTLP over HTTP/Protobuf & JSON Ingestion", description: "Standard port for sending OpenTelemetry traces and metrics over HTTP/1.1 or HTTP/2 without gRPC.", defaultProcess: "otelcol / jaeger", dockerFlag: "-p 4318:4318" },
  { port: 4566, service: "LocalStack AWS Emulator", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Low", summary: "LocalStack Unified AWS Edge Gateway", description: "Single entry-point edge port emulating AWS S3, Lambda, DynamoDB, SQS, and SNS locally in Docker.", defaultProcess: "python / localstack", dockerFlag: "-p 4566:4566" },
  { port: 5001, service: "Flask Fallback / Synology DSM / IPFS API", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Medium", summary: "Python Flask Alternative Port (Avoiding macOS AirPlay on 5000)", description: "Widely used by Python Flask/FastAPI developers on macOS because Apple AirPlay Receiver occupies port 5000 by default.", defaultProcess: "python / gunicorn", dockerFlag: "-p 5001:5001" },
  { port: 5174, service: "Vite Fallback Dev Server", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Secondary Vite HMR Server", description: "Automatically selected by Vite when default port 5173 is already occupied by another running frontend instance.", defaultProcess: "node", dockerFlag: "-p 5174:5174" },
  { port: 5433, service: "PostgreSQL Alternate Instance", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Secondary PostgreSQL Cluster or PgBouncer", description: "Standard secondary port when running multiple PostgreSQL versions side-by-side or tunneling a staging database locally.", defaultProcess: "postgres", dockerFlag: "-p 5433:5432" },
  { port: 5555, service: "Prisma Studio / Flower Celery", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Medium", summary: "Prisma Studio Database GUI & Celery Flower Monitor", description: "Default local browser GUI port launched by `npx prisma studio` for inspecting and editing database records.", defaultProcess: "node (prisma)", dockerFlag: "-p 5555:5555" },
  { port: 6006, service: "Storybook / TensorBoard", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Storybook UI Component Explorer & PyTorch/TF TensorBoard", description: "Default port for Frontend Storybook (`npm run storybook`) and Machine Learning TensorBoard visualizations.", defaultProcess: "node / tensorboard", dockerFlag: "-p 6006:6006" },
  { port: 6333, service: "Qdrant Vector Database", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Qdrant Vector Search Engine REST API & Web UI", description: "Default HTTP REST API and dashboard port for Qdrant AI embeddings and RAG vector search.", defaultProcess: "qdrant", dockerFlag: "-p 6333:6333" },
  { port: 7000, service: "Cassandra / AirPlay /ScyllaDB", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Apache Cassandra Intra-Node Cluster Communication & macOS AirPlay", description: "Used by Apache Cassandra and ScyllaDB for inter-node gossip/clustering, as well as macOS AirPlay RTSP.", defaultProcess: "java / ControlCenter", dockerFlag: "-p 7000:7000" },
  { port: 7474, service: "Neo4j Graph DB Browser", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Neo4j HTTP Web Interface & Cypher Query Console", description: "Default HTTP browser dashboard port for Neo4j graph databases.", defaultProcess: "java (neo4j)", dockerFlag: "-p 7474:7474" },
  { port: 7687, service: "Neo4j Bolt Protocol", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Neo4j Binary Bolt Driver Connection Port", description: "High-performance binary Bolt protocol port used by backend drivers connecting to Neo4j.", defaultProcess: "java (neo4j)", dockerFlag: "-p 7687:7687" },
  { port: 7700, service: "Meilisearch", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Meilisearch Lightning-Fast Full-Text & Vector Search API", description: "Default HTTP REST API port for Meilisearch instances.", defaultProcess: "meilisearch", dockerFlag: "-p 7700:7700" },
  { port: 8001, service: "Kong Admin / ChromaDB / Django Alt", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "High", summary: "Kong API Gateway Admin API & Chroma Vector DB", description: "Used by Kong API Gateway administration and local ChromaDB AI vector servers.", defaultProcess: "nginx / python", dockerFlag: "-p 8001:8001" },
  { port: 8081, service: "React Native Metro / Nexus / Flink", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "React Native & Expo Metro JavaScript Bundler", description: "Default bundler port for React Native (`npx react-native start`) and Sonatype Nexus Repository Manager.", defaultProcess: "node (metro)", dockerFlag: "-p 8081:8081" },
  { port: 8090, service: "PocketBase / Confluence / Traefik", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Medium", summary: "PocketBase Go Backend-in-a-Box API & Admin UI", description: "Default HTTP port for PocketBase SQLite backend (`./pocketbase serve`).", defaultProcess: "pocketbase", dockerFlag: "-p 8090:8090" },
  { port: 8123, service: "ClickHouse HTTP / Home Assistant", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "ClickHouse OLAP HTTP SQL Interface & Home Assistant", description: "Default HTTP query interface for ClickHouse analytical databases and Home Assistant dashboards.", defaultProcess: "clickhouse-server", dockerFlag: "-p 8123:8123" },
  { port: 8200, service: "HashiCorp Vault", protocol: "TCP", category: "Security & Remote", riskLevel: "Critical", summary: "HashiCorp Vault Secrets Management HTTP API & UI", description: "Default port for HashiCorp Vault secret engine API and web UI.", defaultProcess: "vault", dockerFlag: "-p 8200:8200" },
  { port: 8500, service: "HashiCorp Consul", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "High", summary: "Consul Service Discovery HTTP API & Web UI", description: "Used by HashiCorp Consul for service mesh catalog queries, KV store, and health checks.", defaultProcess: "consul", dockerFlag: "-p 8500:8500" },
  { port: 8501, service: "Streamlit Python AI Apps", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Streamlit Data Science & AI Web App Server", description: "Default local web server port when running `streamlit run app.py`.", defaultProcess: "python (streamlit)", dockerFlag: "-p 8501:8501" },
  { port: 8787, service: "Cloudflare Workers (Wrangler Dev)", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Cloudflare Wrangler Local Edge Runtime (workerd)", description: "Default local development port when running `npx wrangler dev` for Cloudflare Workers and Pages Functions.", defaultProcess: "workerd / node", dockerFlag: "-p 8787:8787" },
  { port: 9001, service: "MinIO Web Console / Supervisor", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "Medium", summary: "MinIO S3 Object Storage Admin Console & PHP Xdebug", description: "Default web administration dashboard port for MinIO S3-compatible object storage.", defaultProcess: "minio", dockerFlag: "-p 9001:9001" },
  { port: 9092, service: "Apache Kafka / Redpanda", protocol: "TCP", category: "Infrastructure & Cloud", riskLevel: "High", summary: "Apache Kafka & Redpanda Event Streaming Broker", description: "Standard PLAINTEXT/SASL client connection port for Apache Kafka and Redpanda event streaming brokers.", defaultProcess: "java (kafka) / redpanda", dockerFlag: "-p 9092:9092" },
  { port: 19530, service: "Milvus Vector Database", protocol: "TCP", category: "Database & Cache", riskLevel: "High", summary: "Milvus Distributed AI Vector Database gRPC Port", description: "Primary gRPC client connection port for Milvus vector similarity search clusters.", defaultProcess: "milvus", dockerFlag: "-p 19530:19530" },
  { port: 26257, service: "CockroachDB SQL", protocol: "TCP", category: "Database & Cache", riskLevel: "Critical", summary: "CockroachDB Distributed SQL Wire Protocol", description: "PostgreSQL-compatible SQL wire protocol port used by CockroachDB nodes.", defaultProcess: "cockroach", dockerFlag: "-p 26257:26257" },
  { port: 54321, service: "Supabase Local API (Kong)", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Supabase CLI Local REST, Auth, Storage & Realtime Gateway", description: "Default local API gateway port started by `npx supabase start`.", defaultProcess: "docker-proxy (kong)", dockerFlag: "-p 54321:8000" },
  { port: 54322, service: "Supabase Local PostgreSQL", protocol: "TCP", category: "Database & Cache", riskLevel: "Medium", summary: "Supabase CLI Local PostgreSQL Database Instance", description: "Default local PostgreSQL port exposed by `npx supabase start` (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`).", defaultProcess: "docker-proxy (postgres)", dockerFlag: "-p 54322:5432" },
  { port: 54323, service: "Supabase Local Studio UI", protocol: "TCP", category: "Dev & Localhost", riskLevel: "Low", summary: "Supabase Studio Local Web Dashboard", description: "Default local browser dashboard port (`http://127.0.0.1:54323`) for managing tables, RLS policies, and SQL queries in Supabase CLI.", defaultProcess: "docker-proxy (studio)", dockerFlag: "-p 54323:3000" },
];

export function getPortByNumber(portNum: number): NetworkPortInfo | undefined {
  return NETWORK_PORTS.find((p) => p.port === portNum);
}

export interface CidrBlockInfo {
  prefix: number;
  subnetMask: string;
  wildcardMask: string;
  totalIps: number;
  usableHosts: number;
  classType: string;
  commonUse: string;
}

function prefixToMask(prefix: number): { mask: string; wildcard: string } {
  const maskOctets: number[] = [];
  const wildOctets: number[] = [];
  for (let i = 0; i < 4; i++) {
    const bits = Math.min(8, Math.max(0, prefix - i * 8));
    const val = bits === 0 ? 0 : (0xff << (8 - bits)) & 0xff;
    maskOctets.push(val);
    wildOctets.push(255 - val);
  }
  return { mask: maskOctets.join("."), wildcard: wildOctets.join(".") };
}

export const CIDR_BLOCKS: CidrBlockInfo[] = Array.from({ length: 25 }, (_, idx) => {
  const prefix = idx + 8; // /8 to /32
  const { mask, wildcard } = prefixToMask(prefix);
  const totalIps = Math.pow(2, 32 - prefix);
  const usableHosts = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.max(0, totalIps - 2);
  let classType = "Class C / Subnet";
  if (prefix < 16) classType = "Class A / Large Enterprise VPC";
  else if (prefix < 24) classType = "Class B / Cloud VPC Block";

  let commonUse = "Standard network segmentation";
  if (prefix === 8) commonUse = "Entire 10.0.0.0/8 private RFC 1918 block (16.7M IPs)";
  else if (prefix === 16) commonUse = "Standard AWS / GCP / Azure VPC root block (65,536 IPs)";
  else if (prefix === 20) commonUse = "Default AWS Availability Zone public/private subnet (4,096 IPs)";
  else if (prefix === 24) commonUse = "Most common LAN / Docker / Kubernetes subnet (254 usable hosts)";
  else if (prefix === 28) commonUse = "Small microservice or load-balancer subnet (14 usable hosts)";
  else if (prefix === 30) commonUse = "Point-to-point router link (2 usable hosts)";
  else if (prefix === 32) commonUse = "Single host route / Firewall allowlist IP (1 exact IP)";

  return {
    prefix,
    subnetMask: mask,
    wildcardMask: wildcard,
    totalIps,
    usableHosts,
    classType,
    commonUse,
  };
});

export function getCidrByPrefix(prefix: number): CidrBlockInfo | undefined {
  return CIDR_BLOCKS.find((c) => c.prefix === prefix);
}
