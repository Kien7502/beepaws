// Seasonal skins. A season overrides a handful of accent/band CSS variables
// in app/globals.css (`[data-season="…"]`); every component reads tokens, so
// nothing else changes. See the "Seasonal skins" block there for the rule that
// keeps a season from breaking text contrast.

export const SEASONS = ["default", "evergreen", "blossom"] as const;
export type Season = (typeof SEASONS)[number];

/**
 * The season to ship. Change this line, or set NEXT_PUBLIC_SEASONAL_THEME to
 * swap without touching code (env wins). Unknown values fall back to
 * "default", so a typo can never ship a half-applied skin.
 *
 * The attribute is rendered server-side in app/layout.tsx, so there is no
 * flash of the wrong palette. Pages are statically generated / ISR-cached:
 * a change takes effect on the next build or revalidation, which is the right
 * cadence for something that turns over with the calendar.
 */
const FALLBACK_SEASON: Season = "default";

export function activeSeason(): Season {
  const fromEnv = process.env.NEXT_PUBLIC_SEASONAL_THEME?.trim();
  if (fromEnv && (SEASONS as readonly string[]).includes(fromEnv)) {
    return fromEnv as Season;
  }
  return FALLBACK_SEASON;
}
