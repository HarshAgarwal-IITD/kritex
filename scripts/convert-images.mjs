// Usage: npm run images:convert  (or: node scripts/convert-images.mjs <publicDir> <outDir>)
// Converts PNG/JPG under products, logos, brand, achievements to WebP, keeping folder structure.
// Product images are converted from the normal (original) files; the bg-removed/ folders are
// skipped. Pass --bg-removed to use a file's bg-removed/ twin instead, when one exists.
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const preferBgRemoved = args.includes("--bg-removed");
const [publicDir = "public", outDir = "r2-upload"] = args.filter((a) => !a.startsWith("--"));
const DIRS = ["products", "logos", "brand", "achievements"];
const RASTER = /\.(png|jpe?g)$/i;
const MAX_EDGE = 2400;
const maxEdge = (rel) => (rel.startsWith("logos/") ? 512 : MAX_EDGE);

const quality = (rel) =>
  rel.startsWith("logos/") || rel.startsWith("brand/") ? 90
  : rel.includes("_spec-sheets/") ? 85
  : 82;

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "bg-removed") yield* walk(p);
    } else yield p;
  }
}

const exists = (p) => fs.access(p).then(() => true, () => false);
const rows = [["source", "output", "bytes_before", "bytes_after"]];
let before = 0, after = 0, fromBg = 0;

for (const d of DIRS) {
  for await (const file of walk(path.join(publicDir, d))) {
    const rel = path.relative(publicDir, file);
    const bg = path.join(path.dirname(file), "bg-removed", path.basename(file));
    const src = preferBgRemoved && d === "products" && (await exists(bg)) ? bg : file;
    if (src === bg) fromBg++;

    let outRel = rel;
    if (RASTER.test(rel)) {
      outRel = rel.replace(RASTER, ".webp");
      await fs.mkdir(path.dirname(path.join(outDir, outRel)), { recursive: true });
      await sharp(src)
        .rotate()
        .resize({ width: maxEdge(rel), height: maxEdge(rel), fit: "inside", withoutEnlargement: true })
        .webp({ quality: quality(rel), alphaQuality: 100, effort: 6 })
        .toFile(path.join(outDir, outRel));
    } else {
      await fs.mkdir(path.dirname(path.join(outDir, outRel)), { recursive: true });
      await fs.copyFile(src, path.join(outDir, outRel));
    }
    const b = (await fs.stat(src)).size;
    const a = (await fs.stat(path.join(outDir, outRel))).size;
    before += b; after += a;
    rows.push([path.relative(publicDir, src), outRel, b, a]);
  }
}

await fs.writeFile(path.join(outDir, "manifest.csv"), rows.map((r) => r.join(",")).join("\n") + "\n");
const mb = (n) => (n / 1048576).toFixed(1) + " MB";
console.log(`files: ${rows.length - 1} (${fromBg} from bg-removed)`);
console.log(`before: ${mb(before)}  after: ${mb(after)}  saved: ${(100 * (1 - after / before)).toFixed(0)}%`);
