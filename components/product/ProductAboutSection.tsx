import Image from "next/image";
import { extractImagesFromProductHtml } from "@/lib/shopify/extract-description-images";

type Props = {
  html: string;
};

export function ProductAboutSection({ html }: Props) {
  const { strippedHtml, images } = extractImagesFromProductHtml(html);
  if (!strippedHtml && images.length === 0) return null;

  const showGallery = images.length > 0;

  return (
    <section
      className="mt-16 border-t border-[var(--color-border)] pt-14 md:mt-20 md:pt-16"
      aria-labelledby="product-description-heading"
    >
      <h2
        id="product-description-heading"
        className="text-2xl font-extrabold tracking-tight text-[var(--color-foreground)] md:text-3xl"
      >
        About this product
      </h2>

      {showGallery && (
        <div className="mt-8">
          {images.length === 1 ? (
            <div className="relative aspect-[21/9] max-h-[min(420px,50vh)] w-full overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--elev-shadow-card)] md:aspect-[2.4/1]">
              <Image
                src={images[0].src}
                alt={images[0].alt || "Product"}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1152px"
                priority={false}
              />
            </div>
          ) : images.length <= 4 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:gap-5 xl:grid-cols-4">
              {images.map((img, i) => (
                <li
                  key={`${img.src}-${i}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
                >
                  <Image
                    src={img.src}
                    alt={img.alt || `Product detail ${i + 1}`}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative">
              <div
                className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--color-primary)]/30"
                tabIndex={0}
                role="region"
                aria-label="Product photos from description"
              >
                {images.map((img, i) => (
                  <div
                    key={`${img.src}-${i}`}
                    className="relative h-[min(22rem,55vw)] w-[min(85vw,28rem)] shrink-0 snap-center overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--elev-shadow-card)]"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt || `Product detail ${i + 1}`}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 85vw, 28rem"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400 md:text-left">
                Swipe or scroll sideways to see all {images.length} photos
              </p>
            </div>
          )}
        </div>
      )}

      {strippedHtml ? (
        <div
          className={`product-html max-w-3xl ${showGallery ? "mt-10 md:mt-12" : "mt-8"}`}
          dangerouslySetInnerHTML={{ __html: strippedHtml }}
        />
      ) : null}
    </section>
  );
}
