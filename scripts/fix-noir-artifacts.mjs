#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const FIXES = [
  [/from"@/g, 'from "@'],
  [/from '@/g, "from '@"],
  [/import\{/g, "import {"],
  [/}from/g, "} from"],
  [/\)from/g, ") from"],
  [/type (\w+)="/g, 'type $1="'],
  [/:"([^"]+)" \|"/g, ': "$1" | "'],
  [/zinc-900\[([^\]]+)\]/g, "zinc-900/$1"],
  [/zinc-800\[([^\]]+)\]/g, "zinc-800/$1"],
  [/zinc-950\[([^\]]+)\]/g, "zinc-950/$1"],
  [/ring-amber-[\w/.%-]+/g, "ring-zinc-700"],
  [/fill-amber-[\w/.%-]+/g, "fill-stone-300"],
  [/ring-cyan-[\w/.%-]+/g, "ring-zinc-600"],
  [/ring-emerald-[\w/.%-]+/g, "ring-zinc-600"],
  [/focus:ring-amber-[\w/.%-]+/g, "focus:ring-zinc-700"],
  [/rgba\(251,\s*191,\s*36[^)]*\)/g, "rgba(255,255,255,0.08)"],
  [/rgba\(245,\s*158,\s*11[^)]*\)/g, "rgba(255,255,255,0.06)"],
  [/rgba\(139,\s*92,\s*246[^)]*\)/g, "rgba(255,255,255,0.06)"],
];

let changed = 0;
for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [pattern, replacement] of FIXES) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changed++;
  }
}
console.log(`Fixed ${changed} files.`);
