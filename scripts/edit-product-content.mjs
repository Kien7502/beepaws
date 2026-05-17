/**
 * Interactive editor for product metafield content.
 *
 * Reads/writes scripts/products/<handle>.json.
 * Auto-saves after every change.
 *
 * Usage:
 *   node scripts/edit-product-content.mjs <product-handle>
 *
 * After editing, push to Shopify:
 *   node --env-file=.env.local scripts/seed-product-metafields.mjs <product-handle>
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as readline from "node:readline/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = resolve(__dirname, "products");

const handle = process.argv[2]?.trim();
if (!handle) {
  console.error("Usage: node scripts/edit-product-content.mjs <product-handle>");
  process.exit(1);
}

const filePath = resolve(PRODUCTS_DIR, `${handle}.json`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => rl.question(q);

// ── Schemas for each list-of-objects field ────────────────────────────────

const ITEM_SCHEMAS = {
  stats: {
    fields: [
      { key: "value", label: "Value (e.g. 10,000+)" },
      { key: "label", label: "Label" },
    ],
    summary: (i) => `${i.value} ${i.label}`,
  },
  tech_specs: {
    fields: [
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
    ],
    summary: (i) => `${i.label} → ${i.value}`,
  },
  comparison_rows: {
    fields: [
      { key: "label", label: "Row label" },
      { key: "beepaws", label: "BeePaws? (true/false)", type: "boolean", default: true },
      { key: "vet", label: "Vet? (true/false)", type: "boolean", default: false },
      { key: "other", label: "Other? (true/false)", type: "boolean", default: false },
    ],
    summary: (i) => `${i.label}  [${i.beepaws ? "✓" : "✗"} / ${i.vet ? "✓" : "✗"} / ${i.other ? "✓" : "✗"}]`,
  },
  use_cases: {
    fields: [
      { key: "emoji", label: "Emoji" },
      { key: "label", label: "Label (badge)" },
      { key: "title", label: "Title" },
      { key: "description", label: "Description" },
      { key: "from", label: "Gradient from (#hex)", default: "#f5a800" },
      { key: "to", label: "Gradient to (#hex)", default: "#fff3dc" },
    ],
    summary: (i) => `${i.emoji} ${i.title}`,
  },
  faq_items: {
    fields: [
      { key: "icon", label: "Icon (Shield|PawPrint|Volume2|Package|RefreshCw)", default: "Shield" },
      { key: "q", label: "Question" },
      { key: "a", label: "Answer" },
    ],
    summary: (i) => `[${i.icon}] ${i.q}`,
  },
  reviews: {
    fields: [
      { key: "name", label: "Name (e.g. Sarah K.)" },
      { key: "time", label: "Time (e.g. 2 weeks ago)" },
      { key: "rating", label: "Rating (1-5)", type: "number", default: 5 },
      { key: "likes", label: "Likes (integer)", type: "number", default: 0 },
      { key: "comments", label: "Comments (integer)", type: "number", default: 0 },
      { key: "text", label: "Review text" },
      { key: "reply", label: "Reply (blank or '-' for none)", type: "nullable_string" },
    ],
    summary: (i) => `${i.name} (${"★".repeat(i.rating)}) — ${(i.text || "").slice(0, 50)}…`,
  },
  before_after_slides: {
    fields: [
      { key: "beforeImageUrl", label: "Before image URL (blank for placeholder)" },
      { key: "afterImageUrl", label: "After image URL (blank for placeholder)" },
      { key: "beforeLabel", label: "Before label", default: "Before" },
      { key: "afterLabel", label: "After label", default: "After 3 Sessions" },
      { key: "petName", label: "Pet name (e.g. Bella, 4yr Chihuahua)" },
      { key: "caption", label: "Caption (blank or '-' for none)", type: "nullable_string" },
    ],
    summary: (i) => i.petName || "(unnamed slide)",
  },
};

const FIELDS = [
  { key: "tagline",             kind: "text",             label: "Card tagline" },
  { key: "education_note",      kind: "text",             label: "Education note" },
  { key: "product_bullets",     kind: "list_of_strings",  label: "Product bullets" },
  { key: "ingredients",         kind: "list_of_strings",  label: "Ingredients" },
  { key: "stats",               kind: "list_of_objects",  label: "Stats" },
  { key: "tech_specs",          kind: "list_of_objects",  label: "Tech specs" },
  { key: "comparison_rows",     kind: "list_of_objects",  label: "Comparison rows" },
  { key: "use_cases",           kind: "list_of_objects",  label: "Use cases" },
  { key: "faq_items",           kind: "list_of_objects",  label: "FAQ items" },
  { key: "reviews",             kind: "list_of_objects",  label: "Reviews" },
  { key: "before_after_slides", kind: "list_of_objects",  label: "Before/after slides" },
];

// ── Load existing content ─────────────────────────────────────────────────

let data = {};
if (existsSync(filePath)) {
  const raw = await readFile(filePath, "utf8");
  try { data = JSON.parse(raw); console.log(`Loaded ${filePath}`); }
  catch { console.error("Existing file is invalid JSON — starting fresh."); data = {}; }
} else {
  console.log(`Creating new file: ${filePath}`);
  await mkdir(PRODUCTS_DIR, { recursive: true });
}

// Initialize missing fields
for (const f of FIELDS) {
  if (data[f.key] === undefined) {
    data[f.key] = f.kind === "text" ? "" : [];
  }
}

async function save() {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

// ── Editors ───────────────────────────────────────────────────────────────

async function editText(field) {
  const current = data[field.key] || "";
  console.log(`\nCurrent: ${current || "(empty)"}`);
  const ans = await ask("New value (Enter to keep, '-' to clear): ");
  if (ans === "-") { data[field.key] = ""; await save(); }
  else if (ans !== "") { data[field.key] = ans; await save(); }
}

async function editListOfStrings(field) {
  while (true) {
    const list = data[field.key];
    console.log(`\n${field.label} — ${list.length} items:`);
    list.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
    console.log("  Commands: a (add) | e <n> (edit) | d <n> (delete) | b (back)");
    const cmd = (await ask("> ")).trim();
    if (cmd === "b" || cmd === "") return;
    if (cmd === "a") {
      const v = (await ask("New item: ")).trim();
      if (v) { list.push(v); await save(); }
    } else if (cmd.startsWith("e ")) {
      const n = parseInt(cmd.slice(2), 10) - 1;
      if (n >= 0 && n < list.length) {
        console.log(`Current: ${list[n]}`);
        const v = (await ask("New value: ")).trim();
        if (v) { list[n] = v; await save(); }
      } else console.log("Index out of range.");
    } else if (cmd.startsWith("d ")) {
      const n = parseInt(cmd.slice(2), 10) - 1;
      if (n >= 0 && n < list.length) { list.splice(n, 1); await save(); }
      else console.log("Index out of range.");
    } else console.log("Unknown command.");
  }
}

async function promptForObject(schema, existing = {}) {
  const obj = {};
  for (const f of schema.fields) {
    const current = existing[f.key];
    const def = current !== undefined ? current : f.default;
    const hint = def !== undefined && def !== null ? ` [${def}]` : "";
    const ans = (await ask(`  ${f.label}${hint}: `)).trim();
    let value;
    if (ans === "") {
      if (def !== undefined) value = def;
      else if (f.type === "nullable_string") value = null;
      else if (f.type === "number") value = 0;
      else if (f.type === "boolean") value = false;
      else value = "";
    } else if (f.type === "boolean") {
      value = /^(true|t|yes|y|1)$/i.test(ans);
    } else if (f.type === "number") {
      value = Number(ans);
    } else if (f.type === "nullable_string") {
      value = ans === "-" ? null : ans;
    } else {
      value = ans;
    }
    obj[f.key] = value;
  }
  return obj;
}

async function editListOfObjects(field) {
  const schema = ITEM_SCHEMAS[field.key];
  while (true) {
    const list = data[field.key];
    console.log(`\n${field.label} — ${list.length} items:`);
    list.forEach((item, i) => console.log(`  ${i + 1}. ${schema.summary(item)}`));
    console.log("  Commands: a (add) | e <n> (edit) | d <n> (delete) | b (back)");
    const cmd = (await ask("> ")).trim();
    if (cmd === "b" || cmd === "") return;
    if (cmd === "a") {
      console.log("\nAdd new item (press Enter to use default):");
      const obj = await promptForObject(schema);
      list.push(obj); await save();
    } else if (cmd.startsWith("e ")) {
      const n = parseInt(cmd.slice(2), 10) - 1;
      if (n >= 0 && n < list.length) {
        console.log(`\nEdit item ${n + 1} (Enter keeps current):`);
        list[n] = await promptForObject(schema, list[n]); await save();
      } else console.log("Index out of range.");
    } else if (cmd.startsWith("d ")) {
      const n = parseInt(cmd.slice(2), 10) - 1;
      if (n >= 0 && n < list.length) { list.splice(n, 1); await save(); }
      else console.log("Index out of range.");
    } else console.log("Unknown command.");
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────

while (true) {
  console.log("\n──── Edit product content ────");
  console.log(`Product: ${handle}`);
  FIELDS.forEach((f, i) => {
    const v = data[f.key];
    let summary;
    if (Array.isArray(v)) summary = `${v.length} item${v.length === 1 ? "" : "s"}`;
    else if (typeof v === "string") summary = v ? `"${v.slice(0, 45)}${v.length > 45 ? "…" : ""}"` : "(empty)";
    else summary = String(v);
    console.log(`  ${String(i + 1).padStart(2)}. ${f.label.padEnd(22)}  ${summary}`);
  });
  console.log("   q. Quit");
  const cmd = (await ask("\n> ")).trim();
  if (cmd === "q" || cmd === "") break;
  const n = parseInt(cmd, 10) - 1;
  const field = FIELDS[n];
  if (!field) { console.log("Unknown option."); continue; }
  if (field.kind === "text") await editText(field);
  else if (field.kind === "list_of_strings") await editListOfStrings(field);
  else if (field.kind === "list_of_objects") await editListOfObjects(field);
}

await save();
console.log(`\nSaved to ${filePath}`);
console.log(`Push to Shopify: node --env-file=.env.local scripts/seed-product-metafields.mjs ${handle}`);
rl.close();
