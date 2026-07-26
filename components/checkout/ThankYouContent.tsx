"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { useCart, getStoredCartId, markCartCompleted } from "@/components/cart/CartProvider";

/**
 * Landing point for a customer coming back from Shopify's hosted checkout.
 * Shopify has no built-in return-URL redirect for the Storefront Cart API (see
 * docs/post-purchase-return.md), so reaching this route at all depends on a
 * merchant-configured redirect on the Shopify side. Once here, the purchase is
 * treated as confirmed: the local/synced cart is cleared so the drawer and
 * checkout button can't re-present or re-checkout already-bought lines.
 *
 * Contract: an optional `cart_id` query param lets whatever redirect mechanism
 * sends the customer here identify the Shopify cart that just converted (it
 * may differ from the id in this browser's storage — e.g. a different tab or
 * device completed the purchase). When present, it's recorded as completed
 * alongside whichever cart id this browser currently has stored.
 */
export function ThankYouContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const returnedCartId = searchParams.get("cart_id");

  useEffect(() => {
    const storedCartId = getStoredCartId();
    if (storedCartId) markCartCompleted(storedCartId);
    if (returnedCartId && returnedCartId !== storedCartId) {
      markCartCompleted(returnedCartId);
    }
    clearCart();
    // Intentionally run once on mount — clearCart/markCartCompleted are
    // idempotent, and this route's whole purpose is a one-time confirmation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary)]">
        <CheckCircle2 size={32} className="text-[var(--color-primary)]" aria-hidden />
      </div>
      <p className="max-w-md text-[var(--color-text)]/80">
        We&apos;ve sent a confirmation email with your order details. Your cart
        has been cleared, so you&apos;re all set for your next visit.
      </p>
      <Link
        href="/collections/all"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        Continue shopping
      </Link>
    </div>
  );
}
