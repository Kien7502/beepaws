import { Star } from "lucide-react";

const RATING = 4.8;
const REVIEW_COUNT = "2,400+";

const QUOTES = [
  { text: "Finally, grooming that doesn't stress them out!", author: "Sarah K." },
  { text: "Skipped the $80 groomer visit — so easy at home.", author: "Mike T." },
  { text: "My anxious dog actually stayed calm the whole time.", author: "Jessica L." },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <span key={i} className="relative inline-block">
            <Star className="h-4 w-4 text-[var(--color-border)]" fill="currentColor" />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${(rating % 1) * 100}%` }}
              >
                <Star className="h-4 w-4 text-[var(--color-primary)]" fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function SocialProofBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <StarRating rating={RATING} />
      <span className="text-sm font-extrabold text-[var(--color-foreground)]">
        {RATING}/5
      </span>
      <span className="text-sm text-[var(--color-accent)]/70">
        · {REVIEW_COUNT} happy pet parents
      </span>
    </div>
  );
}
