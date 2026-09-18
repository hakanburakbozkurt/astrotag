import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "src");

const SKIP_DIRS = new Set(["node_modules", ".next"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const replacements = [
  [/rounded-\[[^\]]+\]/g, "rounded-none"],
  [/rounded-3xl/g, "rounded-sm"],
  [/rounded-2xl/g, "rounded-sm"],
  [/rounded-xl/g, "rounded-sm"],
  [/rounded-lg/g, "rounded-sm"],
  [/rounded-\[1\.[^\]]+\]/g, "rounded-none"],
  [/backdrop-blur(?:-2xl|-xl|-lg|-md|-sm)?/g, ""],
  [/border-amber-\d+\/\d+/g, "border-zinc-800"],
  [/border-yellow-\d+\/\d+/g, "border-zinc-800"],
  [/border-amber-\d+/g, "border-zinc-800"],
  [/border-yellow-\d+/g, "border-zinc-800"],
  [/hover:border-amber-\d+\/\d+/g, "hover:border-zinc-600"],
  [/hover:border-amber-\d+/g, "hover:border-zinc-600"],
  [/focus:border-amber-\d+\/\d+/g, "focus:border-zinc-600"],
  [/focus:border-violet-\d+\/\d+/g, "focus:border-zinc-600"],
  [/bg-\[#0a0a0b\]/g, "bg-[#09090b]"],
  [/bg-\[#0f172a\][^\s"']*/g, "bg-[#09090b]"],
  [/from-violet-500\/\[[^\]]+\]/g, ""],
  [/via-\[#0f172a\]\/\d+/g, ""],
  [/to-amber-500\/\[[^\]]+\]/g, ""],
  [/bg-gradient-to-br from-violet-500\/\[[^\]]+\] via-\[#0f172a\]\/\d+ to-amber-500\/\[[^\]]+\]/g, "bg-[#09090b]"],
  [/shadow-\[0_0[^\]]+\]/g, ""],
  [/text-amber-\d+\/\d+/g, "text-zinc-400"],
  [/text-amber-\d+/g, "text-zinc-400"],
  [/text-yellow-\d+\/\d+/g, "text-zinc-400"],
  [/bg-amber-\d+\/\d+/g, "bg-zinc-900/40"],
  [/bg-amber-\d+/g, "bg-zinc-900"],
  [/hover:bg-amber-\d+\/\d+/g, "hover:bg-zinc-900/60"],
  [/hover:text-amber-\d+\/\d+/g, "hover:text-zinc-300"],
  [/border-violet-\d+\/\d+/g, "border-zinc-800"],
  [/  +/g, " "],
  [/className="([^"]*?)  +/g, 'className="$1 '],
  [/  "/g, ' "'],
];

const files = walk(ROOT);
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  content = content.replace(/className="([^"]*?)"/g, (_, classes) => {
    const cleaned = classes
      .split(/\s+/)
      .filter(Boolean)
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .join(" ")
      .trim();
    return `className="${cleaned}"`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    changed += 1;
  }
}

console.log(`Updated ${changed} files.`);
