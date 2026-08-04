"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

// Shared client state for the product page's left (gallery) and right (selector)
// columns. VariantSelector writes the matching variant image URL + the current
// variant's price/availability here when the user picks; ProductGallery reads
// activeIndex to render the matching image, and DynamicHeroPrice reads
// activeVariant to render a live-updating price in the hero. Soft-fails outside
// the provider so components stay usable standalone.

type ActiveVariant = {
  amount: string;
  currencyCode: string;
  availableForSale: boolean;
};

type Ctx = {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  setActiveByUrl: (url: string | null | undefined) => void;
  activeVariant: ActiveVariant | null;
  setActiveVariant: (v: ActiveVariant | null) => void;
};

const MediaCtx = createContext<Ctx | null>(null);

export function ProductMediaSync({
  imageUrls,
  children,
}: {
  imageUrls: string[];
  children: ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeVariant, setActiveVariant] = useState<ActiveVariant | null>(null);

  // Keep a ref to the latest imageUrls so setActiveByUrl can stay stable —
  // otherwise its identity changes every render, which makes any consumer's
  // `useEffect([setActiveByUrl])` fire constantly. For a variant group the
  // list is the combined reel of every member's images, so a member's own
  // image URL resolves to its index here.
  const urlsRef = useRef(imageUrls);
  urlsRef.current = imageUrls;

  const setActiveByUrl = useCallback((url: string | null | undefined) => {
    if (!url) return;
    const idx = urlsRef.current.findIndex((u) => u === url);
    if (idx >= 0) setActiveIndex(idx);
  }, []);

  // Memoise the context value so children only re-render when something
  // actually changes (not on every parent render).
  const value = useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      setActiveByUrl,
      activeVariant,
      setActiveVariant,
    }),
    [activeIndex, setActiveByUrl, activeVariant],
  );

  return <MediaCtx.Provider value={value}>{children}</MediaCtx.Provider>;
}

export function useProductMedia() {
  const ctx = useContext(MediaCtx);
  return ctx ?? {
    activeIndex: 0,
    setActiveIndex: () => {},
    setActiveByUrl: () => {},
    activeVariant: null,
    setActiveVariant: () => {},
  };
}

export function useIsInsideMediaSync(): boolean {
  return useContext(MediaCtx) !== null;
}
