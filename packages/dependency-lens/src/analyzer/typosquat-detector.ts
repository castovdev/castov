const POPULAR_PACKAGES = new Set([
  "express", "react", "react-dom", "lodash", "axios", "chalk", "commander",
  "vue", "next", "typescript", "webpack", "esbuild", "dotenv", "cross-env",
  "eslint", "prettier", "jest", "mocha", "tslib", "debug", "glob", "semver",
  "uuid", "moment", "rxjs", "dayjs", "bcrypt", "cors", "cookie-parser",
  "jsonwebtoken", "multer", "socket.io", "mongoose", "prisma", "pg", "redis",
  "nodemon", "supertest", "cheerio", "yargs", "inquirer", "winston", "pino",
  "stripe", "openai", "tailwind", "tailwindcss", "vite", "postcss", "rimraf",
  "node-fetch", "undici", "zod", "sharp", "got", "ws", "form-data", "dotenv-expand"
]);

export class TyposquatDetector {
  public static check(name: string): { isSquat: boolean; target?: string } {
    const cleanName = name.toLowerCase().trim();

    // If it's the exact popular package, it's safe
    if (POPULAR_PACKAGES.has(cleanName)) {
      return { isSquat: false };
    }

    // Check against popular packages
    for (const pop of POPULAR_PACKAGES) {
      // 1. Missing hyphen: crossenv vs cross-env, reactdom vs react-dom
      if (pop.includes("-")) {
        const withoutHyphen = pop.replace(/-/g, "");
        if (cleanName === withoutHyphen || cleanName === pop.replace(/-/g, "_")) {
          return { isSquat: true, target: pop };
        }
      }

      // 2. Trailing or duplicate letter: lodashh, expresss, axioos
      if (
        cleanName.length === pop.length + 1 &&
        cleanName.startsWith(pop)
      ) {
        return { isSquat: true, target: pop };
      }

      // 3. .js suffix: express.js, chalk.js
      if (cleanName === `${pop}.js` || cleanName === `${pop}-js`) {
        return { isSquat: true, target: pop };
      }

      // 4. Levenshtein distance = 1 (typo)
      if (Math.abs(cleanName.length - pop.length) <= 1) {
        const dist = this.levenshtein(cleanName, pop);
        if (dist === 1 && pop.length >= 4) {
          return { isSquat: true, target: pop };
        }
      }
    }

    return { isSquat: false };
  }

  private static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
