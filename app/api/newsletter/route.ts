import { NextResponse } from "next/server";
import { cleanEmail, subscribeEmail } from "@/lib/shopify/newsletter";

// The footer's newsletter form posts here (lib/shopify/newsletter.ts does the
// Shopify side). Public, so: a hidden "company" field bots fill in (answered
// with a fake success), and a per-visitor throttle — best effort, counted per
// server instance like the kit-shipping route's.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  if (throttled(ip)) return NextResponse.json({ error: "Too many tries. Please wait a minute." }, { status: 429 });
  let body: { email?: unknown; company?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.company === "string" && body.company.trim()) return NextResponse.json({ ok: true });
  const email = cleanEmail(body.email);
  if (!email) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  try {
    await subscribeEmail(email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn("[newsletter]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "We couldn't sign you up just now. Please try again later." }, { status: 502 });
  }
}
