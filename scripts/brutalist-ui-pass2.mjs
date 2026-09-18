import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "src");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const replacements = [
  [/from-amber[^\s"']+/g, "from-zinc-900"],
  [/via-amber[^\s"']+/g, "via-zinc-800"],
  [/to-amber[^\s"']+/g, "to-zinc-900"],
  [/from-violet[^\s"']+/g, "from-zinc-900"],
  [/via-violet[^\s"']+/g, "via-zinc-800"],
  [/to-violet[^\s"']+/g, "to-zinc-900"],
  [/from-emerald[^\s"']+/g, "from-zinc-900"],
  [/to-emerald[^\s"']+/g, "to-zinc-900"],
  [/from-rose[^\s"']+/g, "from-zinc-900"],
  [/to-rose[^\s"']+/g, "to-zinc-900"],
  [/bg-gradient-to-[a-z]+/g, "bg-[#09090b]"],
  [/bg-clip-text text-transparent/g, "text-white"],
  [/rgba\(251,\s*191,\s*36[^)]+\)/g, "rgba(161,161,170,0.08)"],
  [/rgba\(139,\s*92,\s*246[^)]+\)/g, "rgba(63,63,70,0.12)"],
  [/rounded-t-\[[^\]]+\]/g, "rounded-none"],
  [/bg-\[#0b1220\][^\s"']*/g, "bg-[#09090b]"],
  [/bg-\[#020617\][^\s"']*/g, "bg-black/90"],
  [/text-violet-\d+\/\d+/g, "text-zinc-500"],
  [/border-emerald-\d+\/\d+/g, "border-zinc-800"],
  [/border-rose-\d+\/\d+/g, "border-zinc-800"],
  [/text-emerald-\d+\/\d+/g, "text-zinc-300"],
];

let changed = 0;
for (const file of walk(ROOT)) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changed += 1;
  }
}
console.log(`Pass 2 updated ${changed} files.`);
