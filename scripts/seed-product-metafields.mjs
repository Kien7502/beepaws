/**
 * Populate all beepaws.* metafields on a single product.
 * Resolves the product by handle, then runs `metafieldsSet` in one call.
 *
 * Content source priority:
 *   1. scripts/products/<handle>.json (created/edited via edit-product-content.mjs)
 *   2. Built-in dental defaults below (used when no JSON file exists)
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-product-metafields.mjs <product-handle>
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_VERSION =
  process.env.SHOPIFY_ADMIN_GRAPHQL_VERSION?.trim() ||
  process.env.SHOPIFY_ADMIN_API_VERSION?.trim() ||
  "2025-04";

const handle = process.argv[2]?.trim();
if (!handle) {
  console.error("Usage: node --env-file=.env.local scripts/seed-product-metafields.mjs <product-handle>");
  process.exit(1);
}

function normalizeHost(raw) {
  if (!raw?.trim()) throw new Error("Set SHOPIFY_SHOP_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN");
  const h = raw.trim().replace(/^https?:\/\//, "").split("/")[0]?.replace(/\/$/, "") ?? "";
  if (!h.endsWith(".myshopify.com")) throw new Error(`Domain must be *.myshopify.com, got: ${h}`);
  return h;
}

const shop = normalizeHost(
  process.env.SHOPIFY_SHOP_DOMAIN?.trim() ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim(),
);

async function getAccessToken() {
  const staticTok = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  if (staticTok) return staticTok;

  const id =
    process.env.SHOPIFY_ADMIN_CLIENT_ID?.trim() || process.env.SHOPIFY_API_KEY?.trim();
  const secret =
    process.env.SHOPIFY_ADMIN_CLIENT_SECRET?.trim() ||
    process.env.SHOPIFY_API_SECRET?.trim();
  if (!id || !secret) {
    throw new Error("Set SHOPIFY_ADMIN_ACCESS_TOKEN or client_id + secret");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: body.toString(),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Non-JSON oauth: ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`OAuth ${res.status}: ${data.error_description || data.error || text.slice(0, 200)}`);
  if (!data.access_token) throw new Error("No access_token in oauth response");
  return data.access_token;
}

async function gql(token, query, variables) {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { throw new Error(`Non-JSON gql (HTTP ${res.status}): ${text.slice(0, 300)}`); }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors).slice(0, 400)}`);
  return body.data;
}

// ── Content to write — single source of truth ──────────────────────────────

const EDUCATION_NOTE =
  "First time? The device feels completely silent in your hand until it touches the tooth. That's normal — it means it's working.";

const PRODUCT_BULLETS = [
  "Shatters hardened tartar without scraping or force",
  "Silent & vibration-free — skittish pets stay calm",
  "Human-grade piezoelectric technology, now for pets",
  "Works on dogs and cats of all breeds and sizes",
  "30-day money-back guarantee",
];

const STATS = [
  { value: "10,000+", label: "Happy pet parents" },
  { value: "4.8★",    label: "Average review rating" },
  { value: "30 days", label: "Money-back guarantee" },
];

const TECH_SPECS = [
  { label: "Technology",    value: "Piezoelectric ultrasonic cavitation" },
  { label: "Frequency",     value: "25,000–45,000 Hz" },
  { label: "Operation",     value: "Silent in air — activates on tooth contact only" },
  { label: "Tips included", value: "3 interchangeable stainless steel tips" },
  { label: "Charging",      value: "USB-C, ~2-hour full charge" },
  { label: "Battery life",  value: "Up to 4 hours continuous use" },
  { label: "Suitable for",  value: "Dogs and cats, all breeds and sizes" },
  { label: "Guarantee",     value: "30-day money-back" },
];

const COMPARISON_ROWS = [
  { label: "Removes hard tartar", beepaws: true, vet: true,  other: false },
  { label: "No anesthesia risk",  beepaws: true, vet: false, other: true  },
  { label: "Safe at home",        beepaws: true, vet: false, other: true  },
  { label: "Silent operation",    beepaws: true, vet: false, other: true  },
  { label: "One-time cost",       beepaws: true, vet: false, other: false },
  { label: "30-day guarantee",    beepaws: true, vet: false, other: false },
];

const USE_CASES = [
  {
    emoji: "😴", label: "Stress-free", title: "For anxious dogs",
    description: "Silent ultrasonic frequency — no scary whirring or vibration. Your dog stays calm from start to finish.",
    from: "#f5a800", to: "#fff3dc",
  },
  {
    emoji: "🦷", label: "All sizes", title: "Any breed, any age",
    description: "From tiny Chihuahuas to large Labradors, BeePaws safely breaks down tartar on every dog.",
    from: "#8b5e2a", to: "#fff3dc",
  },
  {
    emoji: "🏠", label: "At home", title: "Skip the vet bill",
    description: "Professional-grade tartar removal at home. Save up to $1,400 on anesthesia cleanings — no appointment needed.",
    from: "#3d2400", to: "#fff3dc",
  },
];

const FAQ_ITEMS = [
  {
    icon: "Shield",
    q: "Is it safe for my dog's teeth and gums?",
    a: "Yes — BeePaws uses gentle ultrasonic vibration calibrated for pet tooth enamel. The non-invasive tip won't scratch or damage gums when used as directed, and there's no anesthesia risk.",
  },
  {
    icon: "PawPrint",
    q: "What breeds and ages is it suitable for?",
    a: "BeePaws works for dogs of all breeds and sizes. We recommend starting once adult teeth are in (around 6 months). Senior dogs with heavy tartar buildup tend to see the biggest transformation.",
  },
  {
    icon: "Volume2",
    q: "Will the ultrasonic sound scare my pet?",
    a: "The frequency operates near the upper limit of human hearing, and most dogs habituate within the first 30 seconds — especially when paired with the included pet-safe dental gel as a positive reinforcement.",
  },
  {
    icon: "Package",
    q: "What's included in the box?",
    a: "You'll get the BeePaws ultrasonic scaler, 3 interchangeable tip sizes, a tube of pet-safe dental gel, a USB-C charging cable, and a travel pouch.",
  },
  {
    icon: "RefreshCw",
    q: "What if it doesn't work for my dog?",
    a: "We offer a 30-day no-questions-asked return policy. If you and your dog aren't happy with the results, just reach out and we'll make it right — simple and fair.",
  },
];

const REVIEWS = [
  { name: "Sarah K.",   time: "2 weeks ago", rating: 5, likes: 1800, comments: 42, text: "My golden's teeth were covered in brown tartar for years. Vets quoted me $1,400 for an anesthesia cleaning. After 3 sessions with BeePaws — completely transformed. I'm in shock. 🐾", reply: "Before/after stories like this are exactly why we built BeePaws. Thanks Sarah! 🐶" },
  { name: "Mike T.",    time: "1 month ago", rating: 5, likes: 1100, comments: 28, text: "Skipped the vet cleaning and did it myself in 20 minutes. My corgi's breath went from absolutely awful to actually fine. The dental gel makes the whole thing easy. 😂", reply: null },
  { name: "Jessica L.", time: "3 weeks ago", rating: 5, likes: 980,  comments: 19, text: "My anxious rescue freaks out at the vet but sat completely still for the whole session. The near-silent operation is a game changer. I wish I'd found this sooner! ❤️", reply: "Rescue pets deserve the gentlest care — so glad BeePaws could help. ✨" },
  { name: "David R.",   time: "1 week ago",  rating: 4, likes: 654,  comments: 11, text: "Works great on my lab's heavy tartar buildup. Takes a bit of patience on the first session but the results after session 2 were really impressive. Solid at-home alternative to the vet.", reply: null },
  { name: "Emily C.",   time: "5 days ago",  rating: 5, likes: 872,  comments: 16, text: "Bought this for my 9-year-old dachshund. The vet said she needed a $900 dental procedure. Two BeePaws sessions later and her teeth look years younger. Incredible for the price. 😸", reply: "Senior dogs see some of the biggest results — love hearing this! 🐱" },
  { name: "James W.",   time: "2 months ago", rating: 5, likes: 1400, comments: 33, text: "Got the bundle deal for both my dogs. One session each and the plaque buildup I'd been worried about for months was visibly reduced. The dental gel smells great too — they actually enjoy it.", reply: null },
  { name: "Lisa M.",    time: "3 weeks ago", rating: 4, likes: 521,  comments: 9,  text: "My vet confirmed the tartar reduction at the last checkup and was genuinely surprised. She asked what I'd been doing differently. Would give 5 stars but takes a few sessions to see full results.", reply: "Give it 2-3 sessions and you'll see the full transformation. You're doing great! 🐾" },
  { name: "Carlos P.",  time: "6 days ago",  rating: 5, likes: 743,  comments: 22, text: "First-time dog owner here. Was nervous about doing this at home but the guide is super clear. My beagle's breath is so much better after just one session. 10/10 would recommend!", reply: "Welcome to the BeePaws family! Beagles are the best 🧡" },
  { name: "Rachel T.",  time: "1 month ago", rating: 5, likes: 1200, comments: 37, text: "Bought this for my sister after her vet gave her a scary dental quote. She messaged me three days later saying her dog's teeth look completely different. Best gift I've ever given.", reply: null },
  { name: "Tom B.",     time: "2 weeks ago", rating: 5, likes: 609,  comments: 14, text: "Was skeptical but $1,400 vet quotes will make you try anything. After 2 sessions the difference is visible and my vet actually complimented his teeth at his last checkup. Sold! 🙌", reply: "That vet compliment is the ultimate review. Thanks Tom! ✨" },
];

const BEFORE_AFTER_SLIDES = [
  {
    beforeImageUrl: "", afterImageUrl: "",
    beforeLabel: "Before", afterLabel: "After 3 Sessions",
    petName: "Bella, 4yr Chihuahua",
    caption: "Years of hardened tartar — chipped away at home, no anesthesia.",
  },
  {
    beforeImageUrl: "", afterImageUrl: "",
    beforeLabel: "Before", afterLabel: "After 2 Sessions",
    petName: "Max, 7yr Yorkshire Terrier",
    caption: null,
  },
];

// Built-in defaults (the dental scaler copy). Used only if no per-product JSON exists.
const DEFAULT_CONTENT = {
  education_note: EDUCATION_NOTE,
  product_bullets: PRODUCT_BULLETS,
  ingredients: [],
  stats: STATS,
  tech_specs: TECH_SPECS,
  comparison_rows: COMPARISON_ROWS,
  use_cases: USE_CASES,
  faq_items: FAQ_ITEMS,
  reviews: REVIEWS,
  before_after_slides: BEFORE_AFTER_SLIDES,
};

const contentFile = resolve(__dirname, "products", `${handle}.json`);
let content;
if (existsSync(contentFile)) {
  content = JSON.parse(await readFile(contentFile, "utf8"));
  console.log(`Using content from ${contentFile}\n`);
} else {
  content = DEFAULT_CONTENT;
  console.log(`No per-product JSON found — using built-in dental defaults.`);
  console.log(`(To author content interactively: node scripts/edit-product-content.mjs ${handle})\n`);
}

// Map each field key to its Shopify metafield type. Only keys present in `content`
// are pushed — that way the seed file can be partial without clobbering Shopify.
const FIELD_TYPES = {
  product_bullets:     "list.single_line_text_field",
  ingredients:         "list.single_line_text_field",
  education_note:      "single_line_text_field",
  tagline:             "single_line_text_field",
  tech_specs:          "json",
  comparison_rows:     "json",
  use_cases:           "json",
  faq_items:           "json",
  reviews:             "json",
  stats:               "json",
  before_after_slides: "json",
};

// Shopify type → serialization rule for metafieldsSet:
//   json:                          must be a JSON-stringified array/object
//   list.single_line_text_field:   also JSON-stringified array of strings
//   single_line_text_field:        plain string, no JSON wrapping
const ENTRIES = Object.entries(FIELD_TYPES).flatMap(([key, type]) => {
  const v = content[key];
  if (v === undefined) return [];
  const value = type === "single_line_text_field" ? String(v) : JSON.stringify(v);
  return [{ key, type, value }];
});

// ── Run ────────────────────────────────────────────────────────────────────

console.log(`Shop:    ${shop}`);
console.log(`API:     ${API_VERSION}`);
console.log(`Handle:  ${handle}\n`);

const token = await getAccessToken();

const productData = await gql(
  token,
  `query GetProductId($handle: String!) {
    productByHandle(handle: $handle) { id title }
  }`,
  { handle },
);

const product = productData.productByHandle;
if (!product) {
  console.error(`Product not found for handle "${handle}".\n`);
  console.error("Available handles in this shop:");
  const list = await gql(
    token,
    `query ListHandles { products(first: 50) { edges { node { handle title } } } }`,
  );
  for (const e of list.products.edges) {
    console.error(`  ${e.node.handle.padEnd(40)}  ${e.node.title}`);
  }
  process.exit(1);
}

console.log(`Found: ${product.title}`);
console.log(`       ${product.id}\n`);

const metafields = ENTRIES.map((e) => ({
  ownerId: product.id,
  namespace: "beepaws",
  key: e.key,
  type: e.type,
  value: e.value,
}));

const result = await gql(
  token,
  `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key type }
      userErrors { field message code }
    }
  }`,
  { metafields },
);

const set = result.metafieldsSet;
const errs = set.userErrors ?? [];

for (const m of set.metafields ?? []) {
  console.log(`  OK    beepaws.${m.key.padEnd(22)} (${m.type})`);
}
for (const e of errs) {
  console.log(`  FAIL  ${JSON.stringify(e)}`);
}

console.log(`\nSummary: ${set.metafields?.length ?? 0} set, ${errs.length} failed`);
process.exit(errs.length > 0 ? 1 : 0);
