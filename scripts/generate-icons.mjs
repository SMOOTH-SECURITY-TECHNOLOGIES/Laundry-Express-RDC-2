/**
 * Generate PNG icons from favicon.svg for PWA manifest compatibility.
 * Run: node scripts/generate-icons.mjs
 *
 * Uses sharp for SVG to PNG conversion. Install if missing:
 *   npm install -D sharp
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'favicon.svg');
const outDir = resolve(root, 'public', 'icons');

const sizes = [192, 512];

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('sharp is not installed. Run: npm install -D sharp');
    process.exit(1);
  }

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const svg = readFileSync(svgPath);

  for (const size of sizes) {
    const outPath = resolve(outDir, `icon-${size}x${size}.png`);
    await sharp(svg).resize(size, size).png().toFile(outPath);
    console.log(`Generated ${outPath}`);
  }

  console.log('\nDone. Update manifest.json to reference /icons/icon-192x192.png and /icons/icon-512x512.png');
}

main();
