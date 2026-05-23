/**
 * Single source of truth for the `beepaws.*` metafield set.
 *
 * Every script under scripts/ that touches metafields imports from here:
 *   - seed-metafield-definitions.mjs → creates Shopify Admin definitions +
 *     writes/updates scripts/products/_template.json (initial empty shape)
 *   - edit-product-content.mjs       → drives the interactive editor menu +
 *     backfills new keys into existing per-product JSON
 *   - seed-product-metafields.mjs    → resolves Shopify metafield types
 *
 * Adding a metafield = one edit here + re-running seed-metafield-definitions.
 *
 * ─── Schema entry shape ─────────────────────────────────────────────────────
 *
 *   key:          metafield key under `beepaws.*` (no namespace prefix)
 *   name:         human-friendly name shown in the Shopify Admin UI
 *   shopifyType:  Shopify metafield type
 *                 - "single_line_text_field"       → plain string
 *                 - "list.single_line_text_field"  → string[]
 *                 - "json"                         → arbitrary parsed JSON
 *   kind:         editor handling (paired with shopifyType)
 *                 - "text"               → single string
 *                 - "list_of_strings"    → string[]
 *                 - "list_of_objects"    → object[] (needs itemFields)
 *   label:        short label shown in the editor's main menu
 *   itemFields:   only for kind="list_of_objects" — fields prompted per item
 *                 each: { key, label, type?, default? }
 *                 type: "boolean" | "number" | "nullable_string" | undefined (string)
 *   summary:      only for kind="list_of_objects" — function that builds a
 *                 one-line preview of an item for the editor menu
 *
 * Order matters — fields render in the editor menu in this order.
 */

