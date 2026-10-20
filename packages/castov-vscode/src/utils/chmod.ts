/**
 * Castov Chmod Permissions Utilities
 * Converts octal chmod notation (e.g. 755, 644, 777, 0755) to human-readable permission matrices
 */

export interface ChmodDetails {
  octal: string;
  symbolic: string;
  owner: { read: boolean; write: boolean; execute: boolean; summary: string };
  group: { read: boolean; write: boolean; execute: boolean; summary: string };
  others: { read: boolean; write: boolean; execute: boolean; summary: string };
  special?: { setuid: boolean; setgid: boolean; sticky: boolean };
}

function parseDigit(digit: number): { read: boolean; write: boolean; execute: boolean; summary: string } {
  const read = (digit & 4) !== 0;
  const write = (digit & 2) !== 0;
  const execute = (digit & 1) !== 0;

  const parts: string[] = [];
  if (read) parts.push("Read");
  if (write) parts.push("Write");
  if (execute) parts.push("Execute");

  return {
    read,
    write,
    execute,
    summary: parts.length > 0 ? parts.join(", ") : "None (No Access)",
  };
}

export function parseChmod(raw: string): ChmodDetails | null {
  const cleaned = raw.trim();
  if (!/^(?:0?[0-7]{3}|[0-7]{4})$/.test(cleaned)) return null;

  const digits = cleaned.length === 4 && cleaned.startsWith("0")
    ? cleaned.slice(1)
    : cleaned;

  if (digits.length === 3) {
    const u = parseInt(digits[0], 10);
    const g = parseInt(digits[1], 10);
    const o = parseInt(digits[2], 10);

    const owner = parseDigit(u);
    const group = parseDigit(g);
    const others = parseDigit(o);

    const sym = [
      "-",
      owner.read ? "r" : "-",
      owner.write ? "w" : "-",
      owner.execute ? "x" : "-",
      group.read ? "r" : "-",
      group.write ? "w" : "-",
      group.execute ? "x" : "-",
      others.read ? "r" : "-",
      others.write ? "w" : "-",
      others.execute ? "x" : "-",
    ].join("");

    return {
      octal: digits,
      symbolic: sym,
      owner,
      group,
      others,
    };
  }

  return null;
}
