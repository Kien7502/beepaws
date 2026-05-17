import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Force `Cache-Control: no-store` on product page responses. Browsers refuse
// to bfcache pages served with no-store, which is what we want: when a user
// goes to Shopify checkout and presses Back, the PDP reloads fresh instead of
// restoring from bfcache in a half-hydrated, frozen state.
//
// We set this in middleware (not next.config.ts `headers()`) because Next.js
// dev mode forces `Cache-Control: no-cache, must-revalidate` on HTML responses,
// which overrides any config-level header and — critically — `no-cache` does
// NOT disable bfcache, only `no-store` does. Middleware runs after Next.js
// writes the response, so headers set here win.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/products/")) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
}

export const config = {
  matcher: "/products/:path*",
};
