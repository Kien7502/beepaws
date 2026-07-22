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

/** Image list override. Variant groups (combined listings) put SEPARATE
 * products on one page, so picking a flavour has to swap the whole gallery,
 * not just scroll to an index within the primary's images. null = use the
 * server-rendered list. */
export type ActiveImage = { url: string; altText: string | null };

type Ctx = {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  setActiveByUrl: (url: string | null | undefined) => void;
  activeVariant: ActiveVariant | null;
  setActiveVariant: (v: ActiveVariant | null) => void;
  activeImages: ActiveImage[] | null;
  /** Replaces the gallery's images and resets it to the first one. */
  setActiveImages: (images: ActiveImage[] | null) => void;
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
  const [activeImages, setActiveImagesState] = useState<ActiveImage[] | null>(null);

  // Keep a ref to the latest imageUrls so setActiveByUrl can stay stable —
  // otherwise its identity changes every render, which makes any consumer's
  // `useEffect([setActiveByUrl])` fire constantly. When a variant group has
  // swapped the gallery, resolve URLs against the OVERRIDE list instead.
  const urlsRef = useRef(imageUrls);
  urlsRef.current = imageUrls;
  const overrideRef = useRef<ActiveImage[] | null>(null);
  overrideRef.current = activeImages;

  const setActiveByUrl = useCallback((url: string | null | undefined) => {
    if (!url) return;
    const list = overrideRef.current?.map((i) => i.url) ?? urlsRef.current;
    const idx = list.findIndex((u) => u === url);
    if (idx >= 0) setActiveIndex(idx);
  }, []);

  // Swapping the image set always returns to the first image: index N of the
  // previous flavour means nothing in the new one.
  const setActiveImages = useCallback((images: ActiveImage[] | null) => {
    setActiveImagesState(images);
    setActiveIndex(0);
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
      activeImages,
      setActiveImages,
    }),
    [activeIndex, setActiveByUrl, activeVariant, activeImages, setActiveImages],
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
    activeImages: null,
    setActiveImages: () => {},
  };
}

export function useIsInsideMediaSync(): boolean {
  return useContext(MediaCtx) !== null;
}
