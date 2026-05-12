const STATS = [
  { value: "10,000+", label: "Happy pet parents" },
  { value: "4.8★", label: "Average review rating" },
  { value: "30 days", label: "Money-back guarantee" },
];

export function StatsTrustBar() {
  return (
    <div className="bg-[var(--color-primary)] py-10">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <span className="text-4xl font-black tracking-tight text-[#3d2400] md:text-5xl">
                {stat.value}
              </span>
              <span className="text-sm font-semibold text-[#3d2400]/70">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
