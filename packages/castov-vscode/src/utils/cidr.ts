/**
 * Castov CIDR / Subnet Calculator Utilities
 * Computes IPv4 subnet masks, host ranges, broadcast addresses, and classifications.
 */

export interface CidrCalculation {
  cidr: string;
  ip: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipType: string;
}

function ipToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join(".");
}

export function parseCidr(cidrStr: string): CidrCalculation | null {
  const match = cidrStr.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) return null;

  const ip = match[1];
  const prefix = parseInt(match[2], 10);

  if (prefix < 0 || prefix > 32) return null;

  const octets = ip.split(".").map((o) => parseInt(o, 10));
  if (octets.some((o) => isNaN(o) || o < 0 || o > 255)) return null;

  const ipLong = ipToLong(ip);
  const maskLong = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcardLong = ~maskLong >>> 0;
  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | wildcardLong) >>> 0;

  const netmask = longToIp(maskLong);
  const wildcard = longToIp(wildcardLong);
  const networkAddress = longToIp(networkLong);
  const broadcastAddress = longToIp(broadcastLong);

  const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
  let usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : totalHosts - 2;
  if (usableHosts < 0) usableHosts = 0;

  let firstUsableLong = prefix >= 31 ? networkLong : networkLong + 1;
  let lastUsableLong = prefix >= 31 ? broadcastLong : broadcastLong - 1;

  if (prefix === 32) {
    firstUsableLong = ipLong;
    lastUsableLong = ipLong;
  }

  const firstUsableIp = longToIp(firstUsableLong);
  const lastUsableIp = longToIp(lastUsableLong);

  // Classify IP
  let ipType = "Public IPv4";
  if (octets[0] === 10) {
    ipType = "Private (RFC 1918 Class A)";
  } else if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
    ipType = "Private (RFC 1918 Class B)";
  } else if (octets[0] === 192 && octets[1] === 168) {
    ipType = "Private (RFC 1918 Class C)";
  } else if (octets[0] === 127) {
    ipType = "Loopback";
  } else if (octets[0] === 169 && octets[1] === 254) {
    ipType = "Link-Local (APIPA)";
  }

  return {
    cidr: `${ip}/${prefix}`,
    ip,
    prefix,
    netmask,
    wildcard,
    networkAddress,
    broadcastAddress,
    firstUsableIp,
    lastUsableIp,
    totalHosts,
    usableHosts,
    ipType,
  };
}
