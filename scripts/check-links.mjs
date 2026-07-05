#!/usr/bin/env node
// Verifierar att sidan hänger ihop innan deploy:
//   1. varje lokal href/src i *.html pekar på en fil som finns
//   2. varje *.json under api/ går att parsa
// Inga beroenden — körs i CI (.github/workflows/ci.yml) och lokalt.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];

function listFiles(dir, filter) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.name === ".git" || e.name === "node_modules") return [];
    if (e.isDirectory()) return listFiles(full, filter);
    return filter(e.name) ? [full] : [];
  });
}

const isExternal = (u) =>
  /^(?:[a-z]+:|\/\/|#|mailto:|tel:|data:)/i.test(u) || u.trim() === "";

// 1. lokala länkar/tillgångar
for (const html of listFiles(root, (n) => n.endsWith(".html"))) {
  const src = readFileSync(html, "utf8");
  const refs = [...src.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (isExternal(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    const target = resolve(dirname(html), clean);
    if (!existsSync(target) || !statSync(target).isFile()) {
      errors.push(`${html.replace(root + "/", "")}: bruten länk → ${ref}`);
    }
  }
}

// 2. json under api/
const apiDir = join(root, "api");
if (existsSync(apiDir)) {
  for (const jsonFile of listFiles(apiDir, (n) => n.endsWith(".json"))) {
    try {
      JSON.parse(readFileSync(jsonFile, "utf8"));
    } catch (e) {
      errors.push(`${jsonFile.replace(root + "/", "")}: ogiltig JSON — ${e.message}`);
    }
  }
}

if (errors.length) {
  console.error("check-links: " + errors.length + " problem\n" + errors.map((e) => "  ✗ " + e).join("\n"));
  process.exit(1);
}
console.log("check-links: alla lokala länkar och JSON-filer OK");
