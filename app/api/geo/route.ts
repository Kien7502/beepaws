import { NextResponse } from "next/server";

// The visitor's country, for the "we ship to the US only" note in the
// announcement bar (owner, 2026-10-21). Vercel sets x-vercel-ip-country on
// every request; where the host gives none (local dev) the answer is null and
// nothing changes on the page. Never cached: it's per visitor.
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const raw = req.headers.get("x-vercel-ip-country")?.trim().toUpperCase() ?? "";
  const country = /^[A-Z]{2}$/.test(raw) ? raw : null;
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
