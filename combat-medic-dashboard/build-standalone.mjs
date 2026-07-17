#!/usr/bin/env node
// build-standalone.mjs — regenerate standalone.html from the multi-file source.
//
// standalone.html is a GENERATED, self-contained build of index.html: it inlines
// the pinned CDN libraries (React, ReactDOM, Babel-standalone, Three.js,
// GLTFLoader), the data-URI 3D model, the audio module, and every .jsx module,
// so the result runs by double-click (file://) with no server and no install.
//
// Edit the .jsx / .js sources — never standalone.html by hand — then run:
//     node build-standalone.mjs
//
// Requires Node 18+ (built-in fetch) and a network connection to fetch the
// pinned libraries the first time (they are cached under .cache/ afterwards).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const DIR = dirname(fileURLToPath(import.meta.url));
const CACHE = join(DIR, ".cache");

// Split any literal </script in inlined JS so it can't close the host tag.
const safe = (js) => js.replace(/<\/script/gi, "<\\/script");
const inlineScript = (js, attrs = "") =>
  `<script${attrs ? " " + attrs : ""}>\n${safe(js)}\n</script>`;

async function getLib(url) {
  mkdirSync(CACHE, { recursive: true });
  const cacheFile = join(CACHE, url.replace(/[^a-z0-9.]+/gi, "_"));
  if (existsSync(cacheFile)) return readFileSync(cacheFile, "utf8");
  process.stdout.write(`  fetching ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  const txt = await res.text();
  writeFileSync(cacheFile, txt);
  return txt;
}

let html = readFileSync(join(DIR, "index.html"), "utf8");

// 1) Replace each pinned CDN <script src="…unpkg…"> with its inlined contents.
//    The URLs are read straight out of index.html so versions stay in sync.
const cdnTags = [...html.matchAll(/<script\s+src="(https:\/\/unpkg\.com\/[^"]+)"[^>]*><\/script>/g)];
if (cdnTags.length !== 5) throw new Error(`expected 5 CDN script tags, found ${cdnTags.length}`);
for (const m of cdnTags) {
  const js = await getLib(m[1]);
  html = html.replace(m[0], () => inlineScript(js));
}

// 2) Inline the local plain scripts (3D model data + audio).
for (const file of ["body-model-data.js", "tacaudio.js"]) {
  const re = new RegExp(`<script src="${file}"></script>`);
  if (!re.test(html)) throw new Error("script tag not found: " + file);
  html = html.replace(re, () => inlineScript(readFileSync(join(DIR, file), "utf8")));
}

// 3) Inline the text/babel module scripts (order preserved from index.html).
for (const file of ["scenarios.jsx", "sim.jsx", "body3d.jsx", "variant-a.jsx", "variant-b.jsx", "tweaks.jsx"]) {
  const re = new RegExp(`<script type="text/babel" src="${file}"></script>`);
  if (!re.test(html)) throw new Error("babel tag not found: " + file);
  html = html.replace(re, () => inlineScript(readFileSync(join(DIR, file), "utf8"), 'type="text/babel"'));
}

// Mark the output as generated.
html = html.replace(
  /<title>([^<]*)<\/title>/,
  `<title>$1</title>\n<!-- GENERATED FILE — built from the multi-file source by build-standalone.mjs.\n     Edit the .jsx / .js sources and re-run \`node build-standalone.mjs\`; do not hand-edit this file. -->`
);

if (/unpkg\.com/.test(html)) throw new Error("unpkg refs remain after inlining");
writeFileSync(join(DIR, "standalone.html"), html);
console.log(`standalone.html rebuilt — ${(html.length / 1e6).toFixed(1)} MB`);
