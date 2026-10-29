import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { activeSeason } from "@/lib/theme";
import { LEGAL_POLICIES, getLegalPolicies } from "@/lib/shopify/policies";

// Warm Honey type system: Fraunces (display serif) for headings + brand
// moments, Hanken Grotesk (humanist sans) for body. next/font assigns each a
// CSS variable; globals.css wires those into @theme as --font-display /
// --font-body so Tailwind's font-display / font-body utilities resolve to the
// real font (and the literal var-name conflict — `--font-display: var(--font-display)` —
// is avoided by giving next/font its own internal name).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BeePaws",
  // Launch (2026-10-21): the template's "premium pet supplies" line is gone;
  // only claims the product pages make (no anesthesia, 60-day promise).
  description: "At-home ultrasonic plaque removal for dogs. No anesthesia, no vet bill, and a 60-day promise.",
  // Icons come from the file conventions in app/: favicon.ico (16/32/48), icon.png
  // (512 square) and apple-icon.png (180, on the paper color). The old 1233x1613
  // icon.png (~1 MB) + icon.jpeg were fetched by every new visitor for a 16px tab icon.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Footer links to the legal policies set in Shopify (lib/shopify/policies.ts,
  // cached + hourly): a policy that isn't set has no link, so none can 404.
  const policies = await getLegalPolicies();
  // "Your privacy choices" (our own page, always there) follows them.
  const legal = [
    ...LEGAL_POLICIES.filter((p) => policies[p.handle]).map((p) => ({ href: `/policies/${p.handle}`, label: p.label })),
    { href: "/privacy-choices", label: "Your privacy choices" },
  ];
  // data-season drives the seasonal skin (lib/theme.ts → the [data-season]
  // blocks in globals.css). Server-rendered, so the right palette is in the
  // first paint — no flash of the default. lang en-US (2026-10-21): the store
  // sells to the US only, and this tells search engines the page is US English.
  return (
    <html lang="en-US" data-season={activeSeason()} suppressHydrationWarning>
      <body className={`${fraunces.variable} ${hankenGrotesk.variable} antialiased min-h-screen flex flex-col`}>
        <CartProvider>
          {/* SiteChrome drops the header/footer/back-to-top on the journal pages
              (single-purpose editorial pages — see that component). */}
          <SiteChrome>
            <Header />
          </SiteChrome>
          <main className="flex-grow">
            {children}
          </main>
          <SiteChrome>
            <Footer legal={legal} />
          </SiteChrome>
          <CartDrawer />
          <SiteChrome>
            <ScrollToTopButton />
          </SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
