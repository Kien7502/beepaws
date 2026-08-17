import Image from "next/image";
import type { HomepageBlock } from "@/lib/shopify/homepage";

/**
 * Fills a homepage image slot: renders the admin-authored block image
 * (fill / object-cover) when present, otherwise the hardcoded placeholder
 * `children`. The caller owns the positioned, rounded container — this only
 * decides image-vs-placeholder, so every slot keeps its own aspect ratio and
 * fallback label. Server component (the homepage is server-rendered).
 */
export function HomeSlotImage({
  block,
  sizes,
  priority,
  children,
}: {
  block?: HomepageBlock;
  sizes: string;
  priority?: boolean;
  children: React.ReactNode;
}) {
  if (block?.image) {
    return (
      <Image
        src={block.image}
        alt={block.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }
  return <>{children}</>;
}
