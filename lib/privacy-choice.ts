// A visitor's "do not sell or share" choice (2026-10-26). Shopify's privacy
// policy promises an opt-out "here", linking /pages/data-sharing-opt-out, which
// next.config.ts redirects to /privacy-choices. The site loads no trackers
// today, so the choice changes nothing yet — but ANY tracker or ad pixel added
// later (a Meta pixel is planned) must not load while optedOut() is true. The
// page promises that.

export const OPT_OUT_COOKIE = "beepaws_optout";
const TWO_YEARS = 60 * 60 * 24 * 730;

/** Global Privacy Control: a browser-level opt-out, honoured automatically. */
export function gpcEnabled(): boolean {
  return (
    typeof navigator !== "undefined" &&
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  );
}

/** The visitor opted out on /privacy-choices (this browser). */
export function optOutSaved(): boolean {
  return typeof document !== "undefined" && document.cookie.split("; ").includes(`${OPT_OUT_COOKIE}=1`);
}

export function optedOut(): boolean {
  return gpcEnabled() || optOutSaved();
}

export function saveOptOut(on: boolean) {
  document.cookie = on
    ? `${OPT_OUT_COOKIE}=1; Max-Age=${TWO_YEARS}; Path=/; SameSite=Lax; Secure`
    : `${OPT_OUT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}
