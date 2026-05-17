import type { BeforeAfterSlide } from "@/types/metafields";
import Image from "next/image";

const DEFAULT_SLIDES: BeforeAfterSlide[] = [
  {
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeLabel: "Before",
    afterLabel: "After 3 Sessions",
    petName: "Bella, 4yr Chihuahua",
    caption: "Years of hardened tartar — chipped away at home, no anesthesia.",
  },
  {
    beforeImageUrl: "",
    afterImageUrl: "",
    beforeLabel: "Before",
    afterLabel: "After 2 Sessions",
    petName: "Max, 7yr Yorkshire Terrier",
    caption: null,
  },
];

interface Props {
  slides?: BeforeAfterSlide[] | null;
}

export function BeforeAfterSection({ slides }: Props) {
  const items = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;

  return (
    <section className="bg-[#fff3dc] py-14 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">

        <div className="mb-10 text-center">
          <h2 className="text-3xl font-black tracking-tight text-[var(--color-foreground)] md:text-4xl">
            See It For Yourself
          </h2>
          <p className="mt-2 text-base text-[var(--color-accent)]/70">
            Real results from real dog moms — no filters, no staging.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {items.map((slide, i) => (
            <div key={i}>
              <div className="flex flex-col items-stretch gap-4 sm:flex-row">

                {/* Before panel */}
                <div className="flex flex-1 flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-[var(--color-accent)]/40">
                    {slide.beforeImageUrl ? (
                      <Image
                        src={slide.beforeImageUrl}
                        alt={`Before — ${slide.petName ?? ""}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      /* IMAGE PLACEHOLDER — replace src when photography is ready */
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F0E8D8]">
                        <span className="text-4xl">📷</span>
                        <span className="text-xs text-[var(--color-accent)]/50">Before photo</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 self-center rounded-full bg-[var(--color-accent)] px-4 py-1 text-xs font-bold text-white">
                    {slide.beforeLabel ?? "Before"}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center text-3xl text-[var(--color-primary)]">→</div>

                {/* After panel */}
                <div className="flex flex-1 flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-[var(--color-primary)]">
                    {slide.afterImageUrl ? (
                      <Image
                        src={slide.afterImageUrl}
                        alt={`After — ${slide.petName ?? ""}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      /* IMAGE PLACEHOLDER — replace src when photography is ready */
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#FFF3DC]">
                        <span className="text-4xl">✨</span>
                        <span className="text-xs text-[var(--color-accent)]/50">After photo</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 self-center rounded-full bg-[var(--color-primary)] px-4 py-1 text-xs font-bold text-[#3d2400]">
                    {slide.afterLabel ?? "After 3 Sessions"}
                  </div>
                </div>
              </div>

              {(slide.petName || slide.caption) && (
                <div className="mt-4 text-center">
                  {slide.petName && (
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">{slide.petName}</p>
                  )}
                  {slide.caption && (
                    <p className="mt-1 text-sm text-[var(--color-accent)]/65">{slide.caption}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Micro-stats */}
        <div className="mt-12 flex flex-wrap justify-center gap-10">
          {[
            { value: "1–3", label: "sessions to see results" },
            { value: "Zero", label: "force or scraping required" },
            { value: "$0", label: "anesthesia risk" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-[var(--color-primary)]">{s.value}</div>
              <div className="mt-1 text-xs text-[var(--color-accent)]/65">{s.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
