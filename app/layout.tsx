import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollToTopButton } from "@/components/ui/ScrollToTopButton";
import { activeSeason } from "@/lib/theme";

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
  title: "Beepaws | Pet E-commerce",
  description: "Your pet deserves the best - Shop premium pet supplies.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // data-season drives the seasonal skin (lib/theme.ts → the [data-season]
  // blocks in globals.css). Server-rendered, so the right palette is in the
  // first paint — no flash of the default.
  return (
    <html lang="en" data-season={activeSeason()} suppressHydrationWarning>
      <body className={`${fraunces.variable} ${hankenGrotesk.variable} antialiased min-h-screen flex flex-col`}>
        <CartProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <ScrollToTopButton />
        </CartProvider>
      </body>
    </html>
  );
}
