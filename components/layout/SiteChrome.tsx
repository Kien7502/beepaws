"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Pages that render WITHOUT the site's header, footer and floating buttons.
// The listicles are single-purpose editorial pages: no navigation, no cart, no
// popups — the reading experience is the conversion (owner's visual reference,
// 2026-10-05). Wrap each piece of site chrome in the root layout with this.
const BARE = ["/journal", "/preview/listicles"];

export function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "";
  if (BARE.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}
