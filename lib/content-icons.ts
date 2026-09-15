// SERVER-ONLY. The content-icon resolver for every authored icon name — FAQ
// items, hero bullets, comparison columns.
//
// Why the whole lucide catalog and not a hand-written map: the map used to be
// curated by hand and it DRIFTED from the admin tool's picker. The vet FAQ
// authored "Stethoscope", which the map didn't know, so it silently rendered as
// a shield. Then the picker grew and the map had to grow with it — same bug,
// waiting. Resolving against lucide's own `icons` map means the picker can offer
// any icon lucide has and this side already renders it. Both repos pin the SAME
// lucide version, so the glyph the editor previews is the glyph the shopper sees.
//
// `icons` is lucide's canonical map: ~1700 PascalCase names, deprecated aliases
// excluded, each value identical to the matching named export.
//
// The `server-only` import is the load-bearing part. Importing the full catalog
// into a CLIENT component would ship every icon to the browser (~400KB), so this
// module must only ever be reached from a server component — and now a client
// import fails the build instead of quietly bloating the bundle. A client
// component that needs an authored icon takes it as a rendered ReactNode prop
// from its server parent (see FAQSection → FAQAccordion).
import "server-only";
import { icons, type LucideIcon } from "lucide-react";

const CATALOG = icons as unknown as Record<string, LucideIcon | undefined>;

/** Resolve an authored icon name, falling back when it is unknown or absent. */
export function contentIcon(name: string | undefined, fallback: LucideIcon): LucideIcon {
  if (!name) return fallback;
  return CATALOG[name] ?? fallback;
}
