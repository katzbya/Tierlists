/**
 * Next.js standalone output puts the server in .next/standalone/
 * but does NOT copy .next/static or public/ into it.
 * This script copies them to the right place for the packaged app.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next/standalone");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Copy .next/static → .next/standalone/.next/static
copyDir(
  path.join(root, ".next/static"),
  path.join(standalone, ".next/static")
);

// Copy public/ → .next/standalone/public
copyDir(
  path.join(root, "public"),
  path.join(standalone, "public")
);

console.log("✓ Copied static assets into standalone build");
