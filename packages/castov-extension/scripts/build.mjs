/**
 * Castov Secret Shield - Clean Bundler & Packager
 *
 * Builds content, background, and popup bundles using Vite without remote CDNs or evals.
 * Copies all static assets and produces an unpacked `dist/` and `dist/castov-secret-shield.zip`.
 */

import fs from "node:fs";
import path from "node:path";
import { build } from "vite";
import zlib from "node:zlib";

const packageRoot = path.resolve(import.meta.dirname, "..");
const distDir = path.resolve(packageRoot, "dist");

async function runBuild() {
  console.log("==> Building Castov Secret Shield...");

  // Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // 1. Build Content Script (IIFE for isolated execution in web pages)
  console.log("Building Content Script...");
  await build({
    root: packageRoot,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(packageRoot, "src/content/index.ts"),
        name: "CastovShieldContent",
        formats: ["iife"],
        fileName: () => "content.js",
      },
      minify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  });

  // 2. Build Background Service Worker (ES module)
  console.log("Building Background Service Worker...");
  await build({
    root: packageRoot,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(packageRoot, "src/background/service-worker.ts"),
        formats: ["es"],
        fileName: () => "background.js",
      },
      minify: true,
      sourcemap: false,
    },
  });

  // 3. Build Popup Controller (ES module)
  console.log("Building Popup Controller...");
  await build({
    root: packageRoot,
    build: {
      outDir: distDir,
      emptyOutDir: false,
      lib: {
        entry: path.resolve(packageRoot, "src/popup/popup.ts"),
        formats: ["es"],
        fileName: () => "popup.js",
      },
      minify: true,
      sourcemap: false,
    },
  });

  // 4. Copy Static Assets
  console.log("Copying static assets to dist/...");
  fs.copyFileSync(path.resolve(packageRoot, "manifest.json"), path.join(distDir, "manifest.json"));
  fs.copyFileSync(path.resolve(packageRoot, "src/popup/popup.html"), path.join(distDir, "popup.html"));
  fs.copyFileSync(path.resolve(packageRoot, "src/popup/popup.css"), path.join(distDir, "popup.css"));

  // Copy icons (PNG only)
  const iconsDist = path.join(distDir, "icons");
  fs.mkdirSync(iconsDist, { recursive: true });
  const iconsSrc = path.resolve(packageRoot, "icons");
  if (fs.existsSync(iconsSrc)) {
    for (const file of fs.readdirSync(iconsSrc)) {
      if (file.endsWith(".png")) {
        fs.copyFileSync(path.join(iconsSrc, file), path.join(iconsDist, file));
      }
    }
  }

  // Copy locales
  const localesDist = path.join(distDir, "_locales");
  fs.mkdirSync(localesDist, { recursive: true });
  const localesSrc = path.resolve(packageRoot, "_locales");
  if (fs.existsSync(localesSrc)) {
    copyFolderRecursiveSync(localesSrc, localesDist);
  }

  // 5. Create ZIP Archive for distribution
  console.log("Creating ZIP archive...");
  await createZipArchive(distDir, path.join(distDir, "castov-secret-shield.zip"));

  console.log("==> Build finished successfully! Output in:", distDir);
}

function copyFolderRecursiveSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyFolderRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Creates standard ZIP file using native Node.js buffers and zlib.
 */
async function createZipArchive(sourceDir, zipFilePath) {
  const files = getAllFiles(sourceDir).filter((f) => !f.endsWith(".zip"));
  const entries = [];

  for (const absPath of files) {
    const relPath = path.relative(sourceDir, absPath).replace(/\\/g, "/");
    const data = fs.readFileSync(absPath);
    const compressed = zlib.deflateRawSync(data);

    entries.push({
      name: relPath,
      uncompressedSize: data.length,
      compressedSize: compressed.length,
      crc: crc32(data),
      compressedData: compressed,
    });
  }

  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");

    // Local file header (30 bytes + name)
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0); // signature
    lh.writeUInt16LE(20, 4); // version needed
    lh.writeUInt16LE(0x0800, 6); // general purpose (UTF-8)
    lh.writeUInt16LE(8, 8); // compression method (deflate)
    lh.writeUInt16LE(0, 10); // file time
    lh.writeUInt16LE(0, 12); // file date
    lh.writeUInt32LE(e.crc, 14);
    lh.writeUInt32LE(e.compressedSize, 18);
    lh.writeUInt32LE(e.uncompressedSize, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28); // extra field len
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, e.compressedData);

    // Central directory header (46 bytes + name)
    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // signature
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0x0800, 8); // UTF-8
    cd.writeUInt16LE(8, 10); // compression
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(e.crc, 16);
    cd.writeUInt32LE(e.compressedSize, 20);
    cd.writeUInt32LE(e.uncompressedSize, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30); // extra
    cd.writeUInt16LE(0, 32); // comment
    cd.writeUInt16LE(0, 34); // disk start
    cd.writeUInt16LE(0, 36); // internal attr
    cd.writeUInt32LE(0, 38); // external attr
    cd.writeUInt32LE(offset, 42); // local header offset
    nameBuf.copy(cd, 46);

    centralHeaders.push(cd);
    offset += lh.length + e.compressedData.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const cd of centralHeaders) centralDirSize += cd.length;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // disk with central dir
  eocd.writeUInt16LE(entries.length, 8); // total entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  const finalZipBuffer = Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
  fs.writeFileSync(zipFilePath, finalZipBuffer);
}

function getAllFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...getAllFiles(full));
    } else {
      result.push(full);
    }
  }
  return result;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

runBuild().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
