import type { CSSProperties } from "react";

// How an admin-authored homepage image sits in its slot (2026-10-01/02).
//
// Every slot crops with object-cover. The focal point aims that crop; the zoom
// enlarges the picture AROUND it. `object-position: X% Y%` puts the image's X%,Y%
// point on the slot's X%,Y% point, so scaling from that same origin keeps the
// subject exactly where it was - and a scale >= 1 from a point inside the slot can
// never uncover an edge, so the slot always stays filled.
//
// A plain module, not server-only: the proof carousel is a client component.
// KEEP IN SYNC with beepaws-admin/lib/homepage.ts `cropStyle` - the editor's crop
// previews run this same CSS so they show what the site will.

export interface Crop {
  focusX?: number;
  focusY?: number;
  zoom?: number;
}

/** Inline style for the slot's <Image> (undefined = centred, unzoomed). */
export function cropStyle(c?: Crop): CSSProperties | undefined {
  if (!c) return undefined;
  const pos = c.focusX != null && c.focusY != null ? `${c.focusX}% ${c.focusY}%` : undefined;
  const zoom = c.zoom && c.zoom > 1 ? c.zoom : undefined;
  if (!pos && !zoom) return undefined;
  return {
    objectPosition: pos,
    ...(zoom ? { transform: `scale(${zoom})`, transformOrigin: pos ?? "50% 50%" } : {}),
  };
}

/** A zoomed slot shows part of the image larger, so ask next/image for a
 *  proportionally wider file - otherwise a 2x zoom upscales the one picked for the
 *  unzoomed slot. Scales every vw length in a `sizes` string (media queries are px
 *  and stay untouched). */
export function cropSizes(sizes: string, zoom?: number): string {
  if (!zoom || zoom <= 1) return sizes;
  return sizes.replace(/(\d+(?:\.\d+)?)vw/g, (_, n: string) => `${Math.round(Number(n) * zoom)}vw`);
}
