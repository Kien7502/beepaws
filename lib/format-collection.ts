/** Human-readable collection titles from URL handles */
const SPECIAL: Record<string, string> = {
  all: "All products",
  dogs: "For Dogs",
  cats: "For Cats",
  new: "New Arrivals",
};

export function formatCollectionTitle(handle: string): string {
  const key = handle.toLowerCase();
  if (SPECIAL[key]) return SPECIAL[key];
  return key
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SUBTITLES: Record<string, string> = {
  dogs: "Beds, toys, leashes, and everyday care for dogs.",
  cats: "Trees, feeders, toys, and comfort for cats.",
  new: "Our latest arrivals and seasonal picks.",
};

export function getCollectionSubtitle(handle: string): string | undefined {
  return SUBTITLES[handle.toLowerCase()];
}
