/**
 * Interactive editor for product metafield content.
 *
 * Reads/writes scripts/products/<handle>.json. Field shape comes from
 * scripts/metafield-schemas.mjs — adding a metafield there shows up in the
 * editor menu on the next run with no code changes needed here.
 *
 * On first run for a handle, copies scripts/products/_template.json (which
 * seed-metafield-definitions.mjs keeps in sync with the schema). On
 * subsequent runs, backfills any newly-added schema keys.
 *
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
import { METAFIELD_SCHEMAS, emptyValue, buildTemplate } from "./metafield-schemas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = resolve(__dirname, "products");
const TEMPLATE_PATH = resolve(PRODUCTS_DIR, "_template.json");

const handle = process.argv[2]?.trim();
if (!handle) {
  console.error("Usage: node scripts/edit-product-content.mjs <product-handle>");
  process.exit(1);
}

const filePath = resolve(PRODUCTS_DIR, `${handle}.json`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => rl.question(q);

// ── Load existing content ─────────────────────────────────────────────────

async function loadTemplate() {
  // Prefer the on-disk template (kept in sync by seed-metafield-definitions).
  // Falls back to building one in memory if the seed script hasn't been run.
  if (existsSync(TEMPLATE_PATH)) {
    try { return JSON.parse(await readFile(TEMPLATE_PATH, "utf8")); }
    catch { /* fall through */ }
  }
  return buildTemplate();
}

let data;
if (existsSync(filePath)) {
  const raw = await readFile(filePath, "utf8");
  try { data = JSON.parse(raw); console.log(`Loaded ${filePath}`); }
  catch { console.error("Existing file is invalid JSON — starting fresh."); data = {}; }
} else {
  console.log(`Creating new file: ${filePath}`);
  await mkdir(PRODUCTS_DIR, { recursive: true });
  // Seed from the template so a brand-new product file starts with all the
  // currently-defined keys, in the right shape.
  data = await loadTemplate();
}

// Backfill keys that were added to the schema after this product file was
// created. Keeps existing values untouched.
const addedKeys = [];
for (const s of METAFIELD_SCHEMAS) {
  if (data[s.key] === undefined) {
    data[s.key] = emptyValue(s);
    addedKeys.push(s.key);
  }
}
if (addedKeys.length > 0) {
  console.log(`Backfilled ${addedKeys.length} new key(s) from schema: ${addedKeys.join(", ")}`);
}

const FIELDS = METAFIELD_SCHEMAS;

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
  // The schema entry doubles as the item schema — promptForObject reads
  // `fields`, editListOfObjects reads `itemFields`. Adapter below.
  const schema = { fields: field.itemFields, summary: field.summary };
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
