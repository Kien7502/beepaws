"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

// Shared client state for the product page's left (gallery) and right (selector)
// columns. VariantSelector writes the matching variant image URL here when the
// user picks; ProductGallery reads activeIndex to render the matching image.
// Soft-fails outside the provider so components stay usable standalone.

type Ctx = {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  setActiveByUrl: (url: string | null | undefined) => void;
  /** URL of the image currently shown, so callers can tell whether the gallery
   * is already on an image they'd otherwise scroll to (and skip a redundant,
   * flicker-causing jump). */
  activeUrl: string | null;
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
  // `useEffect([setActiveByUrl])` fire constantly. For a variant group the
  // list is the combined reel of every member's images, so a member's own
  // image URL resolves to its index here.
  const urlsRef = useRef(imageUrls);
  // Ref-mirror of activeIndex so setActiveByUrl can compare against the current
  // index without being recreated (it must stay identity-stable — consumers
  // depend on it in effects).
  const activeIndexRef = useRef(activeIndex);
  // Synced in a layout effect, not during render (react-hooks/refs). Layout
  // effects run before any passive effect or event handler that calls
  // setActiveByUrl, so it always sees the current values.
  useLayoutEffect(() => {
    urlsRef.current = imageUrls;
    activeIndexRef.current = activeIndex;
  });

  const setActiveByUrl = useCallback((url: string | null | undefined) => {
    if (!url) return;
    const idx = urlsRef.current.findIndex((u) => u === url);
    // Idempotent: targeting the image already shown is a no-op, so a redundant
    // call can't re-trigger the slide/thumb-scroll (the flicker).
    if (idx >= 0 && idx !== activeIndexRef.current) setActiveIndex(idx);
  }, []);

  const activeUrl = imageUrls[activeIndex] ?? null;

  // Memoise the context value so children only re-render when something
  // actually changes (not on every parent render).
  const value = useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      setActiveByUrl,
      activeUrl,
    }),
    [activeIndex, setActiveByUrl, activeUrl],
  );

  return <MediaCtx.Provider value={value}>{children}</MediaCtx.Provider>;
}

export function useProductMedia() {
  const ctx = useContext(MediaCtx);
  return ctx ?? {
    activeIndex: 0,
    setActiveIndex: () => {},
    setActiveByUrl: () => {},
    activeUrl: null,
  };
}

export function useIsInsideMediaSync(): boolean {
  return useContext(MediaCtx) !== null;
}
