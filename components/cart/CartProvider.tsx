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

  // Stable refs for stale-closure-safe debounce callbacks
  const shopifyCartRef = useRef<ShopifyCart | null>(null);
  shopifyCartRef.current = shopifyCart;
  const localItemsRef = useRef<LocalCartItem[]>([]);
  localItemsRef.current = localItems;

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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

    if (!hasStorefrontConfig()) {
      // Offline-only path
      setLocalItems((prev) => mergeLocalItem(prev, next));
      return;
    }

    // Optimistic local update while API call is in flight
    setLocalItems((prev) => mergeLocalItem(prev, next));

    setIsCartLoading(true);
    const line = { merchandiseId: next.merchandiseId, quantity: next.quantity };

    (async () => {
      try {
        const existingId = readCartId();
        let updated: ShopifyCart;

        if (existingId) {
          try {
            updated = await addCartLines(existingId, [line]);
          } catch {
            // Cart GID expired — start fresh
            updated = await apiCreateCart([line]);
          }
        } else {
          updated = await apiCreateCart([line]);
        }

        writeCartId(updated.id);
        setShopifyCart(updated);
        // Replace optimistic items with authoritative Shopify data
        setLocalItems(mapShopifyToLocal(updated));
      } catch (e) {
        console.error("[Cart] addItem sync failed:", e);
        // Keep the optimistic local state — user can still see their items
      } finally {
        setIsCartLoading(false);
      }
    })();
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

      const timer = setTimeout(async () => {
        debounceTimers.current.delete(merchandiseId);
        try {
          const updated =
            quantity <= 0
              ? await removeCartLine(cartId, lineId)
              : await updateCartLine(cartId, lineId, quantity);
          setShopifyCart(updated);
          setLocalItems(mapShopifyToLocal(updated));
        } catch (e) {
          console.error("[Cart] updateQuantity sync failed:", e);
        }
      }, DEBOUNCE_MS);

      debounceTimers.current.set(merchandiseId, timer);
    },
    [],
  );

  // ── removeItem (immediate) ────────────────────────────────────────────────

  const removeItem = useCallback((merchandiseId: string) => {
    // Optimistic removal
    setLocalItems((prev) => prev.filter((i) => i.merchandiseId !== merchandiseId));
    setShopifyCart((prev) =>
      prev
        ? { ...prev, lines: prev.lines.filter((l) => l.merchandiseId !== merchandiseId) }
        : prev,
    );

    const cartId = readCartId();
    if (!cartId || !hasStorefrontConfig()) return;

    const item = localItemsRef.current.find(
      (i) => i.merchandiseId === merchandiseId,
    );
    if (!item?.lineId) return;

    const lineId = item.lineId;
    removeCartLine(cartId, lineId)
      .then((updated) => {
        setShopifyCart(updated);
        setLocalItems(mapShopifyToLocal(updated));
      })
      .catch((e) => console.error("[Cart] removeItem sync failed:", e));
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
