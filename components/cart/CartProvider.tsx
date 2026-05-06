"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "beepaws_local_cart_v1";

export type LocalCartItem = {
  merchandiseId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  imageUrl: string;
  currencyCode: string;
  unitPriceAmount: string;
  quantity: number;
};

type CartContextValue = {
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
};

const CartContext = createContext<CartContextValue | null>(null);

function safeReadCart(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item?.merchandiseId === "string" &&
        typeof item?.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function safeWriteCart(items: LocalCartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota/storage errors in private mode
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return safeReadCart();
  });
  const [hydrated, setHydrated] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);
  const [lastAddedQuantity, setLastAddedQuantity] = useState(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) safeWriteCart(items);
  }, [items, hydrated]);

  const addItem = useCallback((next: LocalCartItem) => {
    setLastAddedAt(Date.now());
    setLastAddedQuantity(Math.max(1, next.quantity || 1));
    setItems((prev) => {
      const found = prev.find((p) => p.merchandiseId === next.merchandiseId);
      if (!found) return [...prev, next];
      return prev.map((p) =>
        p.merchandiseId === next.merchandiseId
          ? { ...p, quantity: Math.min(99, p.quantity + next.quantity) }
          : p,
      );
    });
  }, []);

  const updateQuantity = useCallback((merchandiseId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.merchandiseId === merchandiseId ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((merchandiseId: string) => {
    setItems((prev) => prev.filter((p) => p.merchandiseId !== merchandiseId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalAmount = items.reduce(
      (sum, i) => sum + parseFloat(i.unitPriceAmount || "0") * i.quantity,
      0,
    );
    const subtotalCurrency = items[0]?.currencyCode || "USD";
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
    };
  }, [
    items,
    hydrated,
    lastAddedAt,
    lastAddedQuantity,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
