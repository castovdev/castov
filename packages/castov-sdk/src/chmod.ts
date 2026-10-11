export interface ChmodPermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  octal: number;
  symbolic: string;
  description: string;
}

export interface ChmodResult {
  octal: string;
  octal4: string;
  symbolic: string;
  owner: ChmodPermissions;
  group: ChmodPermissions;
  others: ChmodPermissions;
  command: string;
  warning?: string;
}

function parseDigit(digit: number): ChmodPermissions {
  const read = (digit & 4) !== 0;
  const write = (digit & 2) !== 0;
  const execute = (digit & 1) !== 0;
  const symbolic = (read ? "r" : "-") + (write ? "w" : "-") + (execute ? "x" : "-");

  const parts: string[] = [];
  if (read) parts.push("Read");
  if (write) parts.push("Write");
  if (execute) parts.push("Execute");

  return {
    read,
    write,
    execute,
    octal: digit,
    symbolic,
    description: parts.length > 0 ? parts.join(", ") : "None",
  };
}

function parseSymbolicTriplet(str: string): number {
  if (str.length !== 3) throw new Error(`Invalid permission triplet: "${str}"`);
  let val = 0;
  if (str[0] === "r") val += 4;
  else if (str[0] !== "-") throw new Error(`Invalid read flag: "${str[0]}"`);

  if (str[1] === "w") val += 2;
  else if (str[1] !== "-") throw new Error(`Invalid write flag: "${str[1]}"`);

  if (str[2] === "x") val += 1;
  else if (str[2] !== "-") throw new Error(`Invalid execute flag: "${str[2]}"`);

  return val;
}

/**
 * Parses octal (e.g. 755, "755", "0755") or symbolic ("rwxr-xr-x", "-rwxr-xr-x") chmod notation.
 */
export function chmod(input: string | number): ChmodResult {
  let octalStr = "";

  if (typeof input === "number") {
    octalStr = String(input);
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (/^[0-7]{3,4}$/.test(trimmed)) {
      octalStr = trimmed.length === 4 ? trimmed.slice(1) : trimmed;
    } else {
      // Symbolic mode
      let s = trimmed;
      if (s.length === 10 && (s[0] === "-" || s[0] === "d" || s[0] === "l")) {
        s = s.slice(1);
      }
      if (s.length !== 9) {
        throw new Error(
          `chmod: invalid input "${input}". Expected 3-digit octal (e.g. 755) or 9-character symbolic (e.g. rwxr-xr-x)`
        );
      }
      const d1 = parseSymbolicTriplet(s.slice(0, 3));
      const d2 = parseSymbolicTriplet(s.slice(3, 6));
      const d3 = parseSymbolicTriplet(s.slice(6, 9));
      octalStr = `${d1}${d2}${d3}`;
    }
  } else {
    throw new TypeError("chmod: input must be a string or number");
  }

  if (octalStr.length !== 3) {
    throw new Error(`chmod: invalid octal code "${input}"`);
  }

  const dOwner = parseInt(octalStr[0], 10);
  const dGroup = parseInt(octalStr[1], 10);
  const dOthers = parseInt(octalStr[2], 10);

  const owner = parseDigit(dOwner);
  const group = parseDigit(dGroup);
  const others = parseDigit(dOthers);
  const symbolic = `${owner.symbolic}${group.symbolic}${others.symbolic}`;

  let warning: string | undefined;
  if (octalStr === "777") {
    warning = "777 grants full read, write, and execute permissions to all users. Highly insecure for production environments.";
  } else if (octalStr === "000") {
    warning = "000 removes all permissions for everyone including the file owner.";
  } else if (others.write) {
    warning = "Public write permission enabled (world-writable). Anyone on the system can modify this file.";
  }

  return {
    octal: octalStr,
    octal4: `0${octalStr}`,
    symbolic,
    owner,
    group,
    others,
    command: `chmod ${octalStr} <file>`,
    warning,
  };
}
