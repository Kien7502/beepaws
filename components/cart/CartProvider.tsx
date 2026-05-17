"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  hasStorefrontConfig,
  getCart,
  createCart as apiCreateCart,
  addCartLines,
  updateCartLine,
  removeCartLine,
  type ShopifyCart,
} from "@/lib/shopify/cart-client";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CART_ID_KEY = "beepaws_shopify_cart_id";
const LEGACY_KEY = "beepaws_local_cart_v1";
const DEBOUNCE_MS = 600;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LocalCartItem = {
  merchandiseId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string;
  currencyCode: string;
  unitPriceAmount: string;
  quantity: number;
  lineId?: string; // Shopify cart line GID — present when synced
};

type CartContextValue = {
  // ── Backwards-compatible API ──────────────────────────────────────────
  items: LocalCartItem[];
  itemCount: number;
  subtotalAmount: number;
  subtotalCurrency: string;
  hydrated: boolean;
  lastAddedAt: number;
  lastAddedQuantity: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: LocalCartItem) => void;
  updateQuantity: (merchandiseId: string, quantity: number) => void;
  removeItem: (merchandiseId: string) => void;
  clearCart: () => void;
  // ── Phase 4 ───────────────────────────────────────────────────────────
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  checkoutUrl: string;
  isCartLoading: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readCartId(): string | null {
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function writeCartId(id: string) {
  try {
    localStorage.setItem(CART_ID_KEY, id);
  } catch {}
}

function clearCartId() {
  try {
    localStorage.removeItem(CART_ID_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}

function readLegacyItems(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => typeof i?.merchandiseId === "string" && typeof i?.quantity === "number" && i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeLegacyItems(items: LocalCartItem[]) {
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(items));
  } catch {}
}

function mapShopifyToLocal(cart: ShopifyCart): LocalCartItem[] {
  return cart.lines.map((line) => ({
    lineId: line.lineId,
    merchandiseId: line.merchandiseId,
    productHandle: line.productHandle,
    productTitle: line.productTitle,
    variantTitle: line.variantTitle,
    imageUrl: line.imageUrl,
    currencyCode: line.currencyCode,
    unitPriceAmount: line.unitPriceAmount,
    quantity: line.quantity,
  }));
}

// Reorder Shopify response lines to match the local order. Shopify returns
// lines in its own (cursor) order, which doesn't always match the order the
// user just saw — committing the response as-is causes a visible "jump" on
// add. We preserve current display order; unknown lines (rare — server-side
// adds) go at the end.
function reorderLikePrev(
  updated: ShopifyCart,
  prev: ShopifyCart | null,
): ShopifyCart {
  if (!prev || prev.lines.length === 0) return updated;
  const orderIndex = new Map(
    prev.lines.map((l, i) => [l.merchandiseId, i]),
  );
  const lines = [...updated.lines].sort((a, b) => {
    const ai = orderIndex.get(a.merchandiseId) ?? Number.POSITIVE_INFINITY;
    const bi = orderIndex.get(b.merchandiseId) ?? Number.POSITIVE_INFINITY;
    return ai - bi;
  });
  return { ...updated, lines };
}

function mergeLocalItem(prev: LocalCartItem[], next: LocalCartItem): LocalCartItem[] {
  const found = prev.find((p) => p.merchandiseId === next.merchandiseId);
  if (!found) return [...prev, next];
  return prev.map((p) =>
    p.merchandiseId === next.merchandiseId
      ? { ...p, quantity: Math.min(99, p.quantity + next.quantity) }
      : p,
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [shopifyCart, setShopifyCart] = useState<ShopifyCart | null>(null);
  const [localItems, setLocalItems] = useState<LocalCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [lastAddedQuantity, setLastAddedQuantity] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Stable refs for stale-closure-safe debounce callbacks
  const shopifyCartRef = useRef<ShopifyCart | null>(null);
  shopifyCartRef.current = shopifyCart;
  const localItemsRef = useRef<LocalCartItem[]>([]);
  localItemsRef.current = localItems;

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Operation queue — serializes cart API mutations so add/remove/update
  // can't race each other. Without this, removing an item mid-add could
  // skip syncing the removal (lineId not yet known), and the in-flight add
  // would then push the removed item back into Shopify state.
  const cartOpQueue = useRef<Promise<unknown>>(Promise.resolve());
  // Counts ops that have been enqueued but not yet completed. Used by each
  // op's success handler: only commit Shopify's response when no LATER op
  // is queued. Otherwise the response is stale w.r.t. the user's intent —
  // e.g. removing A then B in quick succession: A's response still contains
  // B, and committing it would visibly resurrect B until B's op finishes
  // (the "reappear-then-disappear" flicker).
  const inFlightCount = useRef(0);
  function queueCartOp(op: () => Promise<unknown>): void {
    inFlightCount.current++;
    cartOpQueue.current = cartOpQueue.current
      .catch(() => {}) // one failing op shouldn't block the queue
      .then(async () => {
        try {
          await op();
        } finally {
          inFlightCount.current--;
        }
      });
  }

  // addItem buffer — multiple addItem calls fired in the same tick (e.g. a
  // bundle that adds 4 products at once) are coalesced into a single
  // addCartLines request. Without this, each item took a separate round-trip
  // and each response clobbered the optimistic state, making items visibly
  // appear in the cart one by one.
  const pendingAddsRef = useRef<{ merchandiseId: string; quantity: number }[]>([]);
  const flushScheduledRef = useRef(false);

  // Derived: use Shopify cart items when available, else localStorage items
  const items = useMemo<LocalCartItem[]>(
    () => (shopifyCart ? mapShopifyToLocal(shopifyCart) : localItems),
    [shopifyCart, localItems],
  );

  // ── Hydration: restore cart on mount ────────────────────────────────────

  useEffect(() => {
    async function restore() {
      if (hasStorefrontConfig()) {
        const cartId = readCartId();
        if (cartId) {
          const cart = await getCart(cartId);
          if (cart) {
            setShopifyCart(cart);
          } else {
            // Cart expired on Shopify's side
            clearCartId();
          }
        }
      } else {
        // Storefront API not configured → use legacy localStorage
        setLocalItems(readLegacyItems());
      }
      setHydrated(true);
    }
    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep legacy storage in sync when operating in non-Shopify mode
  useEffect(() => {
    if (hydrated && !hasStorefrontConfig()) {
      writeLegacyItems(localItems);
    }
  }, [hydrated, localItems]);

  // ── addItem ───────────────────────────────────────────────────────────────

  const addItem = useCallback((next: LocalCartItem) => {
    setLastAddedAt(Date.now());
    setLastAddedQuantity(Math.max(1, next.quantity || 1));
    setDrawerOpen(true);

    // Optimistic local update — visible immediately regardless of sync mode.
    setLocalItems((prev) => mergeLocalItem(prev, next));

    // Mirror the optimistic add into shopifyCart too. The `items` selector
    // picks shopifyCart over localItems when present, so without this the
    // new item stays invisible until Shopify responds (~hundreds of ms felt
    // like the cart was "slow"). lineId is filled in by the eventual API
    // response; until then it's an empty string.
    setShopifyCart((prev) => {
      if (!prev) return prev;
      const idx = prev.lines.findIndex(
        (l) => l.merchandiseId === next.merchandiseId,
      );
      const lines =
        idx === -1
          ? [
              ...prev.lines,
              {
                lineId: "",
                merchandiseId: next.merchandiseId,
                productHandle: next.productHandle,
                productTitle: next.productTitle,
                variantTitle: next.variantTitle,
                imageUrl: next.imageUrl,
                currencyCode: next.currencyCode,
                unitPriceAmount: next.unitPriceAmount,
                quantity: next.quantity,
              },
            ]
          : prev.lines.map((l, i) =>
              i === idx
                ? { ...l, quantity: Math.min(99, l.quantity + next.quantity) }
                : l,
            );
      const subtotalAmount = lines
        .reduce(
          (sum, l) => sum + parseFloat(l.unitPriceAmount || "0") * l.quantity,
          0,
        )
        .toFixed(2);
      return { ...prev, lines, subtotalAmount };
    });

    if (!hasStorefrontConfig()) return;

    setIsCartLoading(true);

    // Buffer this line and schedule a single flush at end of the current tick.
    pendingAddsRef.current.push({
      merchandiseId: next.merchandiseId,
      quantity: next.quantity,
    });

    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;

    queueMicrotask(() => {
      flushScheduledRef.current = false;
      const batch = pendingAddsRef.current;
      pendingAddsRef.current = [];
      if (batch.length === 0) {
        setIsCartLoading(false);
        return;
      }

      // Coalesce repeated merchandiseIds so we send one line per variant.
      const counts = new Map<string, number>();
      for (const l of batch) {
        counts.set(l.merchandiseId, (counts.get(l.merchandiseId) ?? 0) + l.quantity);
      }
      const lines = Array.from(counts, ([merchandiseId, quantity]) => ({
        merchandiseId,
        quantity,
      }));

      queueCartOp(async () => {
        try {
          const existingId = readCartId();
          let updated: ShopifyCart;

          if (existingId) {
            try {
              updated = await addCartLines(existingId, lines);
            } catch {
              updated = await apiCreateCart(lines);
            }
          } else {
            updated = await apiCreateCart(lines);
          }

          writeCartId(updated.id);
          // Only commit if no later op is pending — see inFlightCount note.
          if (inFlightCount.current <= 1) {
            const ordered = reorderLikePrev(updated, shopifyCartRef.current);
            setShopifyCart(ordered);
            setLocalItems(mapShopifyToLocal(ordered));
          }
        } catch (e) {
          console.error("[Cart] addItem sync failed:", e);
        } finally {
          setIsCartLoading(false);
        }
      });
    });
  }, []);

  // ── updateQuantity (optimistic + debounced API) ───────────────────────────

  const updateQuantity = useCallback(
    (merchandiseId: string, quantity: number) => {
      // Immediate optimistic update
      setLocalItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.merchandiseId !== merchandiseId)
          : prev.map((i) =>
              i.merchandiseId === merchandiseId ? { ...i, quantity } : i,
            ),
      );
      if (shopifyCartRef.current) {
        setShopifyCart((prev) =>
          prev
            ? {
                ...prev,
                lines:
                  quantity <= 0
                    ? prev.lines.filter((l) => l.merchandiseId !== merchandiseId)
                    : prev.lines.map((l) =>
                        l.merchandiseId === merchandiseId ? { ...l, quantity } : l,
                      ),
              }
            : prev,
        );
      }

      // Debounced Shopify sync
      const cartId = readCartId();
      if (!cartId || !hasStorefrontConfig()) return;

      const item = localItemsRef.current.find(
        (i) => i.merchandiseId === merchandiseId,
      );
      if (!item?.lineId) return;

      const lineId = item.lineId;

      const prev = debounceTimers.current.get(merchandiseId);
      if (prev) clearTimeout(prev);

      const timer = setTimeout(() => {
        debounceTimers.current.delete(merchandiseId);
        // Route through the same operation queue so quantity changes can't
        // race with concurrent add/remove on the same cart.
        queueCartOp(async () => {
          try {
            const updated =
              quantity <= 0
                ? await removeCartLine(cartId, lineId)
                : await updateCartLine(cartId, lineId, quantity);
            if (inFlightCount.current <= 1) {
              const ordered = reorderLikePrev(updated, shopifyCartRef.current);
              setShopifyCart(ordered);
              setLocalItems(mapShopifyToLocal(ordered));
            }
          } catch (e) {
            console.error("[Cart] updateQuantity sync failed:", e);
          }
        });
      }, DEBOUNCE_MS);

      debounceTimers.current.set(merchandiseId, timer);
    },
    [],
  );

  // ── removeItem (immediate) ────────────────────────────────────────────────

  const removeItem = useCallback((merchandiseId: string) => {
    // Optimistic removal — local state is the user's intent, applied immediately.
    setLocalItems((prev) => prev.filter((i) => i.merchandiseId !== merchandiseId));
    setShopifyCart((prev) =>
      prev
        ? { ...prev, lines: prev.lines.filter((l) => l.merchandiseId !== merchandiseId) }
        : prev,
    );

    if (!hasStorefrontConfig()) return;

    // Queue the Shopify-side removal so it can't race with a pending add. The
    // queue ensures the previous add (if any) has already given us a lineId
    // by the time we run; if not, we refetch the cart to find it.
    queueCartOp(async () => {
      const cartId = readCartId();
      if (!cartId) return;

      // Look up lineId — first from our cached Shopify cart, otherwise refetch.
      // The refetch path is the important fix: previously, a missing lineId
      // skipped the sync entirely, leaving the item alive in Shopify and
      // letting it reappear on the next addItem refresh.
      let lineId = shopifyCartRef.current?.lines.find(
        (l) => l.merchandiseId === merchandiseId,
      )?.lineId;

      if (!lineId) {
        try {
          const fresh = await getCart(cartId);
          if (fresh) lineId = fresh.lines.find((l) => l.merchandiseId === merchandiseId)?.lineId;
        } catch (e) {
          console.error("[Cart] removeItem refetch failed:", e);
          return;
        }
      }

      if (!lineId) return; // Item genuinely not in Shopify cart — nothing to remove.

      try {
        const updated = await removeCartLine(cartId, lineId);
        if (inFlightCount.current <= 1) {
          const ordered = reorderLikePrev(updated, shopifyCartRef.current);
          setShopifyCart(ordered);
          setLocalItems(mapShopifyToLocal(ordered));
        }
      } catch (e) {
        console.error("[Cart] removeItem sync failed:", e);
      }
    });
  }, []);

  // ── clearCart ─────────────────────────────────────────────────────────────

  const clearCart = useCallback(() => {
    setLocalItems([]);
    setShopifyCart(null);
    clearCartId();
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalAmount = shopifyCart
      ? parseFloat(shopifyCart.subtotalAmount || "0")
      : items.reduce(
          (sum, i) => sum + parseFloat(i.unitPriceAmount || "0") * i.quantity,
          0,
        );
    const subtotalCurrency =
      shopifyCart?.subtotalCurrency ??
      items[0]?.currencyCode ??
      "USD";
    const checkoutUrl = shopifyCart?.checkoutUrl ?? "";

    return {
      items,
      itemCount,
      subtotalAmount,
      subtotalCurrency,
      hydrated,
      lastAddedAt,
      lastAddedQuantity,
      isCartOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      checkoutUrl,
      isCartLoading,
    };
  }, [
    items,
    shopifyCart,
    hydrated,
    lastAddedAt,
    lastAddedQuantity,
    isCartOpen,
    openCart,
    closeCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    drawerOpen,
    isCartLoading,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
