export const SORT_OPTIONS = [
  { label: "Featured",           value: "featured",   sortKey: "PUBLISHED_AT", reverse: false },
  { label: "Newest",             value: "newest",     sortKey: "CREATED_AT",   reverse: true  },
  { label: "Name: A → Z",       value: "name-az",    sortKey: "TITLE",        reverse: false },
  { label: "Name: Z → A",       value: "name-za",    sortKey: "TITLE",        reverse: true  },
  { label: "Price: Low → High", value: "price-asc",  sortKey: "PRICE",        reverse: false },
  { label: "Price: High → Low", value: "price-desc", sortKey: "PRICE",        reverse: true  },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
