#!/usr/bin/env node
/**
 * Build-time prerender of <head> tags (SEO-1). Runs after `vite build` and the SSR build of
 * src/seo/prerender.tsx (see the `build` script).
 *
 * For every public page it writes dist/<path>/index.html: the SPA shell with that page's title,
 * description, canonical, Open Graph/Twitter tags and JSON-LD, so crawlers and link previews
 * (WhatsApp, Facebook, LinkedIn) that don't run JS see the right page. The app still renders
 * client-side; Helmet replaces these tags on load. Also writes sitemap.xml and adds it to robots.txt.
 *
 * Catalog pages need the API: VITE_API_URL (set on Vercel). Without it, or if the API can't be
 * reached, only the static pages (home, /products, /legal/*) are prerendered and a warning is printed;
 * the build still succeeds, and the missing pages fall back to the SPA shell as before.
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const ssrDir = join(dist, ".prerender");

const seo = await import(pathToFileURL(join(ssrDir, "prerender.js")).href);
const template = readFileSync(join(dist, "index.html"), "utf8");

/** The shell without its default SEO tags (the <title> and every data-rh tag). */
const shell = template
  .replace(/<title>[\s\S]*?<\/title>\s*/, "")
  .replace(/<(meta|link)\b[^>]*\bdata-rh="true"[^>]*>\s*/g, "");
if (!shell.includes("</head>")) throw new Error("prerender: dist/index.html has no </head>");

const pages = [];
const add = (props) => pages.push(props);

add(seo.homeSeo());
add(seo.productsSeo());
for (const path of seo.legalPaths()) add(seo.policySeo(path));
const staticCount = pages.length;

const apiUrl = (process.env.VITE_API_URL ?? "").replace(/\/+$/, "");
let catalogError = null;
if (!apiUrl) {
  catalogError = "VITE_API_URL is unset";
} else {
  try {
    const categories = await getJson(`${apiUrl}/api/v1/categories`);
    for (const c of categories.items) add(seo.categorySeo(c));
    for (const slug of await allProductSlugs()) {
      add(seo.productSeo(await getJson(`${apiUrl}/api/v1/products/${encodeURIComponent(slug)}`)));
    }
  } catch (e) {
    catalogError = e instanceof Error ? e.message : String(e);
    pages.splice(staticCount);
  }
}

for (const page of pages) {
  const html = shell.replace("</head>", `  ${seo.renderHead(page)}\n  </head>`);
  // "/" overwrites the shell itself, so the SPA fallback (vercel.json) also gets the home tags; Helmet
  // replaces them on other routes.
  const file = page.path === "/" ? join(dist, "index.html") : join(dist, page.path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const urls = pages.filter((p) => !p.noindex).map((p) => `${seo.SITE_URL}${p.path === "/" ? "/" : p.path}`);
writeFileSync(
  join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
const robots = readFileSync(join(dist, "robots.txt"), "utf8").replace(/\n*Sitemap:.*$/gm, "").trimEnd();
writeFileSync(join(dist, "robots.txt"), `${robots}\n\nSitemap: ${seo.SITE_URL}/sitemap.xml\n`);

rmSync(ssrDir, { recursive: true, force: true });

console.log(`prerender: ${pages.length} page(s), sitemap with ${urls.length} URL(s).`);
if (catalogError) {
  console.warn(`prerender: WARNING catalog pages skipped (${catalogError}); categories and products use the SPA shell.`);
}

async function allProductSlugs() {
  const slugs = [];
  for (let page = 1; ; page++) {
    const list = await getJson(`${apiUrl}/api/v1/products?limit=100&page=${page}`);
    slugs.push(...list.items.map((p) => p.slug));
    if (slugs.length >= list.total || list.items.length === 0) return slugs;
  }
}

/** GET JSON with retries: the API's free tier can take ~1 min to wake up. */
async function getJson(url, attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(`${res.status} from ${url}`);
      return await res.json();
    } catch (e) {
      if (i >= attempts) throw e;
    }
  }
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
