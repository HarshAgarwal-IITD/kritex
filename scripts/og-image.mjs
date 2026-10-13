// Usage: node scripts/og-image.mjs src/assets/hero-textile.webp public/brand/yellow_full.png public/brand/og-default.jpg
// Builds the 1200x630 default link-preview image (og:image) from the hero photo and the logo.
import sharp from "sharp";
const [hero, logo, out] = process.argv.slice(2);
const W = 1200, H = 630;
const bg = await sharp(hero).resize(W, H, { fit: "cover" }).modulate({ brightness: 0.55 }).toBuffer();
// background hsl(150 20% 7%) ≈ rgb(14,21,18): gradient overlay like the hero
const overlay = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgb(14,21,18)" stop-opacity="0.95"/><stop offset="1" stop-color="rgb(14,21,18)" stop-opacity="0.45"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>
<text x="600" y="520" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="30" letter-spacing="5" fill="#e8efe9">DEFENCE-GRADE APPAREL · FOOTWEAR · FIELD GEAR</text>
<text x="600" y="570" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="24" letter-spacing="4" fill="#8fb39c">SINCE 1976 · WWW.KRITEX.IN</text></svg>`);
const lg = await sharp(logo).resize({ width: 720 }).toBuffer();
const meta = await sharp(lg).metadata();
await sharp(bg).composite([{ input: overlay }, { input: lg, left: Math.round((W - meta.width) / 2), top: Math.round(230 - meta.height / 2) }]).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
