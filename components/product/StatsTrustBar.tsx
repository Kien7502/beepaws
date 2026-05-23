import type { StatItem } from "@/types/metafields";

const DEFAULT_STATS: StatItem[] = [
  { value: "10,000+", label: "Happy pet parents" },
  { value: "4.8★",   label: "Average review rating" },
  { value: "30 days", label: "Money-back guarantee" },
];

interface Props {
  stats?: StatItem[] | null;
}

export function StatsTrustBar({ stats }: Props) {
  const data = stats && stats.length > 0 ? stats : DEFAULT_STATS;

  // Warm Honey: cocoa bg as a strong trust-proof moment between the gallery
  // and the comparison section. Stat numerals in gold (display font), labels
  // in soft cream.
  return (
    <div className="bg-cocoa py-12">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {data.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
              <span className="font-display text-4xl font-bold tracking-tight text-gold md:text-5xl">
                {stat.value}
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-[#D6D2C2]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
