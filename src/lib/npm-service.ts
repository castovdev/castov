import { POPULAR_NPM_PACKAGES } from "./npm-data";

export interface NpmPackageReport {
  name: string;
  version: string;
  description: string;
  license: string;
  licenseType: "PERMISSIVE" | "COPYLEFT" | "PROPRIETARY" | "UNKNOWN";
  homepage?: string;
  repository?: string;
  publishedDate: string;
  unpackedSize: string;
  dependenciesCount: number;
  dependencies: Record<string, string>;
  maintainersCount: number;
  maintainers: string[];
  deprecated?: string | boolean;
  hasInstallScripts: boolean;
  installScripts: string[];
  isTyposquat: boolean;
  squattedTarget?: string;
  securityScore: number;
  securityGrade: "A+" | "A" | "B" | "C" | "D" | "F";
  riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  warnings: string[];
  weeklyDownloads?: number;
  hasTypes?: boolean;
}

const PERMISSIVE_LICENSES = new Set([
  "mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause", "isc", "unlicense", "0bsd"
]);

const COPYLEFT_LICENSES = new Set([
  "gpl-2.0", "gpl-3.0", "agpl-3.0", "lgpl-2.1", "lgpl-3.0", "mpl-2.0"
]);

export function normalizePackageName(input: string | string[]): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input || "");
  try {
    return decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function getNpmRegistryUrl(name: string): string {
  const clean = normalizePackageName(name);
  if (clean.startsWith("@")) {
    const segments = clean.slice(1).split("/");
    const scope = segments[0] || "";
    const pkg = segments.slice(1).join("/");
    const encodedScope = encodeURIComponent(scope);
    const encodedPkg = pkg.split("/").map(encodeURIComponent).join("/");
    return `https://registry.npmjs.org/@${encodedScope}/${encodedPkg}`;
  }
  return `https://registry.npmjs.org/${encodeURIComponent(clean)}`;
}

export async function fetchNpmPackageReport(
  packageName: string | string[]
): Promise<NpmPackageReport | null> {
  const cleanName = normalizePackageName(packageName);
  if (!cleanName) return null;

  try {
    const registryUrl = getNpmRegistryUrl(cleanName);

    const res = await fetch(registryUrl, {
      next: { revalidate: 86400 }, // Cache 24 hours
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`NPM registry returned status ${res.status}`);
    }

    const data = await res.json();
    const distTags = data["dist-tags"] || {};
    const latestTag = distTags.latest;
    const versions = data.versions || {};
    const versionData =
      (latestTag && versions[latestTag]) ||
      (data.version ? data : Object.values(versions).pop() || data);

    const latestVersion =
      versionData.version || latestTag || data.version || "1.0.0";

    // 1. License evaluation
    const rawLicense =
      typeof versionData.license === "string"
        ? versionData.license
        : versionData.license?.type || data.license || "MIT";

    const cleanLic = String(rawLicense).toLowerCase().trim();
    let licenseType: "PERMISSIVE" | "COPYLEFT" | "PROPRIETARY" | "UNKNOWN" = "UNKNOWN";
    if (PERMISSIVE_LICENSES.has(cleanLic)) {
      licenseType = "PERMISSIVE";
    } else if (COPYLEFT_LICENSES.has(cleanLic)) {
      licenseType = "COPYLEFT";
    }

    // 2. Install scripts detection
    const scripts = versionData.scripts || {};
    const installScripts: string[] = [];
    if (scripts.preinstall) installScripts.push(`preinstall: ${scripts.preinstall}`);
    if (scripts.postinstall) installScripts.push(`postinstall: ${scripts.postinstall}`);
    const hasInstallScripts = installScripts.length > 0;

    // 3. Typosquat check
    const { isSquat, target } = checkTyposquat(cleanName);

    // 4. Deprecation
    const deprecated = versionData.deprecated || data.deprecated || false;

    // 5. Size
    const dist = versionData.dist || {};
    const unpackedBytes = dist.unpackedSize || 0;
    const unpackedSize = formatBytes(unpackedBytes);

    // 6. Dependencies
    const dependencies = versionData.dependencies || {};
    const dependenciesCount = Object.keys(dependencies).length;

    // 7. Maintainers
    const rawMaintainers =
      Array.isArray(data.maintainers) && data.maintainers.length > 0
        ? data.maintainers
        : Array.isArray(versionData.maintainers)
        ? versionData.maintainers
        : [];
    const maintainersList = rawMaintainers.map(
      (m: any) => m.name || m.email || "Maintainer"
    );

    // 8. Published date
    let publishedDate = "Latest Stable";
    if (data.time && latestVersion && data.time[latestVersion]) {
      try {
        publishedDate = new Date(data.time[latestVersion]).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        );
      } catch {
        publishedDate = "Latest Stable";
      }
    }

    // 9. Warnings & Score calculation
    const warnings: string[] = [];
    let score = 100;

    if (isSquat) {
      score -= 50;
      warnings.push(`Suspected Typosquatting! Impersonates popular package "${target}".`);
    }

    if (hasInstallScripts) {
      score -= 25;
      warnings.push(`Contains automated install scripts (${installScripts.join(", ")}).`);
    }

    if (deprecated) {
      score -= 30;
      warnings.push(`This package is officially deprecated by its authors.`);
    }

    if (licenseType === "COPYLEFT") {
      score -= 15;
      warnings.push(`Reciprocal copyleft license (${rawLicense}). May infect proprietary code.`);
    }

    if (maintainersList.length === 1 && !POPULAR_NPM_PACKAGES.includes(cleanName)) {
      score -= 10;
      warnings.push(`Single maintainer supply-chain dependency risk.`);
    }

    score = Math.max(0, Math.min(100, score));
    const securityGrade = scoreToGrade(score);

    let riskLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "SAFE";
    if (isSquat || score < 40) riskLevel = "CRITICAL";
    else if (score < 65) riskLevel = "HIGH";
    else if (score < 85) riskLevel = "MEDIUM";
    else if (score < 95) riskLevel = "LOW";

    let repoUrl = "";
    const repoSource = versionData.repository || data.repository;
    if (typeof repoSource === "string") {
      repoUrl = repoSource;
    } else if (repoSource?.url) {
      repoUrl = repoSource.url.replace(/^git\+/, "").replace(/\.git$/, "");
    }

    const hasTypes = Boolean(
      versionData.types ||
      versionData.typings ||
      cleanName.startsWith("@types/") ||
      (versionData.devDependencies && versionData.devDependencies[`@types/${cleanName}`])
    );

    const weeklyDownloads = await fetchWeeklyDownloads(cleanName);

    return {
      name: data.name || cleanName,
      version: latestVersion,
      description: data.description || versionData.description || "NPM package utility.",
      license: String(rawLicense),
      licenseType,
      homepage: data.homepage || versionData.homepage,
      repository: repoUrl || undefined,
      publishedDate,
      unpackedSize,
      dependenciesCount,
      dependencies,
      maintainersCount: maintainersList.length,
      maintainers: maintainersList.slice(0, 5),
      deprecated,
      hasInstallScripts,
      installScripts,
      isTyposquat: isSquat,
      squattedTarget: target || undefined,
      securityScore: score,
      securityGrade,
      riskLevel,
      warnings,
      weeklyDownloads,
      hasTypes,
    };
  } catch (err) {
    return null;
  }
}

async function fetchWeeklyDownloads(name: string): Promise<number> {
  try {
    const res = await fetch(`https://api.npmjs.org/downloads/point/last-week/${name}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return typeof json.downloads === "number" ? json.downloads : 0;
  } catch {
    return 0;
  }
}

function checkTyposquat(name: string): { isSquat: boolean; target?: string } {
  if (POPULAR_NPM_PACKAGES.includes(name)) return { isSquat: false };

  for (const pop of POPULAR_NPM_PACKAGES) {
    if (pop.includes("-")) {
      const noHyphen = pop.replace(/-/g, "");
      if (name === noHyphen) return { isSquat: true, target: pop };
    }
    if (name.length === pop.length + 1 && name.startsWith(pop)) {
      return { isSquat: true, target: pop };
    }
    if (name === `${pop}.js`) {
      return { isSquat: true, target: pop };
    }
    if (Math.abs(name.length - pop.length) <= 1 && pop.length >= 5) {
      if (levenshtein(name, pop) === 1) {
        return { isSquat: true, target: pop };
      }
    }
  }

  return { isSquat: false };
}

function levenshtein(a: string, b: string): number {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function scoreToGrade(score: number): "A+" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}
