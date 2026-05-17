"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

// Shared client state for the product page's left (gallery) and right (selector)
// columns. VariantSelector writes the matching variant image URL here when the
// user picks; ProductGallery reads activeIndex to render the matching image.
// Soft-fails outside the provider so components stay usable standalone.

type Ctx = {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  setActiveByUrl: (url: string | null | undefined) => void;
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

  // Keep a ref to the latest imageUrls so setActiveByUrl can stay stable —
  // otherwise its identity changes every render, which makes any consumer's
  // `useEffect([setActiveByUrl])` fire constantly.
  const urlsRef = useRef(imageUrls);
  urlsRef.current = imageUrls;

  const setActiveByUrl = useCallback((url: string | null | undefined) => {
    if (!url) return;
    const idx = urlsRef.current.findIndex((u) => u === url);
    if (idx >= 0) setActiveIndex(idx);
  }, []);

  // Memoise the context value so children only re-render when activeIndex
  // actually changes (not on every parent render).
  const value = useMemo(
    () => ({ activeIndex, setActiveIndex, setActiveByUrl }),
    [activeIndex, setActiveByUrl],
  );

  return <MediaCtx.Provider value={value}>{children}</MediaCtx.Provider>;
}

export function useProductMedia() {
  const ctx = useContext(MediaCtx);
  return ctx ?? {
    activeIndex: 0,
    setActiveIndex: () => {},
    setActiveByUrl: () => {},
  };
}

export function useIsInsideMediaSync(): boolean {
  return useContext(MediaCtx) !== null;
}
