#!/usr/bin/env node
/**
 * Replace chromatic Tailwind classes in UI files only — no whitespace mutation.
 */
import fs from "node:fs";
import path from "node:path";

const TARGET_DIRS = [
  path.join(process.cwd(), "src", "components"),
  path.join(process.cwd(), "src", "app"),
];

const REPLACEMENTS = [
  [/bg-\[#070b14\]/g, "bg-zinc-950"],
  [/bg-\[#0a1020\]/g, "bg-zinc-950"],
  [/#070b14/g, "#09090b"],

  [/text-amber-[\w/.%-]+/g, "text-stone-300"],
  [/border-amber-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-amber-[\w/.%-]+/g, "bg-zinc-900"],
  [/from-amber-[\w/.%-]+/g, "from-zinc-800"],
  [/to-amber-[\w/.%-]+/g, "to-zinc-900"],
  [/via-amber-[\w/.%-]+/g, "via-zinc-800"],

  [/text-violet-[\w/.%-]+/g, "text-stone-300"],
  [/border-violet-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-violet-[\w/.%-]+/g, "bg-zinc-900"],
  [/from-violet-[\w/.%-]+/g, "from-zinc-800"],
  [/to-violet-[\w/.%-]+/g, "to-zinc-900"],

  [/text-purple-[\w/.%-]+/g, "text-stone-300"],
  [/border-purple-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-purple-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-cyan-[\w/.%-]+/g, "text-stone-300"],
  [/border-cyan-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-cyan-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-sky-[\w/.%-]+/g, "text-stone-300"],
  [/border-sky-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-sky-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-blue-[\w/.%-]+/g, "text-stone-300"],
  [/border-blue-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-blue-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-indigo-[\w/.%-]+/g, "text-stone-300"],
  [/border-indigo-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-indigo-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-emerald-[\w/.%-]+/g, "text-stone-300"],
  [/border-emerald-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-emerald-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-green-[\w/.%-]+/g, "text-stone-300"],
  [/border-green-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-green-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-rose-[\w/.%-]+/g, "text-stone-300"],
  [/border-rose-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-rose-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-pink-[\w/.%-]+/g, "text-stone-300"],
  [/border-pink-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-pink-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-red-[\w/.%-]+/g, "text-stone-400"],
  [/border-red-[\w/.%-]+/g, "border-zinc-700"],
  [/bg-red-[\w/.%-]+/g, "bg-zinc-900"],

  [/text-fuchsia-[\w/.%-]+/g, "text-stone-300"],
  [/text-teal-[\w/.%-]+/g, "text-stone-300"],
  [/text-orange-[\w/.%-]+/g, "text-stone-300"],
  [/text-yellow-[\w/.%-]+/g, "text-stone-300"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
for (const dir of TARGET_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const original = fs.readFileSync(file, "utf8");
    let next = original;
    for (const [pattern, replacement] of REPLACEMENTS) {
      next = next.replace(pattern, replacement);
    }
    if (next !== original) {
      fs.writeFileSync(file, next);
      changed++;
    }
  }
}

console.log(`Done. ${changed} UI files updated.`);