export const METAFIELD_SCHEMAS = [
  {
    key: "tagline",
    name: "Card Tagline",
    shopifyType: "single_line_text_field",
    kind: "text",
    label: "Card tagline",
  },
  {
    key: "education_note",
    name: "Education Note",
    shopifyType: "single_line_text_field",
    kind: "text",
    label: "Education note",
  },
  {
    key: "product_bullets",
    name: "Product Bullet Points",
    shopifyType: "list.single_line_text_field",
    kind: "list_of_strings",
    label: "Product bullets",
  },
  {
    key: "ingredients",
    name: "Ingredients",
    shopifyType: "list.single_line_text_field",
    kind: "list_of_strings",
    label: "Ingredients",
  },
  {
    key: "stats",
    name: "Stats Trust Bar",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Stats",
    itemFields: [
      { key: "value", label: "Value (e.g. 10,000+)" },
      { key: "label", label: "Label" },
    ],
    summary: (i) => `${i.value} ${i.label}`,
  },
  {
    key: "tech_specs",
    name: "Tech Specifications",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Tech specs",
    itemFields: [
      { key: "label", label: "Label" },
      { key: "value", label: "Value" },
    ],
    summary: (i) => `${i.label} → ${i.value}`,
  },
  {
    key: "comparison_rows",
    name: "Comparison Table Rows",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Comparison rows",
    itemFields: [
      { key: "label",   label: "Row label" },
      { key: "beepaws", label: "BeePaws? (true/false)", type: "boolean", default: true },
      { key: "vet",     label: "Vet? (true/false)",     type: "boolean", default: false },
      { key: "other",   label: "Other? (true/false)",   type: "boolean", default: false },
    ],
    summary: (i) =>
      `${i.label}  [${i.beepaws ? "✓" : "✗"} / ${i.vet ? "✓" : "✗"} / ${i.other ? "✓" : "✗"}]`,
  },
  {
    key: "use_cases",
    name: "Use Case Cards",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Use cases",
    itemFields: [
      { key: "emoji",       label: "Emoji" },
      { key: "label",       label: "Label (badge)" },
      { key: "title",       label: "Title" },
      { key: "description", label: "Description" },
      { key: "from",        label: "Gradient from (#hex)", default: "#f5a800" },
      { key: "to",          label: "Gradient to (#hex)",   default: "#fff3dc" },
    ],
    summary: (i) => `${i.emoji} ${i.title}`,
  },
  {
    key: "faq_items",
    name: "FAQ Items",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "FAQ items",
    itemFields: [
      { key: "icon", label: "Icon (Shield|PawPrint|Volume2|Package|RefreshCw)", default: "Shield" },
      { key: "q",    label: "Question" },
      { key: "a",    label: "Answer" },
    ],
    summary: (i) => `[${i.icon}] ${i.q}`,
  },
  {
    key: "reviews",
    name: "Customer Reviews",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Reviews",
    itemFields: [
      { key: "name",     label: "Name (e.g. Sarah K.)" },
      { key: "time",     label: "Time (e.g. 2 weeks ago)" },
      { key: "rating",   label: "Rating (1-5)",       type: "number", default: 5 },
      { key: "likes",    label: "Likes (integer)",    type: "number", default: 0 },
      { key: "comments", label: "Comments (integer)", type: "number", default: 0 },
      { key: "text",     label: "Review text" },
      { key: "reply",    label: "Reply (blank or '-' for none)", type: "nullable_string" },
    ],
    summary: (i) =>
      `${i.name} (${"★".repeat(i.rating)}) — ${(i.text || "").slice(0, 50)}…`,
  },
  {
    key: "before_after_slides",
    name: "Before After Slides",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Before/after slides",
    itemFields: [
      { key: "beforeImageUrl", label: "Before image URL (blank for placeholder)" },
      { key: "afterImageUrl",  label: "After image URL (blank for placeholder)" },
      { key: "beforeLabel",    label: "Before label", default: "Before" },
      { key: "afterLabel",     label: "After label",  default: "After 3 Sessions" },
      { key: "petName",        label: "Pet name (e.g. Bella, 4yr Chihuahua)" },
      { key: "caption",        label: "Caption (blank or '-' for none)", type: "nullable_string" },
    ],
    summary: (i) => i.petName || "(unnamed slide)",
  },
  {
    key: "bundle_tiers",
    name: "Bundle Tier Copy",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Bundle tier copy",
    itemFields: [
      { key: "name",        label: "Tier name (blank uses code default)" },
      { key: "description", label: "Description (blank uses code default)" },
    ],
    summary: (i) =>
      `${i.name || "(default name)"} — ${i.description || "(default description)"}`,
  },
  {
    key: "pain_points",
    name: "Pain Points",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Pain points",
    itemFields: [
      { key: "number",      label: "Number (e.g. 01)" },
      { key: "title",       label: "Title" },
      { key: "description", label: "Description" },
    ],
    summary: (i) => `${i.number} ${i.title}`,
  },
  {
    key: "mechanism_steps",
    name: "Mechanism Steps",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Mechanism steps (how it works)",
    itemFields: [
      { key: "number",      label: "Step number (e.g. 1)" },
      { key: "title",       label: "Step title" },
      { key: "description", label: "Step description" },
    ],
    summary: (i) => `Step ${i.number}: ${i.title}`,
  },
  {
    key: "guarantee",
    name: "Guarantee Block",
    shopifyType: "json",
    kind: "list_of_objects",
    label: "Guarantee block (single entry)",
    itemFields: [
      { key: "sealNumber",  label: "Seal numeral (e.g. 30)" },
      { key: "sealLabel",   label: "Seal label (e.g. Day Promise)" },
      { key: "title",       label: "Headline" },
      { key: "description", label: "Body copy" },
    ],
    summary: (i) => `${i.sealNumber}-${i.sealLabel}: ${i.title}`,
  },
];

/** Empty initial value for a schema entry — used for new product files
 * and to backfill keys after the schema gains a new field. */
export function emptyValue(schema) {
  return schema.kind === "text" ? "" : [];
}

/** Build the `_template.json` body — all keys with empty values, in schema order. */
export function buildTemplate() {
  const out = {};
  for (const s of METAFIELD_SCHEMAS) out[s.key] = emptyValue(s);
  return out;
}
