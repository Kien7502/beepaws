"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/**
 * The floating add-to-cart bar MIRRORS the buy box (owner, 2026-10-11). It used
 * to add the product's first variant on its own — a white device at the base
 * price — whatever kit and colour the shopper had picked above it. Now the buy
 * box (VariantSelector) publishes what its own button would add, and the bar
 * shows exactly that and runs that same add, so the two can never disagree.
 *
 * A tiny store rather than context state: the summary changes on every pick,
 * and only the bar should re-render for it, not the whole page under the
 * provider.
 */
export type BuyBoxSummary = {
  /** What the buy box would add: the kit's name, or the product's. */
  title: string;
  /** The choices inside it: colour, flavours, quantities. */
  detail: string;
  /** Formatted total, as on the buy box's own button. */
  price: string;
  imageUrl: string | null;
  /** The buy box's button is enabled (something sellable is chosen). */
  available: boolean;
  /** The buy box just added it (its "Added to cart!" moment). */
  added: boolean;
};

type Store = {
  get: () => BuyBoxSummary | null;
  set: (s: BuyBoxSummary | null) => void;
  subscribe: (listener: () => void) => () => void;
  setAdd: (add: () => void) => void;
  add: () => void;
};

function createStore(): Store {
  let summary: BuyBoxSummary | null = null;
  let addFn: (() => void) | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => summary,
    set: (s) => {
      summary = s;
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setAdd: (add) => {
      addFn = add;
    },
    add: () => addFn?.(),
  };
}

const BuyBoxContext = createContext<Store | null>(null);

/** Wrap the buy box and the floating bar (ProductPageView does). */
export function BuyBoxSync({ children }: { children: ReactNode }) {
  const [store] = useState(createStore);
  return <BuyBoxContext.Provider value={store}>{children}</BuyBoxContext.Provider>;
}

/** Buy box side: publish what its button would add, and the add itself. */
export function usePublishBuyBox(summary: BuyBoxSummary, add: () => void) {
  const store = useContext(BuyBoxContext);
  // The latest add, so the bar always runs today's selection, not a stale one.
  useLayoutEffect(() => {
    store?.setAdd(add);
  });
  const { title, detail, price, imageUrl, available, added } = summary;
  useEffect(() => {
    store?.set({ title, detail, price, imageUrl, available, added });
  }, [store, title, detail, price, imageUrl, available, added]);
  useEffect(() => () => store?.set(null), [store]);
}

const noSubscribe = () => () => {};

/** Bar side: the buy box's summary (null until it has published) and its add. */
export function useBuyBox() {
  const store = useContext(BuyBoxContext);
  const summary = useSyncExternalStore(
    store?.subscribe ?? noSubscribe,
    () => store?.get() ?? null,
    () => null,
  );
  return { summary, add: () => store?.add() };
}
